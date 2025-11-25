import { prisma } from '../config/prismaClient.js';

export const saveRefreshToken = async (refreshToken) => {
  if (!refreshToken) return null;

  // Delete all existing refresh tokens to avoid multiple rows
  await prisma.googleAuthRefreshToken.deleteMany({});

  // Create a new refresh token record
  return prisma.googleAuthRefreshToken.create({
    data: { refreshToken },
  });
};

export const getLatestRefreshToken = async () => {
  const record = await prisma.googleAuthRefreshToken.findFirst({
    orderBy: { id: 'desc' },
  });

  return record?.refreshToken ?? null;
};


