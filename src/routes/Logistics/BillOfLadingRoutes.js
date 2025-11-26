import { Router } from 'express';
import { createBillOfLadingHandler } from '../../controllers/Logistics/BillOfLadingController.js';

const router = Router();

// POST /api/v1/Logistics/create-bill-of-lading
router.post('/create-bill-of-lading', createBillOfLadingHandler);

export default router;

