import { prisma } from '../config/prismaClient.js';

export const createOrder = async (orderOnMarketPlace, jsonb) => {
  return await prisma.order.create({
    data: {
      orderOnMarketPlace,
      jsonb,
    },
  });
};

export const createMultipleOrders = async (orders) => {
  // Optimized: Use createMany for better performance with large datasets
  // Batch in chunks of 1000 to avoid query size limits
  const BATCH_SIZE = 1000;
  const results = [];
  
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    const batchResult = await prisma.order.createMany({
      data: batch.map(order => ({
        orderOnMarketPlace: order.orderOnMarketPlace,
        jsonb: order.jsonb,
      })),
      skipDuplicates: true,
    });
    results.push(batchResult);
  }
  
  // If you need the created records, fetch them after creation
  if (orders.length <= 100) {
    // For small batches, use transaction with create
    return await prisma.$transaction(
      orders.map((order) =>
        prisma.order.create({
          data: {
            orderOnMarketPlace: order.orderOnMarketPlace,
            jsonb: order.jsonb,
          },
        })
      )
    );
  }
  
  return results;
};

// Optimized: Add pagination to handle 1 lakh+ records
export const getAllOrders = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    orderBy = { id: 'desc' },
    where = {},
  } = options;
  
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 per page for performance
  
  // Get total count for pagination metadata
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take,
      // Select only needed fields if not all are required
      // select: { id: true, orderOnMarketPlace: true, jsonb: true }
    }),
    prisma.order.count({ where }),
  ]);
  
  return {
    orders,
    pagination: {
      page,
      limit: take,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      hasNextPage: skip + take < totalCount,
      hasPreviousPage: page > 1,
    },
  };
};

// Get all orders without pagination (use carefully, only for small datasets)
export const getAllOrdersUnpaginated = async () => {
  return await prisma.order.findMany({
    orderBy: {
      id: 'desc',
    },
  });
};

export const getOrderById = async (id) => {
  return await prisma.order.findUnique({
    where: { id: parseInt(id) },
  });
};

export const updateOrder = async (id, orderOnMarketPlace, jsonb) => {
  const updateData = {};
  if (orderOnMarketPlace !== undefined) {
    updateData.orderOnMarketPlace = orderOnMarketPlace;
  }
  if (jsonb !== undefined) {
    updateData.jsonb = jsonb;
  }

  return await prisma.order.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
};

export const deleteOrder = async (id) => {
  return await prisma.order.delete({
    where: { id: parseInt(id) },
  });
};

