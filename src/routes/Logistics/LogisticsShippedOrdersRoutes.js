import { Router } from 'express';
import multer from 'multer';
import {
  createLogisticsShippedOrderHandler,
  getAllLogisticsShippedOrdersHandler,
  getLogisticsShippedOrderByIdHandler,
  updateLogisticsShippedOrderHandler,
  deleteLogisticsShippedOrderHandler,
  deleteLogisticsShippedOrdersByDateRangeHandler,
  getAllOrdersJsonbHandler,
  getOrdersJsonbByIdHandler,
} from '../../controllers/Logistics/LogisticsShippedOrdersController.js';
import { orderCreationLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Configure multer for file uploads (accepts any file type)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files
  },
});

// POST /api/v1/Logistics/shipped-orders - Create new order (rate limited)
router.post('/shipped-orders', orderCreationLimiter, upload.array('files'), createLogisticsShippedOrderHandler);

// GET /api/v1/Logistics/shipped-orders - Get all orders (with pagination, filtering, sorting)
router.get('/shipped-orders', getAllLogisticsShippedOrdersHandler);

// GET /api/v1/Logistics/shipped-orders/:id - Get order by ID
router.get('/shipped-orders/:id', getLogisticsShippedOrderByIdHandler);

// PUT /api/v1/Logistics/shipped-orders/:id - Update order
router.put('/shipped-orders/:id', upload.array('files'), updateLogisticsShippedOrderHandler);

// DELETE /api/v1/Logistics/shipped-orders/:id - Delete order by ID
router.delete('/shipped-orders/:id', deleteLogisticsShippedOrderHandler);

// DELETE /api/v1/Logistics/shipped-orders?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Delete by date range
router.delete('/shipped-orders', deleteLogisticsShippedOrdersByDateRangeHandler);

// GET /api/v1/Logistics/orders-jsonb - Get all ordersJsonb only (with pagination, filtering, sorting)
router.get('/orders-jsonb', getAllOrdersJsonbHandler);

// GET /api/v1/Logistics/orders-jsonb/:id - Get ordersJsonb by ID
router.get('/orders-jsonb/:id', getOrdersJsonbByIdHandler);

export default router;

