import { AuthenticationError, ValidationError, ErrorMessages } from '../../utils/error.js';
import { XMLParser } from 'fast-xml-parser';

/**
 * Get Walmart Orders
 * @param {string} accessToken - Walmart access token (required)
 * @param {Object} queryParams - Query parameters for filtering orders
 * @returns {Promise<Object>} Orders response in JSON format
 */
export const getWalmartOrders = async (accessToken, queryParams = {}) => {
  // Validate access token
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
    throw new ValidationError('Access token is required. Please provide WM_SEC.ACCESS_TOKEN in headers.');
  }

  const trimmedAccessToken = accessToken.trim();

  // Walmart Orders API endpoint
  const ordersUrl = 'https://marketplace.walmartapis.com/v3/orders';

  // Generate unique correlation ID
  const generateCorrelationId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  const correlationId = generateCorrelationId();

  // Build query string from parameters
  const buildQueryString = (params) => {
    const validParams = {};
    
    // Only include non-empty parameters
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        validParams[key] = String(value).trim();
      }
    });

    if (Object.keys(validParams).length === 0) {
      return '';
    }

    const queryString = new URLSearchParams(validParams).toString();
    return queryString ? `?${queryString}` : '';
  };

  const queryString = buildQueryString(queryParams);
  const fullUrl = queryString ? `${ordersUrl}${queryString}` : ordersUrl;

  try {
    // Prepare headers exactly as Walmart API requires
    const headers = {
      'Content-Type': 'application/json',
      'WM_SVC.NAME': 'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': correlationId,
      'WM_SEC.ACCESS_TOKEN': trimmedAccessToken,
    };

    // Make GET request to Walmart Orders API
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    // Get response content
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage;
      let errorDetails = null;
      
      try {
        errorMessage = responseText || ErrorMessages.API_ERROR(response.status);
        
        // Try to parse error response (might be XML or JSON)
        try {
          if (responseText.trim().startsWith('<')) {
            // XML error response
            const parser = new XMLParser();
            errorDetails = parser.parse(responseText);
          } else if (responseText.trim().startsWith('{')) {
            // JSON error response
            errorDetails = JSON.parse(responseText);
          } else {
            // Plain text error
            errorDetails = responseText;
          }
        } catch (parseError) {
          errorDetails = responseText;
        }
      } catch (e) {
        errorMessage = ErrorMessages.API_ERROR(response.status);
      }

      // Log detailed error for debugging
      console.error('Walmart Orders API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        errorText: errorMessage,
        errorDetails,
      });

      // Use appropriate error class based on status code
      const statusCode = response.status === 401 || response.status === 403 
        ? response.status 
        : response.status >= 400 && response.status < 500 
          ? 400 
          : 500;
      
      if (response.status === 401) {
        const error = new AuthenticationError(
          `Walmart Orders API error (401): Invalid or expired access token. ${errorMessage}`
        );
        error.statusCode = 401;
        throw error;
      }

      const error = new ValidationError(
        `Walmart Orders API error (${response.status}): ${errorMessage}${errorDetails ? ` - ${JSON.stringify(errorDetails)}` : ''}`
      );
      error.statusCode = statusCode;
      throw error;
    }

    // Parse XML to JSON
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });

    const jsonResponse = parser.parse(responseText);

    return jsonResponse;
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Failed to get Walmart orders: ${error.message}`);
  }
};

