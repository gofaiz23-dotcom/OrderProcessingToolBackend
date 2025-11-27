import { Router } from 'express';
import { getShipmentHistoryHandler, updateShipmentStatusHandler } from '../../controllers/Logistics/ShipmentHistoryController.js';

const router = Router();

// GET /api/v1/Logistics/shipment-history?pro=1234567890&bol=ABC123
router.get('/shipment-history', getShipmentHistoryHandler);

// PUT /api/v1/Logistics/shipment-status - Update status for single or multiple orders
// Format 1: Single status for single/multiple IDs: { "ids": 1, "status": "delivered" } or { "ids": [1,2,3], "status": "delivered" }
// Format 2: Multiple IDs with different statuses: { "updates": [{ "id": 1, "status": "delivered" }, { "id": 2, "status": "in_transit" }] }
router.put('/shipment-status', updateShipmentStatusHandler);

export default router;

