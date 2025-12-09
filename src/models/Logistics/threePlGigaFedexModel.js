import { prisma } from '../../config/prismaClient.js';

/**
 * Create a new 3PL Giga Fedex record
 * If trackingNo already exists, returns existing record without updating
 * If trackingNo doesn't exist, creates new record
 * @param {Object} data - Record data
 * @param {string} data.trackingNo - Tracking number (must be unique)
 * @param {Object} data.fedexJson - FedEx JSON data
 * @param {string[]} data.uploadArray - Array of file paths
 * @returns {Promise<Object>} Created record or existing record if trackingNo already exists
 */
export const createThreePlGigaFedex = async (data) => {
  const { trackingNo, fedexJson, uploadArray } = data;

  // Check if record with this trackingNo already exists
  const existingRecord = await prisma.threePlGigaFedex.findUnique({
    where: {
      trackingNo: trackingNo,
    },
  });

  // If exists, return existing record with status indicator
  if (existingRecord) {
    return {
      ...existingRecord,
      status: 'skipped', // Custom status to indicate it was skipped
      message: 'Tracking number already exists, no changes made',
    };
  }

  // If not exists, create new record
  const newRecord = await prisma.threePlGigaFedex.create({
    data: {
      trackingNo,
      fedexJson: fedexJson || {},
      uploadArray: uploadArray || [],
    },
  });

  return {
    ...newRecord,
    status: 'created', // Custom status to indicate it was created
  };
};

/**
 * Create multiple 3PL Giga Fedex records
 * If trackingNo already exists, skips it (doesn't update, doesn't add)
 * Only creates records with new tracking numbers
 * @param {Array<Object>} records - Array of record data
 * @returns {Promise<Object>} Created records with count of created vs skipped
 */
export const createMultipleThreePlGigaFedex = async (records) => {
  // Get all tracking numbers from input
  const trackingNos = records.map((r) => r.trackingNo);

  // Check which tracking numbers already exist in database
  const existingRecords = await prisma.threePlGigaFedex.findMany({
    where: {
      trackingNo: {
        in: trackingNos,
      },
    },
    select: {
      trackingNo: true,
    },
  });

  // Create set of existing tracking numbers for quick lookup
  const existingTrackingNos = new Set(existingRecords.map((r) => r.trackingNo));

  // Filter out records that already exist (only keep new ones)
  const newRecords = records.filter((record) => !existingTrackingNos.has(record.trackingNo));

  let createdCount = 0;
  let skippedCount = existingTrackingNos.size;
  let createdRecords = [];

  // Only create records that don't exist
  if (newRecords.length > 0) {
    const dataToCreate = newRecords.map((record) => ({
      trackingNo: record.trackingNo,
      fedexJson: record.fedexJson || {},
      uploadArray: record.uploadArray || [],
    }));

    // Use createMany for better performance
    const createResult = await prisma.threePlGigaFedex.createMany({
      data: dataToCreate,
      skipDuplicates: true, // Extra safety
    });

    createdCount = createResult.count;

    // Fetch the created records
    if (createdCount > 0) {
      createdRecords = await prisma.threePlGigaFedex.findMany({
        where: {
          trackingNo: {
            in: newRecords.map((r) => r.trackingNo),
          },
        },
      });
    }
  }

  // Fetch existing records that were skipped
  const skippedRecords = existingRecords;

  return {
    count: records.length,
    created: createdCount,
    skipped: skippedCount,
    records: [...createdRecords, ...skippedRecords], // Return both created and skipped records
  };
};

/**
 * Get all 3PL Giga Fedex records with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.trackingNo - Filter by tracking number
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Paginated records
 */
export const getAllThreePlGigaFedex = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    trackingNo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const where = {};

  if (trackingNo) {
    where.trackingNo = {
      contains: trackingNo,
      mode: 'insensitive',
    };
  }

  const [records, total] = await Promise.all([
    prisma.threePlGigaFedex.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.threePlGigaFedex.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get 3PL Giga Fedex record by ID
 * @param {number} id - Record ID
 * @returns {Promise<Object>} Record
 */
export const getThreePlGigaFedexById = async (id) => {
  const record = await prisma.threePlGigaFedex.findUnique({
    where: { id: parseInt(id) },
  });

  if (!record) {
    throw new Error('Record not found');
  }

  return record;
};

/**
 * Update 3PL Giga Fedex record by ID
 * @param {number} id - Record ID
 * @param {Object} data - Update data
 * @param {string} [data.trackingNo] - Tracking number
 * @param {Object} [data.fedexJson] - FedEx JSON data
 * @param {string[]} [data.uploadArray] - Array of file paths
 * @returns {Promise<Object>} Updated record
 */
export const updateThreePlGigaFedex = async (id, data) => {
  return await prisma.threePlGigaFedex.update({
    where: { id: parseInt(id) },
    data,
  });
};

/**
 * Delete 3PL Giga Fedex record by ID
 * @param {number} id - Record ID
 * @returns {Promise<Object>} Deleted record
 */
export const deleteThreePlGigaFedex = async (id) => {
  const record = await prisma.threePlGigaFedex.findUnique({
    where: { id: parseInt(id) },
  });

  if (!record) {
    throw new Error('Record not found');
  }

  await prisma.threePlGigaFedex.delete({
    where: { id: parseInt(id) },
  });

  return record;
};

/**
 * Delete 3PL Giga Fedex records by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Deletion result
 */
export const deleteThreePlGigaFedexByDateRange = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include entire end date

  const result = await prisma.threePlGigaFedex.deleteMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  return {
    count: result.count,
    startDate: start,
    endDate: end,
  };
};
