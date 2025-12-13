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

// POST - Create new logistics shipped order (supports single or bulk)
export const createLogisticsShippedOrderHandler = asyncHandler(async (req, res, next) => {
  // Validate request body exists
  if (!req.body) {
    throw new ValidationError('Request body is required');
  }

  // Check if request body is an array (bulk) or single object
  const isBulk = Array.isArray(req.body);
  const ordersData = isBulk ? req.body : [req.body];

  // Validate ordersData is not empty
  if (!ordersData || ordersData.length === 0) {
    throw new ValidationError('At least one order is required');
  }

  // Handle file uploads (shared across all orders in bulk)
  let uploads = [];
  if (req.files && req.files.length > 0) {
    try {
      uploads = saveUploadedFiles(req.files);
    } catch (error) {
      throw error; // Re-throw AppError from service
    }
  }

  const createdOrders = [];
  const errors = [];

  // Process each order
  for (let i = 0; i < ordersData.length; i++) {
    const orderData = ordersData[i];
    
    // Validate orderData exists
    if (!orderData || typeof orderData !== 'object') {
      errors.push({
        index: i,
        error: `Order ${i + 1}: Invalid order data format`,
        data: orderData,
      });
      continue;
    }

    const { sku, orderOnMarketPlace, ordersJsonb, rateQuotesResponseJsonb, bolResponseJsonb, pickupResponseJsonb } = orderData;

    try {
      // Validate required fields - check for empty strings and null/undefined
      if (!sku || sku === '' || sku === '-' || !orderOnMarketPlace || orderOnMarketPlace === '' || orderOnMarketPlace === '-') {
        throw new ValidationError(`Order ${i + 1}: sku and orderOnMarketPlace are required (received: sku="${sku}", orderOnMarketPlace="${orderOnMarketPlace}")`);
      }

      // Parse JSON fields if they are strings
      const parsedOrdersJsonb = typeof ordersJsonb === 'string' ? JSON.parse(ordersJsonb) : ordersJsonb;
      const parsedRateQuotesJsonb = typeof rateQuotesResponseJsonb === 'string' ? JSON.parse(rateQuotesResponseJsonb) : rateQuotesResponseJsonb;
      const parsedBolJsonb = typeof bolResponseJsonb === 'string' ? JSON.parse(bolResponseJsonb) : bolResponseJsonb;
      const parsedPickupJsonb = typeof pickupResponseJsonb === 'string' ? JSON.parse(pickupResponseJsonb) : pickupResponseJsonb;

      // Check if order already exists with this SKU
      const existingOrders = await getAllLogisticsShippedOrders({
        page: 1,
        limit: 1,
        where: {
          sku: {
            equals: sku,
            mode: 'insensitive',
          },
        },
      });

      // If order exists and has shiptypes and subSKUs, skip creation
      if (existingOrders.orders && existingOrders.orders.length > 0) {
        const existingOrder = existingOrders.orders[0];
        const existingOrdersJsonb = existingOrder.ordersJsonb || {};
        const existingShiptypes = existingOrder.shippingType || existingOrdersJsonb.shiptypes || existingOrdersJsonb.shippingType;
        const existingSubSKUs = existingOrder.subSKUs || 
          (existingOrdersJsonb.subSKUs ? 
            (Array.isArray(existingOrdersJsonb.subSKUs) ? existingOrdersJsonb.subSKUs : 
             typeof existingOrdersJsonb.subSKUs === 'string' ? existingOrdersJsonb.subSKUs.split(',').map(s => s.trim()) : []) : 
           []);
        
        // Check if new subSKUs are provided
        const newSubSKUs = parsedOrdersJsonb?.subSKUs ? 
          (Array.isArray(parsedOrdersJsonb.subSKUs) ? parsedOrdersJsonb.subSKUs : 
           typeof parsedOrdersJsonb.subSKUs === 'string' ? parsedOrdersJsonb.subSKUs.split(',').map(s => s.trim()) : []) : 
         [];
        
        // If order has shiptypes and subSKUs, and new subSKUs haven't changed, skip
        if (existingShiptypes && existingSubSKUs.length > 0) {
          const existingSubSKUsSorted = [...existingSubSKUs].sort().join(',');
          const newSubSKUsSorted = newSubSKUs.length > 0 ? [...newSubSKUs].sort().join(',') : existingSubSKUsSorted;
          
          if (existingSubSKUsSorted === newSubSKUsSorted) {
            // Order already exists with same data, skip creation
            createdOrders.push(existingOrder);
            continue;
          } else {
            // SubSKUs changed, update the existing order
            const updateData = {
              ordersJsonb: {
                ...existingOrdersJsonb,
                ...parsedOrdersJsonb,
                shiptypes: parsedOrdersJsonb?.shiptypes || existingShiptypes,
                subSKUs: parsedOrdersJsonb?.subSKUs || existingOrdersJsonb.subSKUs,
              },
            };
            
            if (parsedRateQuotesJsonb) {
              updateData.rateQuotesResponseJsonb = parsedRateQuotesJsonb;
            }
            if (parsedBolJsonb) {
              updateData.bolResponseJsonb = parsedBolJsonb;
            }
            if (parsedPickupJsonb) {
              updateData.pickupResponseJsonb = parsedPickupJsonb;
            }
            
            const updatedOrder = await updateLogisticsShippedOrder(existingOrder.id.toString(), updateData);
            createdOrders.push(updatedOrder);
            continue;
          }
        }
      }

      // Create new order if it doesn't exist or doesn't have shiptypes/subSKUs
      const order = await createLogisticsShippedOrder({
        sku,
        orderOnMarketPlace,
        uploads: i === 0 ? uploads : [], // Only attach files to first order in bulk
        ordersJsonb: parsedOrdersJsonb || {},
        rateQuotesResponseJsonb: parsedRateQuotesJsonb || {},
        bolResponseJsonb: parsedBolJsonb || {},
        pickupResponseJsonb: parsedPickupJsonb || {},
      });

      createdOrders.push(order);
    } catch (error) {
      errors.push({
        index: i,
        error: error.message || 'Failed to create order',
        data: { sku, orderOnMarketPlace },
      });
    }
  }

  // If all orders failed
  if (createdOrders.length === 0 && errors.length > 0) {
    throw new ValidationError(`Failed to create orders: ${errors.map(e => e.error).join('; ')}`);
  }

  // Return response - same structure for both single and bulk
  if (isBulk) {
    res.status(201).json({
      message: `Successfully created ${createdOrders.length} of ${ordersData.length} order(s)`,
      success: true,
      created: createdOrders.length,
      total: ordersData.length,
      data: createdOrders,
      errors: errors.length > 0 ? errors : undefined,
    });
  } else {
    // Single order - return same structure as before for backward compatibility
    res.status(201).json({
      message: 'Logistics shipped order created successfully',
      data: createdOrders[0],
    });
  }
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
    const parsedRateQuotes = typeof rateQuotesResponseJsonb === 'string' ? JSON.parse(rateQuotesResponseJsonb) : rateQuotesResponseJsonb;
    // Merge with existing rateQuotesResponseJsonb if it exists
    if (existingOrder.rateQuotesResponseJsonb && typeof existingOrder.rateQuotesResponseJsonb === 'object') {
      updateData.rateQuotesResponseJsonb = {
        ...existingOrder.rateQuotesResponseJsonb,
        ...parsedRateQuotes,
      };
    } else {
      updateData.rateQuotesResponseJsonb = parsedRateQuotes;
    }
  }
  if (bolResponseJsonb !== undefined) {
    const parsedBol = typeof bolResponseJsonb === 'string' ? JSON.parse(bolResponseJsonb) : bolResponseJsonb;
    // Merge with existing bolResponseJsonb if it exists
    if (existingOrder.bolResponseJsonb && typeof existingOrder.bolResponseJsonb === 'object') {
      updateData.bolResponseJsonb = {
        ...existingOrder.bolResponseJsonb,
        ...parsedBol,
      };
    } else {
      updateData.bolResponseJsonb = parsedBol;
    }
  }
  if (pickupResponseJsonb !== undefined) {
    const parsedPickup = typeof pickupResponseJsonb === 'string' ? JSON.parse(pickupResponseJsonb) : pickupResponseJsonb;
    // Merge with existing pickupResponseJsonb if it exists
    if (existingOrder.pickupResponseJsonb && typeof existingOrder.pickupResponseJsonb === 'object') {
      updateData.pickupResponseJsonb = {
        ...existingOrder.pickupResponseJsonb,
        ...parsedPickup,
      };
    } else {
      updateData.pickupResponseJsonb = parsedPickup;
    }
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

