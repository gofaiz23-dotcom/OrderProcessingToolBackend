import { createBillOfLading } from '../../services/Logistics/BillOfLadingService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { AuthenticationError, NotFoundError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const createBillOfLadingHandler = asyncHandler(async (req, res, next) => {
  // Get Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError(ErrorMessages.MISSING_TOKEN);
  }

  const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Get shipping company config using helper function
  const bolConfig = getEndpointConfig('estes', 'createBillOfLading');
  if (!bolConfig) {
    throw new NotFoundError(ErrorMessages.NO_COMPANIES_CONFIGURED);
  }

  const shippingCompanyName = bolConfig.shippingCompanyName;

  // Get request body (user will send only the fields they want to fill)
  const requestBody = req.body;

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

