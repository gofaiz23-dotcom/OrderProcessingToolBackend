import { Router } from 'express';
import {
  addOrder,
  getAllOrdersHandler,
  updateOrderHandler,
  deleteOrderHandler,
} from '../controllers/orderController.js';
import { orderCreationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Create order(s) - accepts single order object or array of orders
// Apply rate limiting to prevent abuse
router.post('/create', orderCreationLimiter, addOrder);

// Get all orders
router.get('/all', getAllOrdersHandler);

// Update order by ID
router.put('/update/:id', updateOrderHandler);

// Delete order by ID
router.delete('/delete/:id', deleteOrderHandler);

export default router;

