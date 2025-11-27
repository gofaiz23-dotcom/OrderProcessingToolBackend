import { prisma } from '../../config/prismaClient.js';

export const createLogisticsShippedOrder = async (data) => {
  return await prisma.logisticsShippedOrders.create({
    data,
  });
};

export const getAllLogisticsShippedOrders = async () => {
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

