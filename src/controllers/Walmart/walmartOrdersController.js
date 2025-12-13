import { getWalmartOrders } from '../../services/Walmart/walmartOrdersService.js';
import { asyncHandler } from '../../utils/error.js';

/**
 * GET /api/v1/walmart/orders
 * Get Walmart orders with optional filters
 * 
 * Headers:
 * - WM_SEC.ACCESS_TOKEN: Walmart access token (required)
 * 
 * Query Parameters (all optional):
 * - sku: Filter by SKU
 * - customerOrderId: Filter by customer order ID
 * - purchaseOrderId: Filter by purchase order ID
 * - status: Filter by status (Created, Acknowledged, Shipped, Delivered, Cancelled)
 * - createdStartDate: Start date for order creation (yyyy-MM-dd or yyyy-MM-dd'T'HH:mm:ssZ)
 * - createdEndDate: End date for order creation (yyyy-MM-dd or yyyy-MM-dd'T'HH:mm:ssZ)
 * - fromExpectedShipDate: Start date for expected ship date
 * - toExpectedShipDate: End date for expected ship date
 * - lastModifiedStartDate: Start date for last modification
 * - lastModifiedEndDate: End date for last modification
 * - limit: Maximum number of orders (default: 100, max: 200)
 * - productInfo: Include product info (true/false, default: false)
 * - shipNodeType: Filter by fulfillment type (SellerFulfilled, WFSFulfilled, 3PLFulfilled)
 * - shippingProgramType: Filter by shipping program (TWO_DAY, ONE_DAY)
 * - replacementInfo: Include replacement info (true/false, default: false)
 * - orderType: Filter by order type (REGULAR, REPLACEMENT, PREORDER)
 * - incentiveInfo: Include incentive info (true/false, default: false)
 */
export const getOrders = asyncHandler(async (req, res) => {
  // Get access token from headers
  const accessToken = req.headers['wm_sec.access_token'] || req.headers['WM_SEC.ACCESS_TOKEN'];
  
  if (!accessToken) {
    return res.status(400).json({
      success: false,
      message: 'WM_SEC.ACCESS_TOKEN header is required. Please provide your Walmart access token.',
    });
  }

  // Extract query parameters
  const queryParams = {
    sku: req.query.sku,
    customerOrderId: req.query.customerOrderId,
    purchaseOrderId: req.query.purchaseOrderId,
    status: req.query.status,
    createdStartDate: req.query.createdStartDate,
    createdEndDate: req.query.createdEndDate,
    fromExpectedShipDate: req.query.fromExpectedShipDate,
    toExpectedShipDate: req.query.toExpectedShipDate,
    lastModifiedStartDate: req.query.lastModifiedStartDate,
    lastModifiedEndDate: req.query.lastModifiedEndDate,
    limit: req.query.limit,
    productInfo: req.query.productInfo,
    shipNodeType: req.query.shipNodeType,
    shippingProgramType: req.query.shippingProgramType,
    replacementInfo: req.query.replacementInfo,
    orderType: req.query.orderType,
    incentiveInfo: req.query.incentiveInfo,
    nextCursor: req.query.nextCursor, // For pagination
  };

  // Call service to get orders
  const ordersData = await getWalmartOrders(accessToken, queryParams);

  res.status(200).json({
    success: true,
    message: 'Walmart orders retrieved successfully',
    data: ordersData,
  });
});

