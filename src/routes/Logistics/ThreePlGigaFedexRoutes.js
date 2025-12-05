import { Router } from 'express';
import {
  createThreePlGigaFedexHandler,
  getAllThreePlGigaFedexHandler,
  getThreePlGigaFedexByIdHandler,
  deleteThreePlGigaFedexHandler,
  deleteThreePlGigaFedexByDateRangeHandler,
} from '../../controllers/Logistics/ThreePlGigaFedexController.js';

const router = Router();

/**
 * POST /api/v1/Logistics/3pl-giga-fedex
 * Create single or multiple 3PL Giga Fedex records
 * 
 * Accepts JSON format:
 * 
 * Single record:
 * {
 *   "trackingNo": "TRACK123",
 *   "fedexJson": { "customerCode": "G108", "carrier": "FedEx", ... }
 * }
 * 
 * Multiple records:
 * [
 *   { "trackingNo": "TRACK123", "fedexJson": { ... } },
 *   { "trackingNo": "TRACK456", "fedexJson": { ... } }
 * ]
 */
router.post('/3pl-giga-fedex', createThreePlGigaFedexHandler);

/**
 * GET /api/v1/Logistics/3pl-giga-fedex
 * Get all 3PL Giga Fedex records with pagination and filtering
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50)
 * - trackingNo: string (filter by tracking number, case-insensitive)
 * - sortBy: string (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
router.get('/3pl-giga-fedex', getAllThreePlGigaFedexHandler);

/**
 * GET /api/v1/Logistics/3pl-giga-fedex/:id
 * Get 3PL Giga Fedex record by ID
 */
router.get('/3pl-giga-fedex/:id', getThreePlGigaFedexByIdHandler);

/**
 * DELETE /api/v1/Logistics/3pl-giga-fedex/:id
 * Delete 3PL Giga Fedex record by ID
 */
router.delete('/3pl-giga-fedex/:id', deleteThreePlGigaFedexHandler);

/**
 * DELETE /api/v1/Logistics/3pl-giga-fedex?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Delete 3PL Giga Fedex records by date range
 * 
 * Query Parameters:
 * - startDate: YYYY-MM-DD (required)
 * - endDate: YYYY-MM-DD (required)
 */
router.delete('/3pl-giga-fedex', deleteThreePlGigaFedexByDateRangeHandler);

export default router;
