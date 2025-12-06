import { createBillOfLading } from '../../services/Logistics/BillOfLadingService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { AuthenticationError, NotFoundError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const createBillOfLadingHandler = asyncHandler(async (req, res, next) => {
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
  const bolConfig = getEndpointConfig(shippingCompany, 'createBillOfLading');
  if (!bolConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND(`createBillOfLading for company: ${shippingCompany}`));
  }

  const shippingCompanyName = bolConfig.shippingCompanyName;

  // Create bill of lading with token and body
  const bolResponse = await createBillOfLading(
    shippingCompanyName,
    bearerToken,
    requestBody
  );

  res.status(200).json({
    message: `Bill of Lading created successfully for ${shippingCompanyName}`,
    shippingCompanyName,
    data: bolResponse,
  });
});

