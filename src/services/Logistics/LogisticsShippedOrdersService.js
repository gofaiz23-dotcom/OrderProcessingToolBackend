import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize uploads directory at server startup
 * Checks if UPLOADS_PATH exists and creates ShippingDocuments folder
 * @returns {boolean} true if successful, false if path doesn't exist
 */
export const initializeUploadsDirectory = () => {
  const uploadsPath = config.uploads.path;

  if (!uploadsPath) {
    console.warn('[WARNING] UPLOADS_PATH environment variable is not set. File uploads will not work.');
    return false;
  }

  // Check if uploads path exists
  if (!fs.existsSync(uploadsPath)) {
    console.warn(`[WARNING] UPLOADS_PATH does not exist: ${uploadsPath}. File uploads will not work.`);
    return false;
  }

  // Create ShippingDocuments folder if it doesn't exist
  const shippingDocumentsPath = path.join(uploadsPath, 'ShippingDocuments');
  
  if (!fs.existsSync(shippingDocumentsPath)) {
    fs.mkdirSync(shippingDocumentsPath, { recursive: true });
    console.log(`[SUCCESS] Created ShippingDocuments folder at: ${shippingDocumentsPath}`);
  } else {
    console.log(`[INFO] ShippingDocuments folder already exists at: ${shippingDocumentsPath}`);
  }

  return true;
};

/**
 * Check if UPLOADS_PATH exists and create ShippingDocuments folder
 * Used during file upload operations
 * @returns {string} Full path to ShippingDocuments folder
 */
export const setupUploadsDirectory = () => {
  const uploadsPath = config.uploads.path;

  if (!uploadsPath) {
    throw new AppError('UPLOADS_PATH environment variable is not set', 500);
  }

  // Check if uploads path exists
  if (!fs.existsSync(uploadsPath)) {
    throw new AppError(`UPLOADS_PATH does not exist: ${uploadsPath}`, 400);
  }

  // Create ShippingDocuments folder if it doesn't exist
  const shippingDocumentsPath = path.join(uploadsPath, 'ShippingDocuments');
  
  if (!fs.existsSync(shippingDocumentsPath)) {
    fs.mkdirSync(shippingDocumentsPath, { recursive: true });
  }

  return shippingDocumentsPath;
};

/**
 * Save uploaded files to ShippingDocuments folder
 * @param {Array} files - Array of multer file objects
 * @returns {Array<string>} Array of file paths (relative to UPLOADS_PATH)
 */
export const saveUploadedFiles = (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  const shippingDocumentsPath = setupUploadsDirectory();
  const savedFilePaths = [];

  files.forEach((file, index) => {
    // Generate unique filename with timestamp and index
    const timestamp = Date.now();
    const originalName = file.originalname || `file_${index}`;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${baseName}_${timestamp}_${index}${ext}`;
    
    const filePath = path.join(shippingDocumentsPath, uniqueFileName);
    
    // Save file (multer memoryStorage provides buffer)
    fs.writeFileSync(filePath, file.buffer);
    
    // Store relative path from UPLOADS_PATH (e.g., "ShippingDocuments/filename.pdf")
    const relativePath = path.join('ShippingDocuments', uniqueFileName).replace(/\\/g, '/');
    savedFilePaths.push(relativePath);
  });

  return savedFilePaths;
};

