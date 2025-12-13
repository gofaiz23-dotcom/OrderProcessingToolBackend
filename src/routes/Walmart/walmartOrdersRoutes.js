import { Router } from 'express';
import { getOrders } from '../../controllers/Walmart/walmartOrdersController.js';

const router = Router();

// GET /api/v1/walmart/orders
// Get Walmart orders with optional query parameters
// Required Header: WM_SEC.ACCESS_TOKEN (Walmart access token)
router.get('/orders', getOrders);

export default router;

