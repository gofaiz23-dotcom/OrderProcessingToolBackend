import { getEndpointConfig } from '../../config/ShippingDB.js';
import { NotFoundError, AppError, ErrorMessages } from '../../utils/error.js';

export const createRateQuote = async (companyName, bearerToken, requestBody) => {
  // Get rate quote endpoint configuration
  const rateQuoteConfig = getEndpointConfig(companyName, 'createRateQuote');
  
  if (!rateQuoteConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND('createRateQuote'));
  }

  if (!rateQuoteConfig.url) {
    throw new NotFoundError(ErrorMessages.CONFIG_MISSING(companyName));
  }

  // Merge bodyTemplate with user's request body
  const mergedBody = mergeBodyWithTemplate(rateQuoteConfig.bodyTemplate, requestBody);

  // Prepare headers with Bearer token
  const headers = {
    ...rateQuoteConfig.headers,
    Authorization: `Bearer ${bearerToken}`,
  };

  // Get Content-Type from config (no hardcoding - always from ShippingDB.js)
  const contentType = headers['Content-Type'] || headers['content-type'];
  
  // Format body based on Content-Type from config (fully dynamic)
  let body;
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    // Convert to URL-encoded format
    body = new URLSearchParams();
    Object.entries(mergedBody).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value.toString());
        }
      }
    });
    body = body.toString();
  } else {
    // Default to JSON (or use Content-Type from config)
    body = JSON.stringify(mergedBody);
  }

  // Make API call to shipping company
  const response = await fetch(rateQuoteConfig.url, {
    method: rateQuoteConfig.method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AppError(
      errorData.message || ErrorMessages.API_ERROR(response.status),
      response.status
    );
  }

  const data = await response.json();
  return data;
};

// Helper function to merge user body with template
const mergeBodyWithTemplate = (template, userBody) => {
  const merged = JSON.parse(JSON.stringify(template)); // Deep clone

  const mergeRecursive = (templateObj, userObj) => {
    for (const key in userObj) {
      if (userObj[key] !== null && userObj[key] !== undefined) {
        if (
          typeof userObj[key] === 'object' &&
          !Array.isArray(userObj[key]) &&
          templateObj[key] &&
          typeof templateObj[key] === 'object' &&
          !Array.isArray(templateObj[key])
        ) {
          mergeRecursive(templateObj[key], userObj[key]);
        } else {
          templateObj[key] = userObj[key];
        }
      }
    }
  };

  mergeRecursive(merged, userBody);
  return merged;
};

