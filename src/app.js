import express from 'express';
import emailRoutes from './routes/emailRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';

const app = express();
const API_BASE_PATH = '/api/v1';

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get(`${API_BASE_PATH}/health`, (req, res) => res.json({ status: 'ok' }));

app.use(`${API_BASE_PATH}/emails`, emailRoutes);
app.use(`${API_BASE_PATH}/auth`, googleAuthRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal server error' });
});

export default app;

