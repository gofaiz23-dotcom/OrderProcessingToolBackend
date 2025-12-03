import { createRateQuote } from '../../services/Logistics/RateQuoteService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { AuthenticationError, NotFoundError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const createRateQuoteHandler = asyncHandler(async (req, res, next) => {
  // Get Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError(ErrorMessages.MISSING_TOKEN);
  }

  const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Get shipping company from request body
  const { shippingCompany, ...requestBody } = req.body;

  if (!shippingCompany) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('shippingCompany'));
  }

  // Get shipping company config using helper function
  const rateQuoteConfig = getEndpointConfig(shippingCompany, 'createRateQuote');
  if (!rateQuoteConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND(`createRateQuote for company: ${shippingCompany}`));
  }

  const shippingCompanyName = rateQuoteConfig.shippingCompanyName;

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
});

