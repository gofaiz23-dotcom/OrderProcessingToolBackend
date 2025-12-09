import {
  createThreePlGigaFedex,
  createMultipleThreePlGigaFedex,
  getAllThreePlGigaFedex,
  getThreePlGigaFedexById,
  updateThreePlGigaFedex,
  deleteThreePlGigaFedex,
  deleteThreePlGigaFedexByDateRange,
} from '../../models/Logistics/threePlGigaFedexModel.js';
import { saveThreePlGigaFedexFiles, parseFedexJson } from '../../services/Logistics/ThreePlGigaFedexService.js';
import { NotFoundError, ValidationError, ConflictError, asyncHandler } from '../../utils/error.js';
import { Prisma } from '@prisma/client';

/**
 * POST - Create single or multiple 3PL Giga Fedex records
 * Accepts JSON with single object or array of objects
 * Also supports multipart/form-data with files
 * 
 * Single record format (JSON):
 * {
 *   "trackingNo": "TRACK123",
 *   "fedexJson": { "key": "value", ... }
 * }
 * 
 * Single record format (multipart/form-data):
 * - trackingNo: "TRACK123"
 * - fedexJson: JSON string or object
 * - files: (optional) one or more files
 * 
 * Multiple records format (JSON):
 * [
 *   { "trackingNo": "TRACK123", "fedexJson": { ... } },
 *   { "trackingNo": "TRACK456", "fedexJson": { ... } }
 * ]
 * 
 * Multiple records format (multipart/form-data):
 * - Send JSON array string in body
 * - Files will be associated with all records
 */
