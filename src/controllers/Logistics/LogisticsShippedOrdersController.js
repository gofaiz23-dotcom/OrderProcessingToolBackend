import {
  createLogisticsShippedOrder,
  getAllLogisticsShippedOrders,
  getLogisticsShippedOrderById,
  updateLogisticsShippedOrder,
  deleteLogisticsShippedOrder,
  deleteLogisticsShippedOrdersByDateRange,
  getAllOrdersJsonb,
  getOrdersJsonbById,
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

// GET - Get all logistics shipped orders with pagination, filtering, and sorting
export const getAllLogisticsShippedOrdersHandler = asyncHandler(async (req, res, next) => {
  // Extract pagination params from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  
  // Extract filter params
  const sku = req.query.sku;
  const orderOnMarketPlace = req.query.orderOnMarketPlace;
  const status = req.query.status;
  
  // Extract bolResponseJsonb filter params
  const bolVersion = req.query.bolVersion;
  const messageStatusCode = req.query.messageStatusCode;
  const messageStatusStatus = req.query.messageStatusStatus;
  const messageStatusMessage = req.query.messageStatusMessage;
  const transactionDate = req.query.transactionDate;
  const transactionDateStart = req.query.transactionDateStart;
  const transactionDateEnd = req.query.transactionDateEnd;
  const referencePro = req.query.referencePro;
  const shipmentConfirmationNumber = req.query.shipmentConfirmationNumber;
  
  // Extract sort params (default: createdAt desc)
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  
  // Build where clause for filtering
  const where = {};
  if (sku) {
    where.sku = {
      contains: sku,
      mode: 'insensitive', // Case-insensitive search
    };
  }
  if (orderOnMarketPlace) {
    where.orderOnMarketPlace = {
      contains: orderOnMarketPlace,
      mode: 'insensitive',
    };
  }
  if (status) {
    where.status = {
      equals: status,
      mode: 'insensitive',
    };
  }
  
  // Build JSONB filters for bolResponseJsonb
  // Note: Prisma JSON filtering uses path array notation
  const bolFilters = [];
  
  if (bolVersion) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['version'],
        equals: bolVersion,
      },
    });
  }
  
  if (messageStatusCode) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['messageStatus', 'code'],
        equals: messageStatusCode,
      },
    });
  }
  
  if (messageStatusStatus) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['messageStatus', 'status'],
        equals: messageStatusStatus,
      },
    });
  }
  
  if (messageStatusMessage) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['messageStatus', 'message'],
        string_contains: messageStatusMessage,
      },
    });
  }
  
  if (transactionDate) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['transactionDate'],
        equals: transactionDate,
      },
    });
  }
  
  // Date range filtering for transactionDate
  if (transactionDateStart || transactionDateEnd) {
    const dateFilterConditions = [];
    if (transactionDateStart) {
      dateFilterConditions.push({
        bolResponseJsonb: {
          path: ['transactionDate'],
          gte: transactionDateStart,
        },
      });
    }
    if (transactionDateEnd) {
      dateFilterConditions.push({
        bolResponseJsonb: {
          path: ['transactionDate'],
          lte: transactionDateEnd,
        },
      });
    }
    bolFilters.push(...dateFilterConditions);
  }
  
  if (referencePro) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['referenceNumbers', 'pro'],
        equals: referencePro,
      },
    });
  }
  
  if (shipmentConfirmationNumber) {
    bolFilters.push({
      bolResponseJsonb: {
        path: ['referenceNumbers', 'shipmentConfirmationNumber'],
        equals: shipmentConfirmationNumber,
      },
    });
  }
  
  // Combine all filters with AND logic
  if (bolFilters.length > 0) {
    if (where.AND) {
      where.AND = [...where.AND, ...bolFilters];
    } else {
      where.AND = bolFilters;
    }
  }
  
  // Build orderBy clause
  const orderBy = {};
  if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'id') {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = 'desc'; // Default fallback
  }
  
  // Get paginated orders
  const result = await getAllLogisticsShippedOrders({
    page,
    limit,
    where,
    orderBy,
  });
  
  res.status(200).json({
    message: 'Logistics shipped orders retrieved successfully',
    success: true,
    ...result,
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

// GET - Get all ordersJsonb only (for marketing/user details extraction)
export const getAllOrdersJsonbHandler = asyncHandler(async (req, res, next) => {
  // Extract pagination params from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  
  // Extract filter params
  const orderOnMarketPlace = req.query.orderOnMarketPlace;
  
  // Extract sort params (default: createdAt desc)
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  
  // Build where clause for filtering
  const where = {};
  if (orderOnMarketPlace) {
    where.orderOnMarketPlace = {
      contains: orderOnMarketPlace,
      mode: 'insensitive',
    };
  }
  
  // Build orderBy clause
  const orderBy = {};
  if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'id') {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = 'desc'; // Default fallback
  }
  
  // Get paginated orders with only ordersJsonb
  const result = await getAllOrdersJsonb({
    page,
    limit,
    where,
    orderBy,
  });
  
  res.status(200).json({
    message: 'Orders JSONB retrieved successfully',
    success: true,
    ...result,
  });
});

// GET - Get ordersJsonb by ID
export const getOrdersJsonbByIdHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await getOrdersJsonbById(id);

  if (!order) {
    throw new NotFoundError(`Order with ID ${id} not found`);
  }

  res.status(200).json({
    message: 'Order JSONB retrieved successfully',
    data: order,
  });
});

