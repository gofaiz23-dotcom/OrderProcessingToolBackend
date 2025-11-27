import { Router } from 'express';
import { getShipmentHistoryHandler } from '../../controllers/Logistics/ShipmentHistoryController.js';

const router = Router();

// GET /api/v1/Logistics/shipment-history?pro=1234567890&bol=ABC123
router.get('/shipment-history', getShipmentHistoryHandler);

export default router;

