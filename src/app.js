import express from 'express';
import cors from 'cors';
import emailRoutes from './routes/emailRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { config } from './config/env.js';

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

app.get(`${API_BASE_PATH}/health`, (req, res) => res.json({ status: 'ok' }));

app.use(`${API_BASE_PATH}/emails`, emailRoutes);
app.use(`${API_BASE_PATH}/auth`, googleAuthRoutes);
app.use(`${API_BASE_PATH}/orders`, orderRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal server error' });
});

export default app;

