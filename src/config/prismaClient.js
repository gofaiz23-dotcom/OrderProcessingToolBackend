import { PrismaClient } from '@prisma/client';

// Configure Prisma Client with connection pool settings for 100+ concurrent users
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool configuration via DATABASE_URL params:
// Example: postgresql://user:pass@host/db?connection_limit=20&pool_timeout=10
// Recommended: connection_limit=20-50, pool_timeout=10


