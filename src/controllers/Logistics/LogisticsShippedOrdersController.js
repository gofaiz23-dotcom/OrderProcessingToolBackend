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

  // Handle both FormData and JSON requests
  // If req.body has direct fields (FormData), convert to array format
  // If req.body is an array (bulk JSON), use as-is
  // If req.body is an object with fields (single JSON), wrap in array
  const isBulk = Array.isArray(req.body);
  let ordersData = [];
  
  if (isBulk) {
    // Bulk JSON request
    ordersData = req.body;
  } else if (req.body.sku && req.body.orderOnMarketPlace) {
    // Single FormData or JSON request - wrap in array
    ordersData = [req.body];
  } else {
    throw new ValidationError('Invalid request format');
  }

  // Validate ordersData is not empty
  if (!ordersData || ordersData.length === 0) {
    throw new ValidationError('At least one order is required');
  }

  // Handle file uploads (shared across all orders in bulk)
  let uploads = [];
  
  // Debug: Log request details
  console.log('📥 Request received:', {
    hasFiles: !!req.files,
    filesLength: req.files?.length || 0,
    files: req.files,
    contentType: req.headers['content-type'],
    isMultipart: req.headers['content-type']?.includes('multipart/form-data'),
    bodyKeys: req.body ? Object.keys(req.body) : [],
  });
  
  if (req.files && req.files.length > 0) {
    try {
      uploads = saveUploadedFiles(req.files);
      console.log('✅ Files saved:', uploads.length, 'files. Paths:', uploads);
    } catch (error) {
      console.error('❌ Error saving files:', error);
      throw error; // Re-throw AppError from service
    }
  } else {
    console.log('⚠️ No files in req.files. req.files:', req.files);
    console.log('⚠️ Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
    });
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

    const { sku, orderOnMarketPlace, ordersJsonb, rateQuotesRequestJsonb, rateQuotesResponseJsonb, bolResponseJsonb, pickupResponseJsonb, shippingType, subSKUs } = orderData;

    try {
      // Validate required fields - check for empty strings and null/undefined
      if (!sku || sku === '' || sku === '-' || !orderOnMarketPlace || orderOnMarketPlace === '' || orderOnMarketPlace === '-') {
        throw new ValidationError(`Order ${i + 1}: sku and orderOnMarketPlace are required (received: sku="${sku}", orderOnMarketPlace="${orderOnMarketPlace}")`);
      }

      // Parse JSON fields if they are strings
      const parsedOrdersJsonb = typeof ordersJsonb === 'string' ? JSON.parse(ordersJsonb) : ordersJsonb;
      const parsedRateQuotesRequestJsonb = typeof rateQuotesRequestJsonb === 'string' ? JSON.parse(rateQuotesRequestJsonb) : rateQuotesRequestJsonb;
      const parsedRateQuotesResponseJsonb = typeof rateQuotesResponseJsonb === 'string' ? JSON.parse(rateQuotesResponseJsonb) : rateQuotesResponseJsonb;
      
      // Combine request and response into rateQuotesResponseJsonb (since schema only has this field)
      // Structure: { xpo: { request: ..., response: ... }, estes: { request: ..., response: ... } }
      let finalRateQuotesJsonb = {};
      if (parsedRateQuotesRequestJsonb || parsedRateQuotesResponseJsonb) {
        // If both exist, combine them
        if (parsedRateQuotesRequestJsonb && parsedRateQuotesResponseJsonb) {
          // Both have carrier keys (xpo/estes), merge them
          Object.keys(parsedRateQuotesRequestJsonb).forEach(carrier => {
            finalRateQuotesJsonb[carrier] = {
              request: parsedRateQuotesRequestJsonb[carrier],
              response: parsedRateQuotesResponseJsonb[carrier] || parsedRateQuotesResponseJsonb,
            };
          });
          // Also handle if response has carrier keys but request doesn't
          Object.keys(parsedRateQuotesResponseJsonb).forEach(carrier => {
            if (!finalRateQuotesJsonb[carrier]) {
              finalRateQuotesJsonb[carrier] = {
                request: parsedRateQuotesRequestJsonb || {},
                response: parsedRateQuotesResponseJsonb[carrier],
              };
            }
          });
        } else if (parsedRateQuotesRequestJsonb) {
          // Only request exists
          finalRateQuotesJsonb = parsedRateQuotesRequestJsonb;
        } else {
          // Only response exists (backward compatibility)
          finalRateQuotesJsonb = parsedRateQuotesResponseJsonb;
        }
      }
      
      const parsedBolJsonb = typeof bolResponseJsonb === 'string' ? JSON.parse(bolResponseJsonb) : bolResponseJsonb;
      const parsedPickupJsonb = typeof pickupResponseJsonb === 'string' ? JSON.parse(pickupResponseJsonb) : pickupResponseJsonb;
      
      // Parse subSKUs if it's a JSON string
      let parsedSubSKUs = null;
      if (subSKUs !== undefined && subSKUs !== null) {
        if (typeof subSKUs === 'string') {
          try {
            parsedSubSKUs = JSON.parse(subSKUs);
          } catch {
            // If not JSON, treat as comma-separated string
            parsedSubSKUs = subSKUs.split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        } else if (Array.isArray(subSKUs)) {
          parsedSubSKUs = subSKUs;
        }
      }

      // Merge shippingType and subSKUs into ordersJsonb
      const finalOrdersJsonb = {
        ...(parsedOrdersJsonb || {}),
      };
      
      // Add shippingType to ordersJsonb if provided
      if (shippingType && shippingType !== '' && shippingType !== '-') {
        finalOrdersJsonb.shiptypes = shippingType;
        finalOrdersJsonb.shippingType = shippingType;
      }
      
      // Add subSKUs to ordersJsonb if provided
      if (parsedSubSKUs && parsedSubSKUs.length > 0) {
        const subSKUsString = Array.isArray(parsedSubSKUs) ? parsedSubSKUs.join(', ') : String(parsedSubSKUs);
        finalOrdersJsonb.subSKUs = subSKUsString;
        finalOrdersJsonb.subSKU = subSKUsString;
      }
      
      // Debug log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating order with finalOrdersJsonb:', {
          shippingType,
          parsedSubSKUs,
          finalOrdersJsonb,
        });
      }

      // Always create new order - don't check for duplicates by SKU
      // Each order should be unique, even if SKU and customer are the same
      // Updates should only be done using ID (not SKU)
      // For single orders or first order in bulk, attach files
      const orderUploads = (ordersData.length === 1 || i === 0) ? uploads : [];
      
      console.log(`Creating order ${i + 1}/${ordersData.length}:`, {
        sku,
        orderOnMarketPlace,
        uploadsCount: orderUploads.length,
        uploads: orderUploads,
      });
      
      const order = await createLogisticsShippedOrder({
        sku,
        orderOnMarketPlace,
        uploads: orderUploads,
        ordersJsonb: finalOrdersJsonb,
        rateQuotesResponseJsonb: finalRateQuotesJsonb,
        bolResponseJsonb: parsedBolJsonb || {},
        pickupResponseJsonb: parsedPickupJsonb || {},
      });
      
      console.log(`✅ Order created with ID: ${order.id}, uploads:`, order.uploads);

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
  // Log created orders to verify uploads are included
  if (process.env.NODE_ENV === 'development') {
    console.log('Created orders with uploads:', createdOrders.map(o => ({
      id: o.id,
      sku: o.sku,
      uploads: o.uploads,
      uploadsLength: o.uploads?.length || 0,
    })));
  }
  
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
  const { sku, orderOnMarketPlace, ordersJsonb, rateQuotesRequestJsonb, rateQuotesResponseJsonb, bolResponseJsonb, pickupResponseJsonb, shippingType, subSKUs } = req.body;

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
  
  // Handle ordersJsonb - merge with shippingType and subSKUs if provided
  if (ordersJsonb !== undefined || shippingType !== undefined || subSKUs !== undefined) {
    const existingOrdersJsonb = existingOrder.ordersJsonb || {};
    const parsedOrdersJsonb = ordersJsonb !== undefined 
      ? (typeof ordersJsonb === 'string' ? JSON.parse(ordersJsonb) : ordersJsonb)
      : existingOrdersJsonb;
    
    // Parse subSKUs if provided
    let parsedSubSKUs = null;
    if (subSKUs !== undefined && subSKUs !== null) {
      if (typeof subSKUs === 'string') {
        try {
          parsedSubSKUs = JSON.parse(subSKUs);
        } catch {
          // If not JSON, treat as comma-separated string
          parsedSubSKUs = subSKUs.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      } else if (Array.isArray(subSKUs)) {
        parsedSubSKUs = subSKUs;
      }
    }
    
    // Merge shippingType and subSKUs into ordersJsonb
    updateData.ordersJsonb = {
      ...existingOrdersJsonb,
      ...parsedOrdersJsonb,
    };
    
    // Add shippingType to ordersJsonb if provided
    if (shippingType && shippingType !== '' && shippingType !== '-') {
      updateData.ordersJsonb.shiptypes = shippingType;
      updateData.ordersJsonb.shippingType = shippingType;
    }
    
    // Add subSKUs to ordersJsonb if provided
    if (parsedSubSKUs && parsedSubSKUs.length > 0) {
      const subSKUsString = Array.isArray(parsedSubSKUs) ? parsedSubSKUs.join(', ') : String(parsedSubSKUs);
      updateData.ordersJsonb.subSKUs = subSKUsString;
      updateData.ordersJsonb.subSKU = subSKUsString;
    }
    
    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating order with ordersJsonb:', {
        shippingType,
        parsedSubSKUs,
        ordersJsonb: updateData.ordersJsonb,
      });
    }
  }
  // Handle rate quotes - combine request and response
  if (rateQuotesRequestJsonb !== undefined || rateQuotesResponseJsonb !== undefined) {
    const parsedRequest = rateQuotesRequestJsonb !== undefined 
      ? (typeof rateQuotesRequestJsonb === 'string' ? JSON.parse(rateQuotesRequestJsonb) : rateQuotesRequestJsonb)
      : null;
    const parsedResponse = rateQuotesResponseJsonb !== undefined
      ? (typeof rateQuotesResponseJsonb === 'string' ? JSON.parse(rateQuotesResponseJsonb) : rateQuotesResponseJsonb)
      : null;
    
    // Combine request and response
    let finalRateQuotes = {};
    if (parsedRequest && parsedResponse) {
      // Both exist - combine by carrier
      Object.keys(parsedRequest).forEach(carrier => {
        finalRateQuotes[carrier] = {
          request: parsedRequest[carrier],
          response: parsedResponse[carrier] || parsedResponse,
        };
      });
      Object.keys(parsedResponse).forEach(carrier => {
        if (!finalRateQuotes[carrier]) {
          finalRateQuotes[carrier] = {
            request: parsedRequest || {},
            response: parsedResponse[carrier],
          };
        }
      });
    } else if (parsedRequest) {
      finalRateQuotes = parsedRequest;
    } else if (parsedResponse) {
      finalRateQuotes = parsedResponse;
    }
    
    // Merge with existing if it exists
    if (existingOrder.rateQuotesResponseJsonb && typeof existingOrder.rateQuotesResponseJsonb === 'object') {
      updateData.rateQuotesResponseJsonb = {
        ...existingOrder.rateQuotesResponseJsonb,
        ...finalRateQuotes,
      };
    } else {
      updateData.rateQuotesResponseJsonb = finalRateQuotes;
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