export const createThreePlGigaFedexHandler = asyncHandler(async (req, res, next) => {
  // Handle file uploads (if any)
  let uploadArray = [];
  if (req.files && req.files.length > 0) {
    try {
      uploadArray = saveThreePlGigaFedexFiles(req.files);
    } catch (error) {
      throw error; // Re-throw AppError from service
    }
  }

  // Parse request body - could be JSON or form data
  let requestBody = req.body;
  
  // If fedexJson is a string (from form data), try to parse it
  if (requestBody.fedexJson && typeof requestBody.fedexJson === 'string') {
    try {
      requestBody.fedexJson = parseFedexJson(requestBody.fedexJson);
    } catch (error) {
      throw new ValidationError('Invalid JSON format for fedexJson');
    }
  }

  // If body contains a JSON string (for multiple records in form data), parse it
  if (typeof requestBody === 'object' && requestBody.data && typeof requestBody.data === 'string') {
    try {
      requestBody = JSON.parse(requestBody.data);
    } catch (error) {
      // If parsing fails, continue with original body
    }
  }

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
      
      // Parse fedexJson if it's a string
      const parsedFedexJson = parseFedexJson(item.fedexJson);
      
      return {
        trackingNo: item.trackingNo,
        fedexJson: parsedFedexJson,
        uploadArray: uploadArray, // Same files for all records
      };
    });

    try {
      const result = await createMultipleThreePlGigaFedex(records);

      // Build message based on created vs skipped
      let message = `Successfully processed ${result.count} 3PL Giga Fedex record(s)`;
      if (result.created > 0 && result.skipped > 0) {
        message += ` (${result.created} created, ${result.skipped} skipped - tracking numbers already exist)`;
      } else if (result.created > 0) {
        message += ` (${result.created} created)`;
      } else if (result.skipped > 0) {
        message += ` (${result.skipped} skipped - all tracking numbers already exist in database)`;
      }

      res.status(201).json({
        message,
        data: result,
      });
    } catch (error) {
      // Handle Prisma unique constraint error (P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('trackingNo')) {
        throw new ConflictError('A record with this tracking number already exists');
      }
      throw error;
    }
  } else {
    // Single record mode
    const { trackingNo, fedexJson } = requestBody;

    if (!trackingNo) {
      throw new ValidationError('trackingNo is required');
    }

    // Parse fedexJson
    const parsedFedexJson = parseFedexJson(fedexJson);

    try {
      // Create new record (model will check if exists and return existing if found)
      const record = await createThreePlGigaFedex({
        trackingNo,
        fedexJson: parsedFedexJson,
        uploadArray: uploadArray,
      });

      // Check if record was created or skipped based on status field
      if (record.status === 'skipped') {
        // If the record was skipped because it already existed
        res.status(200).json({
          message: '3PL Giga Fedex record already exists (tracking number found in database, no changes made)',
          data: record,
        });
      } else {
        // If a new record was created
        res.status(201).json({
          message: '3PL Giga Fedex record created successfully',
          data: record,
        });
      }
    } catch (error) {
      // Handle Prisma unique constraint error (P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('trackingNo')) {
        throw new ConflictError('A record with this tracking number already exists');
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
 * PUT - Update 3PL Giga Fedex record by ID
 * Accepts multipart/form-data with:
 * - trackingNo: string (optional)
 * - fedexJson: JSON string or object (optional)
 * - files: (optional) one or more files to add
 * - replaceFiles: boolean (optional, default: false) - if true, replaces all files instead of appending
 * 
 * Also accepts JSON format (application/json):
 * {
 *   "trackingNo": "TRACK123",
 *   "fedexJson": { ... },
 *   "uploadArray": ["path1", "path2"]
 * }
 */
export const updateThreePlGigaFedexHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if record exists
  let existingRecord;
  try {
    existingRecord = await getThreePlGigaFedexById(id);
  } catch (error) {
    if (error.message === 'Record not found') {
      throw new NotFoundError(`3PL Giga Fedex record with ID ${id} not found`);
    }
    throw error;
  }

  // Handle file uploads
  let uploadArray = existingRecord.uploadArray || [];
  if (req.files && req.files.length > 0) {
    try {
      const newFiles = saveThreePlGigaFedexFiles(req.files);
      
      // Check if we should replace files or append
      const replaceFiles = req.body.replaceFiles === 'true' || req.body.replaceFiles === true;
      
      if (replaceFiles) {
        uploadArray = newFiles; // Replace all files
      } else {
        uploadArray = [...uploadArray, ...newFiles]; // Append new files
      }
    } catch (error) {
      throw error; // Re-throw AppError from service
    }
  }

  // Parse request body - could be JSON or form data
  let requestBody = req.body;
  
  // If fedexJson is a string (from form data), try to parse it
  if (requestBody.fedexJson && typeof requestBody.fedexJson === 'string') {
    try {
      requestBody.fedexJson = parseFedexJson(requestBody.fedexJson);
    } catch (error) {
      throw new ValidationError('Invalid JSON format for fedexJson');
    }
  }

  // Prepare update data - only include fields that are provided
  const updateData = {};
  
  if (requestBody.trackingNo !== undefined) {
    updateData.trackingNo = requestBody.trackingNo;
  }
  
  if (requestBody.fedexJson !== undefined) {
    updateData.fedexJson = parseFedexJson(requestBody.fedexJson);
  }
  
  // Update uploadArray if files were uploaded or if explicitly provided
  if (req.files && req.files.length > 0) {
    updateData.uploadArray = uploadArray;
  } else if (requestBody.uploadArray !== undefined) {
    // Allow explicit uploadArray update via JSON (could be string from form data or array)
    if (typeof requestBody.uploadArray === 'string') {
      try {
        updateData.uploadArray = JSON.parse(requestBody.uploadArray);
      } catch (error) {
        throw new ValidationError('Invalid JSON format for uploadArray');
      }
    } else if (Array.isArray(requestBody.uploadArray)) {
      updateData.uploadArray = requestBody.uploadArray;
    } else {
      updateData.uploadArray = [];
    }
  }

  // Only update if there's something to update
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('No fields provided for update');
  }

  try {
    const updatedRecord = await updateThreePlGigaFedex(id, updateData);

    res.status(200).json({
      message: '3PL Giga Fedex record updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
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
