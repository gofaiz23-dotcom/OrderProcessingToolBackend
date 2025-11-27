import { createPickupRequest } from '../../services/Logistics/PickupRequestService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { AuthenticationError, NotFoundError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const createPickupRequestHandler = asyncHandler(async (req, res, next) => {
  // Get Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError(ErrorMessages.MISSING_TOKEN);
  }

  const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Get shipping company config using helper function
  const pickupConfig = getEndpointConfig('estes', 'createPickupRequest');
  if (!pickupConfig) {
    throw new NotFoundError(ErrorMessages.NO_COMPANIES_CONFIGURED);
  }

  const shippingCompanyName = pickupConfig.shippingCompanyName;

  // Get request body (user will send only the fields they want to fill)
  const requestBody = req.body;

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

