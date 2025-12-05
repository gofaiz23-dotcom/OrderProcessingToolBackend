import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize uploads directory for 3PL Giga Fedex files at server startup
 * Creates 3_PL_Shiping_Docs folder inside UPLOADS_PATH
 * @returns {boolean} true if successful, false if path doesn't exist
 */
export const initializeThreePlGigaFedexUploadsDirectory = () => {
  const uploadsPath = config.uploads.path;

  if (!uploadsPath) {
    console.warn('[WARNING] UPLOADS_PATH environment variable is not set. 3PL Giga Fedex file uploads will not work.');
    return false;
  }

  // Check if uploads path exists
  if (!fs.existsSync(uploadsPath)) {
    console.warn(`[WARNING] UPLOADS_PATH does not exist: ${uploadsPath}. 3PL Giga Fedex file uploads will not work.`);
    return false;
  }

  // Create 3_PL_Shiping_Docs folder if it doesn't exist
  const threePlShippingDocsPath = path.join(uploadsPath, '3_PL_Shiping_Docs');
  
  if (!fs.existsSync(threePlShippingDocsPath)) {
    fs.mkdirSync(threePlShippingDocsPath, { recursive: true });
    console.log(`[SUCCESS] Created 3_PL_Shiping_Docs folder at: ${threePlShippingDocsPath}`);
  } else {
    console.log(`[INFO] 3_PL_Shiping_Docs folder already exists at: ${threePlShippingDocsPath}`);
  }

  return true;
};

/**
 * Setup uploads directory for 3PL Giga Fedex files during file upload operations
 * @returns {string} Full path to upload directory
 */
export const setupThreePlGigaFedexUploadsDirectory = () => {
  const uploadsPath = config.uploads.path;

  if (!uploadsPath) {
    throw new AppError('UPLOADS_PATH environment variable is not set', 500);
  }

  if (!fs.existsSync(uploadsPath)) {
    throw new AppError(`UPLOADS_PATH does not exist: ${uploadsPath}`, 400);
  }

  // Create 3_PL_Shiping_Docs folder if it doesn't exist
  const threePlShippingDocsPath = path.join(uploadsPath, '3_PL_Shiping_Docs');
  
  if (!fs.existsSync(threePlShippingDocsPath)) {
    fs.mkdirSync(threePlShippingDocsPath, { recursive: true });
  }

  return threePlShippingDocsPath;
};

/**
 * Save uploaded files for 3PL Giga Fedex
 * @param {Array} files - Array of multer file objects
 * @returns {Array<string>} Array of file paths (relative to UPLOADS_PATH)
 */
export const saveThreePlGigaFedexFiles = (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadsPath = setupThreePlGigaFedexUploadsDirectory();
  const savedFilePaths = [];

  files.forEach((file) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    const filePath = path.join(uploadsPath, filename);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Store relative path (3_PL_Shiping_Docs/filename)
    const relativePath = `3_PL_Shiping_Docs/${filename}`;
    savedFilePaths.push(relativePath);
  });

  return savedFilePaths;
};

/**
 * Parse upload array from comma-separated string
 * @param {string|string[]} uploadArray - Comma-separated string or array
 * @returns {string[]} Array of file paths
 */
export const parseUploadArray = (uploadArray) => {
  if (!uploadArray) {
    return [];
  }

  if (Array.isArray(uploadArray)) {
    return uploadArray;
  }

  if (typeof uploadArray === 'string') {
    // Split by comma and trim each item
    return uploadArray.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
  }

  return [];
};

/**
 * Parse JSON data from form data
 * @param {string|Object} jsonData - JSON string or object
 * @returns {Object} Parsed JSON object
 */
export const parseFedexJson = (jsonData) => {
  if (!jsonData) {
    return {};
  }

  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      throw new AppError('Invalid JSON format for fedexJson', 400);
    }
  }

  if (typeof jsonData === 'object') {
    return jsonData;
  }

  return {};
};
