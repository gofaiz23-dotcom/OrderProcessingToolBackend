import { getEndpointConfig } from '../../config/ShippingDB.js';
import { NotFoundError, AppError, ErrorMessages } from '../../utils/error.js';

export const createPickupRequest = async (companyName, bearerToken, requestBody) => {
  // Get pickup request endpoint configuration
  const pickupConfig = getEndpointConfig(companyName, 'createPickupRequest');
  
  if (!pickupConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND('createPickupRequest'));
  }

  if (!pickupConfig.url) {
    throw new NotFoundError(ErrorMessages.CONFIG_MISSING(companyName));
  }

  // Merge bodyTemplate with user's request body
  const mergedBody = mergeBodyWithTemplate(pickupConfig.bodyTemplate, requestBody);

  // Prepare headers with Bearer token
  const headers = {
    ...pickupConfig.headers,
    Authorization: `Bearer ${bearerToken}`,
  };

  // Make API call to shipping company
  const response = await fetch(pickupConfig.url, {
    method: pickupConfig.method,
    headers,
    body: JSON.stringify(mergedBody),
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

