import { Router } from 'express';
import { getShipmentHistoryHandler, updateShipmentStatusHandler } from '../../controllers/Logistics/ShipmentHistoryController.js';

const router = Router();

// GET /api/v1/Logistics/shipment-history?pro=1234567890&bol=ABC123
router.get('/shipment-history', getShipmentHistoryHandler);

// PUT /api/v1/Logistics/shipment-status - Update status for single or multiple orders
// Body: { "ids": 1 } or { "ids": [1, 2, 3], "status": "delivered" }
router.put('/shipment-status', updateShipmentStatusHandler);

export default router;

