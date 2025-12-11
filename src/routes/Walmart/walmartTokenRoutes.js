import { Router } from 'express';
import { getToken } from '../../controllers/Walmart/walmartTokenController.js';

const router = Router();

// GET /api/v1/walmart/token
router.get('/token', getToken);

export default router;

