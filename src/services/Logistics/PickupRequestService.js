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
  
  // Log merged body for debugging (truncated for large payloads)
  console.log('Merged body (first 2000 chars):', JSON.stringify(mergedBody, null, 2).substring(0, 2000));

  // Prepare headers with Bearer token
  const headers = {
    ...pickupConfig.headers,
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
  console.log('Making request to Estes API:', {
    url: pickupConfig.url,
    method: pickupConfig.method,
    headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [REDACTED]' : undefined },
    bodyLength: body.length,
    bodyPreview: typeof body === 'string' ? body.substring(0, 500) : JSON.stringify(body).substring(0, 500),
  });

  const response = await fetch(pickupConfig.url, {
    method: pickupConfig.method,
    headers,
    body,
  });

  if (!response.ok) {
    let errorData = {};
    let errorText = '';
    
    try {
      errorText = await response.clone().text();
      console.error('Estes API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 1000),
      });
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText, rawText: errorText };
      }
    } catch (e) {
      console.error('Error reading Estes API error response:', e);
      errorData = { message: response.statusText };
    }
    
    // Log the merged body that was sent (for debugging)
    console.error('Merged body sent to Estes API:', JSON.stringify(mergedBody, null, 2).substring(0, 2000));
    
    // Extract detailed error message with validation failures
    let errorMessage = errorData.message || errorData.error?.message || errorData.details || ErrorMessages.API_ERROR(response.status);
    
    // Add validation failures if available
    if (errorData.error?.validationFailures && Array.isArray(errorData.error.validationFailures)) {
      const failures = errorData.error.validationFailures.map(f => `${f.field}: ${f.description}`).join('; ');
      errorMessage = `${errorMessage} - Validation failures: ${failures}`;
    }
    
    throw new AppError(
      errorMessage,
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
        // Handle arrays - replace template array with user array
        if (Array.isArray(userObj[key])) {
          templateObj[key] = userObj[key];
        }
        // Handle nested objects - recursively merge
        else if (
          typeof userObj[key] === 'object' &&
          templateObj[key] &&
          typeof templateObj[key] === 'object' &&
          !Array.isArray(templateObj[key])
        ) {
          mergeRecursive(templateObj[key], userObj[key]);
        }
        // Handle primitive values - replace template value
        else {
          templateObj[key] = userObj[key];
        }
      }
    }
  };

  mergeRecursive(merged, userBody);
  return merged;
};

