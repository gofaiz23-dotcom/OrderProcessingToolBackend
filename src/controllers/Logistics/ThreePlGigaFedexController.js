import {
  createThreePlGigaFedex,
  createMultipleThreePlGigaFedex,
  getAllThreePlGigaFedex,
  getThreePlGigaFedexById,
  deleteThreePlGigaFedex,
  deleteThreePlGigaFedexByDateRange,
} from '../../models/Logistics/threePlGigaFedexModel.js';
import { NotFoundError, ValidationError, ConflictError, asyncHandler } from '../../utils/error.js';
import { Prisma } from '@prisma/client';

/**
 * POST - Create single or multiple 3PL Giga Fedex records
 * Accepts JSON with single object or array of objects
 * 
 * Single record format:
 * {
 *   "trackingNo": "TRACK123",
 *   "fedexJson": { "key": "value", ... }
 * }
 * 
 * Multiple records format:
 * [
 *   { "trackingNo": "TRACK123", "fedexJson": { ... } },
 *   { "trackingNo": "TRACK456", "fedexJson": { ... } }
 * ]
 */
export const createThreePlGigaFedexHandler = asyncHandler(async (req, res, next) => {
  const requestBody = req.body;

  // Check if request body is an array (multiple records)
  if (Array.isArray(requestBody)) {
    // Multiple records mode
    if (requestBody.length === 0) {
      throw new ValidationError('Array cannot be empty');
    }

    // Validate and prepare records
    const records = requestBody.map((item, index) => {
      if (!item.trackingNo) {
        throw new ValidationError(`Record at index ${index}: trackingNo is required`);
      }
      
      return {
        trackingNo: item.trackingNo,
        fedexJson: item.fedexJson || {},
        uploadArray: [], // No file uploads, always empty array
      };
    });

    try {
      const result = await createMultipleThreePlGigaFedex(records);

      res.status(201).json({
        message: `Successfully created ${result.count} 3PL Giga Fedex record(s)`,
        data: result,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('One or more tracking numbers already exist. Tracking numbers must be unique.');
      }
      throw error;
    }
  } else {
    // Single record mode
    const { trackingNo, fedexJson } = requestBody;

    if (!trackingNo) {
      throw new ValidationError('trackingNo is required');
    }

    // fedexJson can be an object or will default to empty object
    const parsedFedexJson = fedexJson || {};

    try {
      const record = await createThreePlGigaFedex({
        trackingNo,
        fedexJson: parsedFedexJson,
        uploadArray: [], // No file uploads, always empty array
      });

      res.status(201).json({
        message: '3PL Giga Fedex record created successfully',
        data: record,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(`Tracking number "${trackingNo}" already exists. Tracking numbers must be unique.`);
      }
      throw error;
    }
  }
});

/**
 * GET - Get all 3PL Giga Fedex records with pagination and filtering
 */
export const getAllThreePlGigaFedexHandler = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const trackingNo = req.query.trackingNo;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

  const result = await getAllThreePlGigaFedex({
    page,
    limit,
    trackingNo,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    message: '3PL Giga Fedex records retrieved successfully',
    data: result.records,
    pagination: result.pagination,
  });
});

/**
 * GET - Get 3PL Giga Fedex record by ID
 */
export const getThreePlGigaFedexByIdHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const record = await getThreePlGigaFedexById(id);
    res.status(200).json({
      message: '3PL Giga Fedex record retrieved successfully',
      data: record,
    });
  } catch (error) {
    if (error.message === 'Record not found') {
      throw new NotFoundError('3PL Giga Fedex record not found');
    }
    throw error;
  }
});

/**
 * DELETE - Delete 3PL Giga Fedex record by ID
 */
export const deleteThreePlGigaFedexHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const record = await deleteThreePlGigaFedex(id);
    res.status(200).json({
      message: '3PL Giga Fedex record deleted successfully',
      data: record,
    });
  } catch (error) {
    if (error.message === 'Record not found') {
      throw new NotFoundError('3PL Giga Fedex record not found');
    }
    throw error;
  }
});

/**
 * DELETE - Delete 3PL Giga Fedex records by date range
 */
export const deleteThreePlGigaFedexByDateRangeHandler = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ValidationError('startDate and endDate query parameters are required (format: YYYY-MM-DD)');
  }

  try {
    const result = await deleteThreePlGigaFedexByDateRange(startDate, endDate);
    res.status(200).json({
      message: `Successfully deleted ${result.count} 3PL Giga Fedex record(s)`,
      data: result,
    });
  } catch (error) {
    throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
  }
});
