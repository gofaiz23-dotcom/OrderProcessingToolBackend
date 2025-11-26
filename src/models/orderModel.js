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
  // Use createMany for better performance, but it doesn't return created records
  // So we'll use individual creates in a transaction to get the created records back
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
};

export const getAllOrders = async () => {
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

