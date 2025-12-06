import { createPickupRequest } from '../../services/Logistics/PickupRequestService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { AuthenticationError, NotFoundError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const createPickupRequestHandler = asyncHandler(async (req, res, next) => {
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
  const pickupConfig = getEndpointConfig(shippingCompany, 'createPickupRequest');
  if (!pickupConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND(`createPickupRequest for company: ${shippingCompany}`));
  }

  const shippingCompanyName = pickupConfig.shippingCompanyName;

  // Create pickup request with token and body
  const pickupResponse = await createPickupRequest(
    shippingCompanyName,
    bearerToken,
    requestBody
  );

  res.status(200).json({
    message: `Pickup request created successfully for ${shippingCompanyName}`,
    shippingCompanyName,
    data: pickupResponse,
  });
});

