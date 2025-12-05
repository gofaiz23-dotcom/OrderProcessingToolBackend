import { Router } from 'express';
import multer from 'multer';
import {
  createThreePlGigaFedexHandler,
  getAllThreePlGigaFedexHandler,
  getThreePlGigaFedexByIdHandler,
  updateThreePlGigaFedexHandler,
  deleteThreePlGigaFedexHandler,
  deleteThreePlGigaFedexByDateRangeHandler,
} from '../../controllers/Logistics/ThreePlGigaFedexController.js';

const router = Router();

// Configure multer for file uploads (accepts any file type)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files
  },
});

/**
 * POST /api/v1/Logistics/3pl-giga-fedex
 * Create single or multiple 3PL Giga Fedex records
 * 
 * TWO WAYS TO CALL:
 * 
 * 1. WITH FILES (multipart/form-data) - REQUIRED when files are included:
 *    - Content-Type: multipart/form-data
 *    - Fields:
 *      * trackingNo: "TRACK123" (text field)
 *      * fedexJson: JSON string (e.g., '{"key":"value"}') (text field)
 *      * files: one or more files (file fields, field name: "files")
 * 
 * 2. WITHOUT FILES (application/json) - Can send pure JSON:
 *    - Content-Type: application/json
 *    - Body: { "trackingNo": "TRACK123", "fedexJson": { "key": "value" } }
 *    - OR array: [{ "trackingNo": "TRACK123", "fedexJson": {...} }, ...]
 * 
 * IMPORTANT: To send BOTH JSON data AND files in one call, you MUST use multipart/form-data.
 * In multipart/form-data, send fedexJson as a JSON string in a text field, not as an object.
 * 
 * Examples:
 * - Single record with files: multipart/form-data with trackingNo, fedexJson (string), and files
 * - Multiple records with files: multipart/form-data with data field (JSON array string) and files
 * - Single record without files: application/json with { trackingNo, fedexJson }
 * - Multiple records without files: application/json with [{ trackingNo, fedexJson }, ...]
 */
router.post('/3pl-giga-fedex', upload.array('files'), createThreePlGigaFedexHandler);

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
 * PUT /api/v1/Logistics/3pl-giga-fedex/:id
 * Update 3PL Giga Fedex record by ID
 * 
 * Accepts multipart/form-data with:
 * - trackingNo: string (optional)
 * - fedexJson: JSON string or object (optional)
 * - files: (optional) one or more files
 * - replaceFiles: boolean (optional, default: false) - if true, replaces all files instead of appending
 * 
 * Also accepts JSON format (application/json):
 * {
 *   "trackingNo": "TRACK123",
 *   "fedexJson": { ... },
 *   "uploadArray": ["path1", "path2"]
 * }
 */
router.put('/3pl-giga-fedex/:id', upload.array('files'), updateThreePlGigaFedexHandler);

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
