import { AppError, ErrorMessages } from '../../utils/error.js';

/**
 * Download BOL PDF from XPO API
 * @param {string} shippingCompanyName - Shipping company name (e.g., 'xpo')
 * @param {string} token - Bearer token for authentication (from request body)
 * @param {string} pdfUri - Relative URI from BOL response (e.g., '/billoflading/1.0/billsoflading/7231049604370/pdf')
 * @returns {Promise<Object>} Response object with XPO API response + shippingCompanyName
 */
export const downloadBOLPDF = async (shippingCompanyName, token, pdfUri) => {
  try {
    console.log('downloadBOLPDF - Starting:', {
      shippingCompanyName,
      hasToken: !!token,
      tokenLength: token?.length,
      pdfUri,
    });

    // Get XPO_LTL_URL from environment variables
    const xpoLtlUrl = process.env.XPO_LTL_URL;
    
    if (!xpoLtlUrl) {
      throw new AppError('XPO_LTL_URL environment variable is not configured', 500);
    }

    if (!pdfUri) {
      throw new AppError('PDF URI is required', 400);
    }

    if (!token) {
      throw new AppError('Token is required', 401);
    }

    // Construct full URL: XPO_LTL_URL + pdfUri
    const baseUrl = xpoLtlUrl.replace(/\/$/, ''); // Remove trailing slash from base URL
    const cleanPdfUri = pdfUri.startsWith('/') ? pdfUri : `/${pdfUri}`; // Ensure pdfUri starts with /
    const fullUrl = `${baseUrl}${cleanPdfUri}`;

    console.log('BOL PDF Download Configuration:', {
      xpoLtlUrl: xpoLtlUrl,
      pdfUri: pdfUri,
      cleanPdfUri: cleanPdfUri,
      fullUrl: fullUrl,
    });

    // Headers for XPO API request
    const headers = {
      'Accept': 'application/json', // XPO API returns JSON with base64 PDF
      'Authorization': `Bearer ${token}`,
    };

    console.log('BOL PDF Request Headers:', {
      'Accept': headers.Accept,
      'Authorization': 'Bearer ' + (token ? '***' + token.slice(-4) : 'missing'),
      url: fullUrl,
    });

    // Make GET request to XPO API
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    // Parse response as JSON (XPO API returns JSON with base64 PDF content)
    let responseData;
    try {
      const responseText = await response.text();
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse XPO API response as JSON:', parseError);
      throw new AppError('Invalid response format from XPO API', 500);
    }

    // If response is not ok, return the error response from XPO with shippingCompanyName added
    if (!response.ok) {
      console.error('BOL PDF Download Error:', {
        status: response.status,
        statusText: response.statusText,
        responseData: responseData,
        requestUrl: fullUrl,
      });
      
      // Return XPO error response with shippingCompanyName added
      return {
        ...responseData,
        shippingCompanyName: shippingCompanyName,
      };
    }

    // Success: Add shippingCompanyName to the response
    const successResponse = {
      ...responseData,
      shippingCompanyName: shippingCompanyName,
    };

    console.log('BOL PDF downloaded successfully. Response code:', responseData.code);
    
    return successResponse;
  } catch (error) {
    console.error('Error in downloadBOLPDF:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode,
      shippingCompanyName,
      pdfUri,
    });
    
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    // Otherwise, wrap it in an AppError
    throw new AppError(
      `Failed to download BOL PDF: ${error.message}`,
      error.statusCode || 500
    );
  }
};

