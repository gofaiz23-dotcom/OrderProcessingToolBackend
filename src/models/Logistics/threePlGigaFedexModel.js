import { prisma } from '../../config/prismaClient.js';

/**
 * Create a new 3PL Giga Fedex record
 * @param {Object} data - Record data
 * @param {string} data.trackingNo - Tracking number
 * @param {Object} data.fedexJson - FedEx JSON data
 * @param {string[]} data.uploadArray - Array of file paths (comma-separated)
 * @returns {Promise<Object>} Created record
 */
export const createThreePlGigaFedex = async (data) => {
  const { trackingNo, fedexJson, uploadArray } = data;

  return await prisma.threePlGigaFedex.create({
    data: {
      trackingNo,
      fedexJson: fedexJson || {},
      uploadArray: uploadArray || [],
    },
  });
};

/**
 * Create multiple 3PL Giga Fedex records
 * @param {Array<Object>} records - Array of record data
 * @returns {Promise<Object>} Created records with count
 */
export const createMultipleThreePlGigaFedex = async (records) => {
  const data = records.map((record) => ({
    trackingNo: record.trackingNo,
    fedexJson: record.fedexJson || {},
    uploadArray: record.uploadArray || [],
  }));

  // Use createMany - duplicates are now allowed (no unique constraint)
  const result = await prisma.threePlGigaFedex.createMany({
    data,
  });

  return {
    count: result.count,
    records: await prisma.threePlGigaFedex.findMany({
      where: {
        trackingNo: {
          in: records.map((r) => r.trackingNo),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
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
