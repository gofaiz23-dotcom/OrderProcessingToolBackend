import { Router } from 'express';
import multer from 'multer';
import {
  createLogisticsShippedOrderHandler,
  getAllLogisticsShippedOrdersHandler,
  getLogisticsShippedOrderByIdHandler,
  updateLogisticsShippedOrderHandler,
  deleteLogisticsShippedOrderHandler,
  deleteLogisticsShippedOrdersByDateRangeHandler,
} from '../../controllers/Logistics/LogisticsShippedOrdersController.js';

const router = Router();

// Configure multer for file uploads (accepts any file type)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files
  },
});

// POST /api/v1/Logistics/shipped-orders - Create new order
router.post('/shipped-orders', upload.array('files'), createLogisticsShippedOrderHandler);

// GET /api/v1/Logistics/shipped-orders - Get all orders
router.get('/shipped-orders', getAllLogisticsShippedOrdersHandler);

// GET /api/v1/Logistics/shipped-orders/:id - Get order by ID
router.get('/shipped-orders/:id', getLogisticsShippedOrderByIdHandler);

// PUT /api/v1/Logistics/shipped-orders/:id - Update order
router.put('/shipped-orders/:id', upload.array('files'), updateLogisticsShippedOrderHandler);

// DELETE /api/v1/Logistics/shipped-orders/:id - Delete order by ID
router.delete('/shipped-orders/:id', deleteLogisticsShippedOrderHandler);

// DELETE /api/v1/Logistics/shipped-orders?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Delete by date range
router.delete('/shipped-orders', deleteLogisticsShippedOrdersByDateRangeHandler);

export default router;

