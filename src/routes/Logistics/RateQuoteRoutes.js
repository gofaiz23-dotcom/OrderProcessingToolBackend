import { Router } from 'express';
import { createRateQuoteHandler } from '../../controllers/Logistics/RateQuoteController.js';

const router = Router();

// POST /api/v1/Logistics/create-rate-quote
router.post('/create-rate-quote', createRateQuoteHandler);

export default router;

