import { Router } from 'express';
import {
  addOrder,
  getAllOrdersHandler,
  updateOrderHandler,
  deleteOrderHandler,
} from '../controllers/orderController.js';

const router = Router();

// Create order(s) - accepts single order object or array of orders
router.post('/create', addOrder);

// Get all orders
router.get('/all', getAllOrdersHandler);

// Update order by ID
router.put('/update/:id', updateOrderHandler);

// Delete order by ID
router.delete('/delete/:id', deleteOrderHandler);

export default router;

