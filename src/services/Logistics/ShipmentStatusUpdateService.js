import { prisma } from '../../config/prismaClient.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { getShippingCompanyToken } from '../../models/Logistics/shippingCompanyTokenModel.js';
import { config } from '../../config/env.js';

/**
 * Parse time string (e.g., "5m", "10m", "1h") to milliseconds
 */
const parseTimeToMs = (timeStr) => {
  const unit = timeStr.slice(-1).toLowerCase();
  const value = parseInt(timeStr.slice(0, -1));

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000; // Default 5 minutes
  }
};

/**
 * Extract query parameters from all JSON fields (bolResponseJsonb, pickupResponseJsonb, rateQuotesResponseJsonb, ordersJsonb)
 */
const extractQueryParams = (order) => {
  const params = {};

  // Helper to safely get nested values
  const getValue = (obj, path) => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  };

  // Check bolResponseJsonb for PRO, BOL
  if (order.bolResponseJsonb && typeof order.bolResponseJsonb === 'object') {
    const bol = order.bolResponseJsonb;
    
    // Check referenceNumbers
    const refNumbers = getValue(bol, 'referenceNumbers') || getValue(bol, 'data.referenceNumbers');
    if (refNumbers) {
      if (refNumbers.pro) params.pro = refNumbers.pro;
      if (refNumbers.bol) params.bol = refNumbers.bol;
      if (refNumbers.shipmentConfirmationNumber) params.pro = refNumbers.shipmentConfirmationNumber;
    }
  }

  // Check pickupResponseJsonb for PUR
  if (order.pickupResponseJsonb && typeof order.pickupResponseJsonb === 'object') {
    const pickup = order.pickupResponseJsonb;
    const pickupId = getValue(pickup, 'pickupRequestId') || getValue(pickup, 'data.pickupRequestId') || getValue(pickup, 'id');
    if (pickupId) params.pur = pickupId;
  }

  // Check rateQuotesResponseJsonb for other numbers
  if (order.rateQuotesResponseJsonb && typeof order.rateQuotesResponseJsonb === 'object') {
    const quote = order.rateQuotesResponseJsonb;
    const quoteId = getValue(quote, 'quoteId') || getValue(quote, 'data.quoteId');
    if (quoteId) params.ldn = quoteId; // Adjust based on actual structure
  }

  // Check ordersJsonb for PO, EXL, etc.
  if (order.ordersJsonb && typeof order.ordersJsonb === 'object') {
    const orders = order.ordersJsonb;
    if (orders.po) params.po = orders.po;
    if (orders.purchaseOrder) params.po = orders.purchaseOrder;
    if (orders.exl) params.exl = orders.exl;
    if (orders.interlinePro) params.interlinePro = orders.interlinePro;
  }

  // Return null if no params found
  return Object.keys(params).length > 0 ? params : null;
};

/**
 * Get shipment history from Estes API
 */
const getShipmentHistory = async (shippingCompanyName, token, queryParams) => {
  const historyConfig = getEndpointConfig(shippingCompanyName, 'getShipmentHistory');
  
  if (!historyConfig) {
    throw new Error(`Shipment history endpoint not found for ${shippingCompanyName}`);
  }

  // Build query string
  const queryString = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value) {
      // Handle interline-pro key (URLSearchParams handles it correctly)
      const paramKey = key === 'interlinePro' ? 'interline-pro' : key;
      queryString.append(paramKey, value);
    }
  });

  const url = `${historyConfig.url}?${queryString.toString()}`;

  const response = await fetch(url, {
    method: historyConfig.method,
    headers: {
      ...historyConfig.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return await response.json();
};

/**
 * Determine status from shipment history response
 */
const determineStatus = (historyResponse) => {
  // Adjust based on actual API response structure
  if (!historyResponse || !historyResponse.data) {
    return 'pending';
  }

  const data = historyResponse.data;
  
  // Check for delivery status
  if (data.deliveryDate || data.status === 'DELIVERED') {
    return 'delivered';
  }
  
  // Check for in-transit
  if (data.status === 'IN_TRANSIT' || data.status === 'PICKED_UP') {
    return 'in_transit';
  }
  
  // Check for pickup
  if (data.status === 'PICKED_UP' || data.pickupDate) {
    return 'picked_up';
  }

  // Default
  return data.status?.toLowerCase() || 'pending';
};

/**
 * Update status for all logistics shipped orders
 */
export const updateShipmentStatuses = async () => {
  try {
    console.log('[Status Update] Starting shipment status update...');

    // Get all logistics shipped orders
    const orders = await prisma.logisticsShippedOrders.findMany({
      where: {
        status: {
          not: 'delivered', // Skip already delivered orders
        },
      },
    });

    console.log(`[Status Update] Found ${orders.length} orders to check`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Extract query parameters from all JSON fields
        const queryParams = extractQueryParams(order);

        if (!queryParams) {
          console.log(`[Status Update] No query params found for order ID ${order.id}, skipping...`);
          continue;
        }

        // Get shipping company name (default to 'estes')
        const shippingCompanyName = 'estes';

        // Get token from database
        const tokenRecord = await getShippingCompanyToken(shippingCompanyName);
        if (!tokenRecord || !tokenRecord.token) {
          console.log(`[Status Update] No token found for ${shippingCompanyName}, skipping order ID ${order.id}`);
          continue;
        }

        // Call shipment history API
        const historyResponse = await getShipmentHistory(
          shippingCompanyName,
          tokenRecord.token,
          queryParams
        );

        // Determine new status
        const newStatus = determineStatus(historyResponse);

        // Update order status if changed
        if (newStatus !== order.status) {
          await prisma.logisticsShippedOrders.update({
            where: { id: order.id },
            data: { status: newStatus },
          });
          updatedCount++;
          console.log(`[Status Update] Updated order ID ${order.id} status: ${order.status} -> ${newStatus}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[Status Update] Error updating order ID ${order.id}:`, error.message);
      }
    }

    console.log(`[Status Update] Completed. Updated: ${updatedCount}, Errors: ${errorCount}`);
    return { updated: updatedCount, errors: errorCount, total: orders.length };
  } catch (error) {
    console.error('[Status Update] Fatal error:', error);
    throw error;
  }
};

/**
 * Start periodic status update service
 */
export const startStatusUpdateService = () => {
  const updateInterval = parseTimeToMs(config.shipping.statusUpdateTime);
  
  console.log(`[Status Update Service] Starting with interval: ${config.shipping.statusUpdateTime} (${updateInterval}ms)`);

  // Run immediately on startup
  updateShipmentStatuses().catch(console.error);

  // Then run periodically
  const intervalId = setInterval(() => {
    updateShipmentStatuses().catch(console.error);
  }, updateInterval);

  return intervalId;
};

