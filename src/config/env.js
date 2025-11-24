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

export const config = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
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
};

