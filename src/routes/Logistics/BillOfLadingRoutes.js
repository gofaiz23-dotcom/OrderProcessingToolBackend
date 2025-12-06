import { Router } from 'express';
import { createBillOfLadingHandler } from '../../controllers/Logistics/BillOfLadingController.js';
import { downloadBOLPDFHandler } from '../../controllers/Logistics/XPOBOLPDFController.js';

const router = Router();

// POST /api/v1/Logistics/create-bill-of-lading
router.post('/create-bill-of-lading', createBillOfLadingHandler);

// POST /api/v1/Logistics/download-bol-pdf
router.post('/download-bol-pdf', downloadBOLPDFHandler);

export default router;

