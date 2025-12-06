import { getEndpointConfig } from '../../config/ShippingDB.js';
import { NotFoundError, AuthenticationError, ErrorMessages, AppError } from '../../utils/error.js';

export const authenticateShippingCompany = async (companyName, username, password) => {
  // Get auth endpoint configuration
  const authConfig = getEndpointConfig(companyName, 'auth');
  
  if (!authConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND('auth'));
  }

  if (!authConfig.url) {
    throw new NotFoundError(ErrorMessages.CONFIG_MISSING(companyName));
  }

  // Prepare request body with username and password from user
  const requestBody = {
    ...authConfig.bodyTemplate,
    username,
    password,
  };

  // Get Content-Type from config (no hardcoding - always from ShippingDB.js)
  const contentType = authConfig.headers['Content-Type'] || authConfig.headers['content-type'];
  
  if (!contentType) {
    throw new NotFoundError('Content-Type header is missing in shipping company configuration');
  }

  // Format body based on Content-Type from config (fully dynamic)
  let body;
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    // Convert to URL-encoded format (for companies that use form-urlencoded)
    body = new URLSearchParams();
    Object.entries(requestBody).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        body.append(key, value.toString());
      }
    });
    body = body.toString();
  } else if (contentType.includes('application/json')) {
    // Use JSON format (for companies that use JSON)
    body = JSON.stringify(requestBody);
  } else {
    // Support for other content types in the future (e.g., XML, text/plain, etc.)
    // Default to JSON if content type is not recognized
    body = JSON.stringify(requestBody);
  }

  // Make API call to shipping company
  const response = await fetch(authConfig.url, {
    method: authConfig.method,
    headers: {
      ...authConfig.headers,
    },
    body,
  });

  if (!response.ok) {
    // Try to parse error response, but handle cases where response might not be JSON
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorData.error_description || ErrorMessages.API_ERROR(response.status);
    } catch (e) {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        errorMessage = errorText || ErrorMessages.API_ERROR(response.status);
      } catch (textError) {
        errorMessage = ErrorMessages.API_ERROR(response.status);
      }
    }
    
    throw new AuthenticationError(errorMessage);
  }

  // Parse response - handle both JSON and form-urlencoded responses
  let data;
  const responseContentType = response.headers.get('content-type') || '';
  if (responseContentType.includes('application/json')) {
    data = await response.json();
  } else {
    // Try to parse as JSON anyway, fallback to text
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      throw new AuthenticationError('Invalid response format from authentication service');
    }
  }

  return data;
};

