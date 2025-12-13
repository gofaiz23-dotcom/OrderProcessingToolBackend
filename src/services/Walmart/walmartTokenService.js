import { config } from '../../config/env.js';
import { AuthenticationError, ErrorMessages } from '../../utils/error.js';
import { XMLParser } from 'fast-xml-parser';

/**
 * Get Walmart OAuth token
 * @returns {Promise<Object>} Token response in JSON format
 */
export const getWalmartToken = async () => {
  const { clientId, clientSecret, tokenUrl } = config.walmart;

  // Validate credentials
  if (!clientId || !clientSecret) {
    throw new AuthenticationError('Walmart credentials are not configured. Please set WALMART_CLIENT_ID and WALMART_CLIENT_SECRET in .env file.');
  }

  // Trim credentials to remove any whitespace and newlines
  const trimmedClientId = clientId.trim().replace(/\r?\n/g, '');
  const trimmedClientSecret = clientSecret.trim().replace(/\r?\n/g, '');

  // Validate credentials are not empty after trimming
  if (!trimmedClientId || !trimmedClientSecret) {
    throw new AuthenticationError('Walmart credentials are empty after trimming. Please check your .env file.');
  }

  // Generate unique correlation ID (alphanumeric format like Postman)
  // Generate random alphanumeric string similar to Postman's format
  const generateCorrelationId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  const correlationId = generateCorrelationId();

  // Create Basic Auth header (ClientId:ClientSecret encoded in base64)
  // Walmart expects: Username = ClientId, Password = ClientSecret
  // Ensure no extra spaces or characters in the credentials string
  const authString = `${trimmedClientId}:${trimmedClientSecret}`;
  const credentials = Buffer.from(authString, 'utf8').toString('base64');
  
  // Verify encoding (for debugging)
  const decoded = Buffer.from(credentials, 'base64').toString('utf8');
  if (decoded !== authString) {
    console.warn('Walmart Auth Encoding Warning: Decoded credentials do not match original');
  }

  // Prepare request body (form-urlencoded)
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  });
  
  const bodyString = body.toString();
  
  // Debug logging (remove in production or use proper logger)
  
  try {
    // Prepare headers exactly as Walmart API requires
    // Walmart is very strict about header format - use exact casing and values
    // Only include the headers that Walmart requires - fetch might add unwanted headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'WM_SVC.NAME': 'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': correlationId,
      'Authorization': `Basic ${credentials}`,
      // Explicitly set Accept to avoid fetch adding unwanted headers
      'Accept': '*/*',
    };
    
    
    
    // Make API call to Walmart
    // Use signal to prevent fetch from adding User-Agent or other headers
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: bodyString,
      // Prevent fetch from modifying headers
      redirect: 'follow',
    });

    if (!response.ok) {
      let errorMessage;
      let errorDetails = null;
      let rawErrorText = '';
      try {
        rawErrorText = await response.text();
        errorMessage = rawErrorText || ErrorMessages.API_ERROR(response.status);
        
        // Log the raw error response first
        console.error('Walmart API Raw Error Response:', {
          status: response.status,
          statusText: response.statusText,
          rawErrorText: rawErrorText.substring(0, 1000), // First 1000 chars
          fullLength: rawErrorText.length,
        });
        
        // Try to parse error response (might be XML or JSON)
        try {
          if (rawErrorText.trim().startsWith('<')) {
            // XML error response
            const parser = new XMLParser();
            errorDetails = parser.parse(rawErrorText);
          } else if (rawErrorText.trim().startsWith('{')) {
            // JSON error response
            errorDetails = JSON.parse(rawErrorText);
          } else {
            // Plain text error
            errorDetails = rawErrorText;
          }
        } catch (parseError) {
          // Keep the raw text if parsing fails
          errorDetails = rawErrorText;
          console.error('Error parsing Walmart error response:', parseError.message);
        }
      } catch (e) {
        errorMessage = ErrorMessages.API_ERROR(response.status);
        console.error('Error reading Walmart error response:', e.message);
      }
      
      // Log detailed error for debugging
      console.error('Walmart API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        errorText: errorMessage,
        errorDetails,
        rawErrorText: rawErrorText.substring(0, 500),
      });
      
      // Use the actual HTTP status code from the response
      const statusCode = response.status === 401 || response.status === 403 
        ? response.status 
        : response.status >= 400 && response.status < 500 
          ? 400 
          : 500;
      
      const error = new AuthenticationError(
        `Walmart API error (${response.status}): ${errorMessage}${errorDetails ? ` - ${JSON.stringify(errorDetails)}` : ''}`
      );
      error.statusCode = statusCode;
      throw error;
    }

    // Get response content
    const responseText = await response.text();

    // Parse XML to JSON
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    const jsonResponse = parser.parse(responseText);

    // Extract token data from parsed XML
    // XML structure: <OAuthTokenDTO><accessToken>...</accessToken><tokenType>...</tokenType><expiresIn>...</expiresIn></OAuthTokenDTO>
    const tokenData = jsonResponse.OAuthTokenDTO || jsonResponse;

    // Format response to clean JSON
    const formattedResponse = {
      accessToken: tokenData.accessToken || null,
      tokenType: tokenData.tokenType || 'Bearer',
      expiresIn: tokenData.expiresIn ? parseInt(tokenData.expiresIn, 10) : null,
    };

    return formattedResponse;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError(`Failed to get Walmart token: ${error.message}`);
  }
};

