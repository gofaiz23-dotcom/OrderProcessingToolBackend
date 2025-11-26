import {
  createOrder,
  createMultipleOrders,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from '../models/orderModel.js';

const validateAndParseOrder = (order, index = null) => {
  const prefix = index !== null ? `Order at index ${index}: ` : '';
  
  if (!order.orderOnMarketPlace) {
    throw new Error(`${prefix}Field "orderOnMarketPlace" is required.`);
  }

  if (order.jsonb === undefined || order.jsonb === null) {
    throw new Error(`${prefix}Field "jsonb" is required.`);
  }

  // Validate that jsonb is a valid JSON object/array
  let parsedJsonb = order.jsonb;
  if (typeof order.jsonb === 'string') {
    try {
      parsedJsonb = JSON.parse(order.jsonb);
    } catch (error) {
      throw new Error(`${prefix}Field "jsonb" must be valid JSON.`);
    }
  }

  return {
    orderOnMarketPlace: order.orderOnMarketPlace,
    jsonb: parsedJsonb,
  };
};

export const addOrder = async (req, res, next) => {
  try {
    const body = req.body;

    // Check if body is an array (multiple orders) or single object
    if (Array.isArray(body)) {
      // Handle multiple orders
      if (body.length === 0) {
        return res.status(400).json({
          message: 'Array cannot be empty. Provide at least one order.',
        });
      }

      // Validate all orders
      const validatedOrders = [];
      for (let i = 0; i < body.length; i++) {
        try {
          const validated = validateAndParseOrder(body[i], i);
          validatedOrders.push(validated);
        } catch (error) {
          return res.status(400).json({
            message: error.message,
          });
        }
      }

      // Create all orders
      const orders = await createMultipleOrders(validatedOrders);

      res.status(201).json({
        message: `${orders.length} order(s) created successfully`,
        count: orders.length,
        orders,
      });
    } else {
      // Handle single order
      try {
        const validated = validateAndParseOrder(body);
        const order = await createOrder(validated.orderOnMarketPlace, validated.jsonb);

        res.status(201).json({
          message: 'Order created successfully',
          order,
        });
      } catch (error) {
        return res.status(400).json({
          message: error.message,
        });
      }
    }
  } catch (error) {
    console.error('Error creating order(s):', error);
    next({
      status: error.status || 500,
      message: error.message || 'Internal server error',
    });
  }
};

export const getAllOrdersHandler = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    res.json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    next({
      status: error.status || 500,
      message: error.message || 'Internal server error',
    });
  }
};

export const updateOrderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderOnMarketPlace, jsonb } = req.body;

    // Check if order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Validate jsonb if provided
    let parsedJsonb = jsonb;
    if (jsonb !== undefined && jsonb !== null) {
      if (typeof jsonb === 'string') {
        try {
          parsedJsonb = JSON.parse(jsonb);
        } catch (error) {
          return res.status(400).json({
            message: 'Field "jsonb" must be valid JSON.',
          });
        }
      }
    }

    // Build update data object
    const updateData = {};
    if (orderOnMarketPlace !== undefined) {
      updateData.orderOnMarketPlace = orderOnMarketPlace;
    }
    if (jsonb !== undefined) {
      updateData.jsonb = parsedJsonb;
    }

    const order = await updateOrder(id, updateData.orderOnMarketPlace, updateData.jsonb);

    res.json({
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    next({
      status: error.status || 500,
      message: error.message || 'Internal server error',
    });
  }
};

export const deleteOrderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    await deleteOrder(id);

    res.json({
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    next({
      status: error.status || 500,
      message: error.message || 'Internal server error',
    });
  }
};

