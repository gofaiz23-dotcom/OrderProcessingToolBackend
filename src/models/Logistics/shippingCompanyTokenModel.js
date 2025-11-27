import { prisma } from '../../config/prismaClient.js';

export const upsertShippingCompanyToken = async (shippingCompanyName, token) => {
  return await prisma.shippingCompanyToken.upsert({
    where: {
      shippingCompanyName: shippingCompanyName.toLowerCase(),
    },
    update: {
      token,
    },
    create: {
      shippingCompanyName: shippingCompanyName.toLowerCase(),
      token,
    },
  });
};

export const getShippingCompanyToken = async (shippingCompanyName) => {
  return await prisma.shippingCompanyToken.findUnique({
    where: {
      shippingCompanyName: shippingCompanyName.toLowerCase(),
    },
  });
};

