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

  // Generate unique correlation ID (simple numeric format as per Walmart docs example)
  const correlationId = Date.now().toString();

  // Create Basic Auth header (ClientId:ClientSecret encoded in base64)
  // Walmart expects: Username = ClientId, Password = ClientSecret
  const credentials = Buffer.from(`${trimmedClientId}:${trimmedClientSecret}`).toString('base64');

  // Prepare request body (form-urlencoded)
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  });
  
  const bodyString = body.toString();
  
  // Debug logging (remove in production or use proper logger)
  console.log('Walmart Token Request Details:', {
    url: tokenUrl,
    method: 'POST',
    clientIdLength: trimmedClientId.length,
    clientSecretLength: trimmedClientSecret.length,
    clientIdFirstChars: trimmedClientId.substring(0, 5) + '...',
    correlationId,
    body: bodyString,
    credentialsLength: credentials.length,
  });

  try {
    // Prepare headers exactly as Walmart API requires
    // Walmart is very strict about header format - use exact casing and values
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'WM_SVC.NAME': 'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': correlationId,
      'Authorization': `Basic ${credentials}`,
    };
    
    // Log the exact headers being sent (without sensitive data)
    console.log('Walmart Request Headers:', {
      'Content-Type': headers['Content-Type'],
      'WM_SVC.NAME': headers['WM_SVC.NAME'],
      'WM_QOS.CORRELATION_ID': headers['WM_QOS.CORRELATION_ID'],
      'Authorization': 'Basic [REDACTED]',
      'Body': bodyString,
    });
    
    // Make API call to Walmart
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: bodyString,
    });

    if (!response.ok) {
      let errorMessage;
      let errorDetails = null;
      try {
        const errorText = await response.text();
        errorMessage = errorText || ErrorMessages.API_ERROR(response.status);
        
        // Try to parse error response (might be XML or JSON)
        try {
          if (errorText.trim().startsWith('<')) {
            // XML error response
            const parser = new XMLParser();
            errorDetails = parser.parse(errorText);
          } else {
            // JSON error response
            errorDetails = JSON.parse(errorText);
          }
        } catch (parseError) {
          // Keep the raw text if parsing fails
          errorDetails = errorText;
        }
      } catch (e) {
        errorMessage = ErrorMessages.API_ERROR(response.status);
      }
      
      // Log detailed error for debugging
      console.error('Walmart API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorText: errorMessage,
        errorDetails,
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

