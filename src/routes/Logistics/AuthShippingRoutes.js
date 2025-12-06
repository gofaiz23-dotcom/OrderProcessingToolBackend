import { Router } from 'express';
import { authShippingCompany } from '../../controllers/Logistics/AuthShippingController.js';

const router = Router();

// POST /api/v1/Logistics/Auth+authenticate
router.post('/Authenticate', authShippingCompany);

export default router;

