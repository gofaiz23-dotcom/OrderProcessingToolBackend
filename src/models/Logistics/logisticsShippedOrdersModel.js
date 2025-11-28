import { prisma } from '../../config/prismaClient.js';

export const createLogisticsShippedOrder = async (data) => {
  return await prisma.logisticsShippedOrders.create({
    data,
  });
};

// Optimized: Add pagination to handle large datasets
export const getAllLogisticsShippedOrders = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    orderBy = { createdAt: 'desc' },
    where = {},
  } = options;
  
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 per page for performance
  
  // Get total count for pagination metadata
  const [orders, totalCount] = await Promise.all([
    prisma.logisticsShippedOrders.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    prisma.logisticsShippedOrders.count({ where }),
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
export const getAllLogisticsShippedOrdersUnpaginated = async () => {
  return await prisma.logisticsShippedOrders.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getLogisticsShippedOrderById = async (id) => {
  return await prisma.logisticsShippedOrders.findUnique({
    where: { id: parseInt(id) },
  });
};

export const updateLogisticsShippedOrder = async (id, data) => {
  return await prisma.logisticsShippedOrders.update({
    where: { id: parseInt(id) },
    data,
  });
};

export const deleteLogisticsShippedOrder = async (id) => {
  return await prisma.logisticsShippedOrders.delete({
    where: { id: parseInt(id) },
  });
};

export const deleteLogisticsShippedOrdersByDateRange = async (startDate, endDate) => {
  return await prisma.logisticsShippedOrders.deleteMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });
};

export const updateLogisticsShippedOrdersStatus = async (ids, status) => {
  // Convert single ID to array if needed
  const idArray = Array.isArray(ids) ? ids.map(id => parseInt(id)) : [parseInt(ids)];
  
  return await prisma.logisticsShippedOrders.updateMany({
    where: {
      id: {
        in: idArray,
      },
    },
    data: {
      status,
    },
  });
};

export const updateLogisticsShippedOrdersStatusMultiple = async (updates) => {
  // Updates is an array of { id, status } objects
  // Optimized: Batch updates by status to reduce database calls
  const statusGroups = {};
  
  updates.forEach(({ id, status }) => {
    const trimmedStatus = status.trim();
    if (!statusGroups[trimmedStatus]) {
      statusGroups[trimmedStatus] = [];
    }
    statusGroups[trimmedStatus].push(parseInt(id));
  });
  
  // Execute batch updates for each status group
  const updatePromises = Object.entries(statusGroups).map(async ([status, ids]) => {
    return await prisma.logisticsShippedOrders.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        status,
      },
    });
  });
  
  await Promise.all(updatePromises);
  
  // Fetch updated records to return
  const allIds = updates.map(({ id }) => parseInt(id));
  const updatedOrders = await prisma.logisticsShippedOrders.findMany({
    where: {
      id: {
        in: allIds,
      },
    },
  });
  
  return {
    count: updatedOrders.length,
    updates: updatedOrders,
  };
};

