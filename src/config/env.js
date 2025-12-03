import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_TOKEN_URI',
  'GOOGLE_AUTH_URI',
  'GOOGLE_CERTS_URL',
  'GOOGLE_REDIRECT_URI',
  'GMAIL_USER_EMAIL',
  'DATABASE_URL',
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key}. Some Gmail features may not work.`);
  }
});

const parseAllowedOrigins = (value) =>
  value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

// Build DATABASE_URL with connection pool parameters from separate variables
const buildDatabaseUrl = () => {
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return null;
  }
  
  // Get connection pool settings from separate environment variables
  const connectionLimit = process.env.DB_CONNECTION_LIMIT;
  const poolTimeout = process.env.DB_POOL_TIMEOUT;
  
  // If pool settings are provided as separate variables, append them to URL
  if (connectionLimit || poolTimeout) {
    const poolParams = [];
    
    if (connectionLimit) {
      poolParams.push(`connection_limit=${connectionLimit}`);
    }
    
    if (poolTimeout) {
      poolParams.push(`pool_timeout=${poolTimeout}`);
    }
    
    if (poolParams.length > 0) {
      // Check if URL already has query parameters
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}${poolParams.join('&')}`;
    }
  }
  
  return databaseUrl;
};

// Build and set DATABASE_URL for Prisma
const finalDatabaseUrl = buildDatabaseUrl();
if (finalDatabaseUrl) {
  process.env.DATABASE_URL = finalDatabaseUrl;
}

export const config = {
  port: process.env.PORT || 3000,
  database: {
    url: finalDatabaseUrl || process.env.DATABASE_URL,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    projectId: process.env.GOOGLE_PROJECT_ID,
    authUri: process.env.GOOGLE_AUTH_URI,
    tokenUri: process.env.GOOGLE_TOKEN_URI,
    certsUrl: process.env.GOOGLE_CERTS_URL,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    userEmail: process.env.GMAIL_USER_EMAIL,
  },
  cors: {
    allowedOrigins: parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
  },
  uploads: {
    path: process.env.UPLOADS_PATH || '',
  },
  shipping: {
    estes: {
      baseUrl: process.env.ESTES_BASE_URL || '',
      apiKey: process.env.ESTES_API_KEY || '',
    },
    xpo: {
      baseUrl: process.env.XPO_BASE_URL || '',
      apiKey: process.env.XPO_API_KEY || '',
    },
  },
};

