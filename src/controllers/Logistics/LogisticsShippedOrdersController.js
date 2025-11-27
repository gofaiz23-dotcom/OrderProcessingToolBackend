import {
  createLogisticsShippedOrder,
  getAllLogisticsShippedOrders,
  getLogisticsShippedOrderById,
  updateLogisticsShippedOrder,
  deleteLogisticsShippedOrder,
  deleteLogisticsShippedOrdersByDateRange,
} from '../../models/Logistics/logisticsShippedOrdersModel.js';
import { saveUploadedFiles } from '../../services/Logistics/LogisticsShippedOrdersService.js';
import { NotFoundError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

// POST - Create new logistics shipped order
export const createLogisticsShippedOrderHandler = asyncHandler(async (req, res, next) => {
  const { sku, orderOnMarketPlace, ordersJsonb, rateQuotesResponseJsonb, bolResponseJsonb, pickupResponseJsonb } = req.body;

  // Validate required fields
  if (!sku || !orderOnMarketPlace) {
    throw new ValidationError('sku and orderOnMarketPlace are required');
  }

  // Handle file uploads
  let uploads = [];
  if (req.files && req.files.length > 0) {
    try {
      uploads = saveUploadedFiles(req.files);
    } catch (error) {
      throw error; // Re-throw AppError from service
    }
  }

  // Parse JSON fields if they are strings
  const parsedOrdersJsonb = typeof ordersJsonb === 'string' ? JSON.parse(ordersJsonb) : ordersJsonb;
  const parsedRateQuotesJsonb = typeof rateQuotesResponseJsonb === 'string' ? JSON.parse(rateQuotesResponseJsonb) : rateQuotesResponseJsonb;
  const parsedBolJsonb = typeof bolResponseJsonb === 'string' ? JSON.parse(bolResponseJsonb) : bolResponseJsonb;
  const parsedPickupJsonb = typeof pickupResponseJsonb === 'string' ? JSON.parse(pickupResponseJsonb) : pickupResponseJsonb;

  const order = await createLogisticsShippedOrder({
    sku,
    orderOnMarketPlace,
    uploads,
    ordersJsonb: parsedOrdersJsonb || {},
    rateQuotesResponseJsonb: parsedRateQuotesJsonb || {},
    bolResponseJsonb: parsedBolJsonb || {},
    pickupResponseJsonb: parsedPickupJsonb || {},
  });

  res.status(201).json({
    message: 'Logistics shipped order created successfully',
    data: order,
  });
});

// GET - Get all logistics shipped orders
export const getAllLogisticsShippedOrdersHandler = asyncHandler(async (req, res, next) => {
  const orders = await getAllLogisticsShippedOrders();

  res.status(200).json({
    message: 'Logistics shipped orders retrieved successfully',
    count: orders.length,
    data: orders,
  });
});

// GET - Get logistics shipped order by ID
export const getLogisticsShippedOrderByIdHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await getLogisticsShippedOrderById(id);

  if (!order) {
    throw new NotFoundError(`Logistics shipped order with ID ${id} not found`);
  }

  res.status(200).json({
    message: 'Logistics shipped order retrieved successfully',
    data: order,
  });
});

// PUT - Update logistics shipped order
export const updateLogisticsShippedOrderHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { sku, orderOnMarketPlace, ordersJsonb, rateQuotesResponseJsonb, bolResponseJsonb, pickupResponseJsonb } = req.body;

  // Check if order exists
  const existingOrder = await getLogisticsShippedOrderById(id);
  if (!existingOrder) {
    throw new NotFoundError(`Logistics shipped order with ID ${id} not found`);
  }

  // Handle file uploads
  let uploads = existingOrder.uploads || [];
  if (req.files && req.files.length > 0) {
    try {
      const newUploads = saveUploadedFiles(req.files);
      uploads = [...uploads, ...newUploads];
    } catch (error) {
      throw error;
    }
  }

  // Prepare update data
  const updateData = {};
  if (sku !== undefined) updateData.sku = sku;
  if (orderOnMarketPlace !== undefined) updateData.orderOnMarketPlace = orderOnMarketPlace;
  if (uploads.length > 0) updateData.uploads = uploads;
  if (ordersJsonb !== undefined) {
    updateData.ordersJsonb = typeof ordersJsonb === 'string' ? JSON.parse(ordersJsonb) : ordersJsonb;
  }
  if (rateQuotesResponseJsonb !== undefined) {
    updateData.rateQuotesResponseJsonb = typeof rateQuotesResponseJsonb === 'string' ? JSON.parse(rateQuotesResponseJsonb) : rateQuotesResponseJsonb;
  }
  if (bolResponseJsonb !== undefined) {
    updateData.bolResponseJsonb = typeof bolResponseJsonb === 'string' ? JSON.parse(bolResponseJsonb) : bolResponseJsonb;
  }
  if (pickupResponseJsonb !== undefined) {
    updateData.pickupResponseJsonb = typeof pickupResponseJsonb === 'string' ? JSON.parse(pickupResponseJsonb) : pickupResponseJsonb;
  }

  const updatedOrder = await updateLogisticsShippedOrder(id, updateData);

  res.status(200).json({
    message: 'Logistics shipped order updated successfully',
    data: updatedOrder,
  });
});

// DELETE - Delete logistics shipped order by ID
export const deleteLogisticsShippedOrderHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existingOrder = await getLogisticsShippedOrderById(id);
  if (!existingOrder) {
    throw new NotFoundError(`Logistics shipped order with ID ${id} not found`);
  }

  await deleteLogisticsShippedOrder(id);

  res.status(200).json({
    message: 'Logistics shipped order deleted successfully',
  });
});

// DELETE - Delete logistics shipped orders by date range
export const deleteLogisticsShippedOrdersByDateRangeHandler = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ValidationError('startDate and endDate query parameters are required (format: YYYY-MM-DD)');
  }

  // Validate date format
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format. Use YYYY-MM-DD format');
  }

  if (start > end) {
    throw new ValidationError('startDate must be before or equal to endDate');
  }

  const result = await deleteLogisticsShippedOrdersByDateRange(startDate, endDate);

  res.status(200).json({
    message: `Deleted ${result.count} logistics shipped order(s) between ${startDate} and ${endDate}`,
    count: result.count,
  });
});

