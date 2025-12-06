// Centralized Error Handling Utility

// Custom Error Classes
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Authorization required') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Error Response Formatter
export const formatErrorResponse = (error) => {
  // Handle AppError and its subclasses
  if (error instanceof AppError) {
    return {
      status: error.statusCode || 500,
      message: error.message || 'An error occurred',
    };
  }

  // Handle ValidationError, NotFoundError, etc. (subclasses of AppError)
  if (error.name === 'ValidationError' || error.name === 'NotFoundError' || 
      error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
    return {
      status: error.statusCode || 400,
      message: error.message || 'An error occurred',
    };
  }

  // Handle errors with status property
  if (error.status || error.statusCode) {
    return {
      status: error.status || error.statusCode || 500,
      message: error.message || 'An error occurred',
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      status: 500,
      message: error,
    };
  }

  // Default error response - ensure we always return a message
  return {
    status: 500,
    message: error?.message || error?.toString() || 'Internal server error',
  };
};

// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  // Log full error details for debugging
  console.error('Error Handler - Full Error Details:', {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    statusCode: err?.statusCode,
    status: err?.status,
    path: req?.path,
    method: req?.method,
    body: req?.body ? JSON.stringify(req.body).substring(0, 500) : undefined,
  });

  const errorResponse = formatErrorResponse(err);

  // Ensure we have a valid status code
  const statusCode = errorResponse.status || 500;
  
  // Ensure we have a valid error message
  const errorMessage = errorResponse.message || 'An unexpected error occurred';

  // Log formatted error response
  console.error('Error Handler - Formatted Response:', {
    status: statusCode,
    message: errorMessage,
  });

  res.status(statusCode).json({
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err?.stack,
      originalError: err?.message,
      errorName: err?.name,
    }),
  });
};

// Async Error Wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common Error Messages - User Friendly
export const ErrorMessages = {
  // Validation Errors
  REQUIRED_FIELD: (fieldName) => `Please provide the "${fieldName}" field. This field is required to process your request.`,
  INVALID_FORMAT: (fieldName) => `The "${fieldName}" field has an invalid format. Please check the format and try again.`,
  INVALID_JSON: (fieldName) => `The "${fieldName}" field must be valid JSON. Please check your JSON syntax.`,
  EMPTY_FIELD: (fieldName) => `The "${fieldName}" field cannot be empty. Please provide a value.`,
  INVALID_EMAIL: 'Please provide a valid email address (e.g., user@example.com).',
  INVALID_PHONE: 'Please provide a valid phone number.',
  INVALID_DATE: (format) => `Please provide a valid date in the format: ${format || 'YYYY-MM-DD'}.`,
  INVALID_ARRAY: (fieldName) => `The "${fieldName}" field must be an array. Please provide a valid array.`,
  INVALID_NUMBER: (fieldName) => `The "${fieldName}" field must be a number. Please provide a valid number.`,
  INVALID_BOOLEAN: (fieldName) => `The "${fieldName}" field must be true or false.`,
  MIN_LENGTH: (fieldName, min) => `The "${fieldName}" field must be at least ${min} characters long.`,
  MAX_LENGTH: (fieldName, max) => `The "${fieldName}" field cannot exceed ${max} characters.`,

  // Authentication Errors
  MISSING_TOKEN: 'Authentication required. Please include a Bearer token in the Authorization header (e.g., Authorization: Bearer your_token_here).',
  INVALID_TOKEN: 'The provided token is invalid or has expired. Please authenticate again to get a new token.',
  AUTH_FAILED: 'Authentication failed. Please check your credentials and try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please authenticate again.',
  NO_CREDENTIALS: 'Please provide your username and password to authenticate.',

  // Authorization Errors
  UNAUTHORIZED: 'You do not have permission to access this resource. Please contact support if you believe this is an error.',
  FORBIDDEN: 'Access denied. You do not have the required permissions for this action.',

  // Shipping Company Errors
  COMPANY_NOT_FOUND: (companyName) => `The shipping company "${companyName}" is not available or not configured. Please check the company name and try again.`,
  ENDPOINT_NOT_FOUND: (endpointName) => `The requested endpoint "${endpointName}" is not available. Please check the endpoint name.`,
  CONFIG_MISSING: (companyName) => `The configuration for shipping company "${companyName}" is missing. Please contact support.`,
  NO_COMPANIES_CONFIGURED: 'No shipping companies are currently configured. Please contact support to set up shipping companies.',
  INVALID_COMPANY: 'The specified shipping company is not valid. Please select a valid shipping company.',

  // API Errors
  API_ERROR: (status) => {
    const statusMessages = {
      400: 'Bad request. Please check your request data and try again.',
      401: 'Unauthorized. Please authenticate with a valid token.',
      403: 'Forbidden. You do not have permission to perform this action.',
      404: 'The requested resource was not found. Please check the URL and try again.',
      409: 'Conflict. The resource already exists or there is a conflict.',
      422: 'Validation error. Please check your request data.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Internal server error. Please try again later or contact support.',
      502: 'Bad gateway. The service is temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. The request took too long. Please try again.',
    };
    return statusMessages[status] || `API request failed with status ${status}. Please try again or contact support.`;
  },
  NETWORK_ERROR: 'Network connection error. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  CONNECTION_ERROR: 'Unable to connect to the service. Please check your connection and try again.',

  // Rate Quote Errors
  RATE_QUOTE_FAILED: 'Failed to create rate quote. Please check your shipment details and try again.',
  INVALID_SHIPMENT_DATA: 'Invalid shipment data provided. Please check all required fields (origin, destination, commodity, etc.).',
  MISSING_ORIGIN: 'Please provide the origin address details (city, state, postal code, country).',
  MISSING_DESTINATION: 'Please provide the destination address details (city, state, postal code, country).',
  MISSING_COMMODITY: 'Please provide commodity information (handling units, weight, dimensions).',

  // Bill of Lading Errors
  BOL_CREATION_FAILED: 'Failed to create Bill of Lading. Please verify all required information and try again.',
  MISSING_ORIGIN_INFO: 'Please provide complete origin information (name, address, city, state, postal code, contact).',
  MISSING_DESTINATION_INFO: 'Please provide complete destination information (name, address, city, state, postal code, contact).',
  MISSING_BILL_TO: 'Please provide complete bill-to information (account, name, address, contact).',
  INVALID_REFERENCE: 'Please provide valid reference numbers (masterBol, quoteID).',

  // General Errors
  INTERNAL_ERROR: 'An unexpected error occurred. Our team has been notified. Please try again later or contact support.',
  NOT_FOUND: 'The requested resource was not found. Please check the URL or resource ID and try again.',
  BAD_REQUEST: 'Invalid request. Please check your request data and try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later or contact support if the problem persists.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again or contact support.',

  // Data Errors
  INVALID_DATA: 'The provided data is invalid. Please check all fields and try again.',
  MISSING_DATA: 'Required data is missing. Please provide all required fields.',
  DUPLICATE_DATA: 'This data already exists. Please use different values.',
  DATA_TOO_LARGE: 'The data provided is too large. Please reduce the size and try again.',

  // File Errors
  FILE_TOO_LARGE: 'The file is too large. Please upload a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file format.',
  FILE_UPLOAD_FAILED: 'File upload failed. Please try again.',

  // Rate Limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment before trying again.',
};

