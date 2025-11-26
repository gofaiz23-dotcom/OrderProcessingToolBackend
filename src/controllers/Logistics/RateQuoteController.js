import { createRateQuote } from '../../services/Logistics/RateQuoteService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';

export const createRateQuoteHandler = async (req, res, next) => {
  try {
    // Get Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization header with Bearer token is required.',
      });
    }

    const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get shipping company config using helper function
    const rateQuoteConfig = getEndpointConfig('estes', 'createRateQuote');
    if (!rateQuoteConfig) {
      return res.status(500).json({
        message: 'No shipping companies configured.',
      });
    }

    const shippingCompanyName = rateQuoteConfig.shippingCompanyName;

    // Get request body (user will send only the fields they want to fill)
    const requestBody = req.body;

    // Create rate quote with token and body
    const quoteResponse = await createRateQuote(
      shippingCompanyName,
      bearerToken,
      requestBody
    );

    res.status(200).json({
      message: `Rate quote created successfully for ${shippingCompanyName}`,
      shippingCompanyName,
      data: quoteResponse,
    });
  } catch (error) {
    console.error('Error creating rate quote:', error);
    next({
      status: error.status || 500,
      message: error.message || 'Internal server error',
    });
  }
};

