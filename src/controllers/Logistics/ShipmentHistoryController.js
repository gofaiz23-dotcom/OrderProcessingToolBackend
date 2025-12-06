import { getShipmentHistory } from '../../services/Logistics/ShipmentHistoryService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { updateLogisticsShippedOrdersStatus, updateLogisticsShippedOrdersStatusMultiple } from '../../models/Logistics/logisticsShippedOrdersModel.js';
import { AuthenticationError, NotFoundError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const getShipmentHistoryHandler = asyncHandler(async (req, res, next) => {
  // Get Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError(ErrorMessages.MISSING_TOKEN);
  }

  const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Get shipping company from query parameters
  const { shippingCompany, company, pro, po, bol, pur, ldn, exl, interlinePro, referenceNumbers } = req.query;
  
  // Support both 'shippingCompany' and 'company' for flexibility
  const companyName = shippingCompany || company;

  if (!companyName) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('shippingCompany or company'));
  }

  // Get shipping company config using helper function
  const historyConfig = getEndpointConfig(companyName, 'getShipmentHistory');
  if (!historyConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND(`getShipmentHistory for company: ${companyName}`));
  }

  const shippingCompanyName = historyConfig.shippingCompanyName;

  // Prepare query parameters object
  // Support both Estes format (multiple params) and XPO format (referenceNumbers)
  const queryParams = {
    pro: pro || null,
    po: po || null,
    bol: bol || null,
    pur: pur || null,
    ldn: ldn || null,
    exl: exl || null,
    interlinePro: interlinePro || null,
    referenceNumbers: referenceNumbers || null, // XPO format
  };

  // Get shipment history with token and query params
  const historyResponse = await getShipmentHistory(
    shippingCompanyName,
    bearerToken,
    queryParams
  );

  res.status(200).json({
    message: `Shipment history retrieved successfully for ${shippingCompanyName}`,
    shippingCompanyName,
    data: historyResponse,
  });
});

// PUT - Update status for single or multiple logistics shipped orders
// Supports two formats:
// 1. Single status for single/multiple IDs: { "ids": 1, "status": "delivered" } or { "ids": [1,2,3], "status": "delivered" }
// 2. Multiple IDs with different statuses: { "updates": [{ "id": 1, "status": "delivered" }, { "id": 2, "status": "in_transit" }] }
export const updateShipmentStatusHandler = asyncHandler(async (req, res, next) => {
  const { ids, status, updates } = req.body;

  // Check if using the new format (multiple IDs with different statuses)
  if (updates && Array.isArray(updates) && updates.length > 0) {
    // Validate updates array
    for (const update of updates) {
      if (!update.id || update.id === null || update.id === undefined) {
        throw new ValidationError('Each update object must have an "id" field');
      }
      if (!update.status || typeof update.status !== 'string' || update.status.trim() === '') {
        throw new ValidationError('Each update object must have a non-empty "status" field');
      }
    }

    // Update multiple orders with different statuses
    const result = await updateLogisticsShippedOrdersStatusMultiple(updates);

    res.status(200).json({
      message: `Status updated successfully for ${result.count} order(s)`,
      count: result.count,
      updates: updates.map(u => ({ id: u.id, status: u.status.trim() })),
    });
    return;
  }

  // Legacy format: single status for single/multiple IDs
  if (!ids || (Array.isArray(ids) && ids.length === 0)) {
    throw new ValidationError('Either "ids" and "status" fields, or "updates" array is required');
  }

  if (!status || typeof status !== 'string' || status.trim() === '') {
    throw new ValidationError('status field is required and must be a non-empty string');
  }

  // Update status for the provided IDs
  const result = await updateLogisticsShippedOrdersStatus(ids, status.trim());

  res.status(200).json({
    message: `Status updated successfully for ${result.count} order(s)`,
    count: result.count,
    ids: Array.isArray(ids) ? ids : [ids],
    status: status.trim(),
  });
});

