import { Router } from 'express';
import { createPickupRequestHandler } from '../../controllers/Logistics/PickupRequestController.js';

const router = Router();

// POST /api/v1/Logistics/create-pickup-request
router.post('/create-pickup-request', createPickupRequestHandler);

export default router;

