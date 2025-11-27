import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import emailRoutes from './routes/emailRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import AuthShippingRoutes from './routes/Logistics/AuthShippingRoutes.js';
import RateQuoteRoutes from './routes/Logistics/RateQuoteRoutes.js';
import BillOfLadingRoutes from './routes/Logistics/BillOfLadingRoutes.js';
import PickupRequestRoutes from './routes/Logistics/PickupRequestRoutes.js';
import LogisticsShippedOrdersRoutes from './routes/Logistics/LogisticsShippedOrdersRoutes.js';
import { config } from './config/env.js';
import { errorHandler } from './utils/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_BASE_PATH = '/api/v1';
const allowedOrigins = config.cors.allowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from UPLOADS_PATH
if (config.uploads.path) {
  const uploadsPath = path.isAbsolute(config.uploads.path) 
    ? config.uploads.path 
    : path.join(__dirname, '..', config.uploads.path);
  
  // Extract folder name from path (e.g., "FhsOrdersMedia" from "./FhsOrdersMedia" or "C:/uploads/FhsOrdersMedia")
  const uploadsFolderName = path.basename(uploadsPath);
  
  // Serve static files at /{folderName} (e.g., /FhsOrdersMedia)
  app.use(`/${uploadsFolderName}`, express.static(uploadsPath));
}

app.get(`${API_BASE_PATH}/health`, (req, res) => res.json({ status: 'ok' }));

app.use(`${API_BASE_PATH}/emails`, emailRoutes);
app.use(`${API_BASE_PATH}/auth`, googleAuthRoutes);
app.use(`${API_BASE_PATH}/orders`, orderRoutes);
app.use(`${API_BASE_PATH}/Logistics`, AuthShippingRoutes);
app.use(`${API_BASE_PATH}/Logistics`, RateQuoteRoutes);
app.use(`${API_BASE_PATH}/Logistics`, BillOfLadingRoutes);
app.use(`${API_BASE_PATH}/Logistics`, PickupRequestRoutes);
app.use(`${API_BASE_PATH}/Logistics`, LogisticsShippedOrdersRoutes);

app.use(errorHandler);

export default app;

