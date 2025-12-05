import { Router } from 'express';
import multer from 'multer';
import {
  createThreePlGigaFedexHandler,
  getAllThreePlGigaFedexHandler,
  getThreePlGigaFedexByIdHandler,
  deleteThreePlGigaFedexHandler,
  deleteThreePlGigaFedexByDateRangeHandler,
} from '../../controllers/Logistics/ThreePlGigaFedexController.js';

const router = Router();

// Configure multer for file uploads (accepts any file type)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 20, // Max 20 files
  },
});

/**
 * POST /api/v1/Logistics/3pl-giga-fedex
 * Create single or multiple 3PL Giga Fedex records
 * 
 * Form Data Fields:
 * - trackingNo: string (single) or comma-separated string (multiple)
 * - fedexJson: JSON string or object (single) or ||| separated JSON strings (multiple)
 * - uploadArray: comma-separated file paths (optional, files can be uploaded via 'files' field)
 * - files: file uploads (optional, will be saved and added to uploadArray)
 * 
 * Examples:
 * Single: { trackingNo: "TRACK123", fedexJson: '{"key":"value"}', files: [file1, file2] }
 * Multiple: { trackingNo: "TRACK123,TRACK456", fedexJson: '{"key1":"value1"}|||{"key2":"value2"}' }
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
