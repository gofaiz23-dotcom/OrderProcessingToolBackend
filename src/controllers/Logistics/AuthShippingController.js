import { authenticateShippingCompany } from '../../services/Logistics/AuthShippingService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { upsertShippingCompanyToken } from '../../models/Logistics/shippingCompanyTokenModel.js';
import { ValidationError, NotFoundError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const authShippingCompany = asyncHandler(async (req, res, next) => {
  const { username, password, shippingCompany } = req.body;

  // Validate required fields
  if (!username) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('username'));
  }

  if (!password) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('password'));
  }

  if (!shippingCompany) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('shippingCompany'));
  }

  // Get shipping company config using helper function
  const authConfig = getEndpointConfig(shippingCompany, 'auth');
  if (!authConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND(`auth for company: ${shippingCompany}`));
  }

  const shippingCompanyName = authConfig.shippingCompanyName;

  // Authenticate with shipping company
  const authResponse = await authenticateShippingCompany(
    shippingCompanyName,
    username,
    password
  );

  // Extract token from response (adjust based on actual API response structure)
  const token = authResponse.token || authResponse.accessToken || authResponse.access_token || authResponse.data?.token;
  
  // Save/update token in database
  if (token) {
    await upsertShippingCompanyToken(shippingCompanyName, token);
  }

  res.status(200).json({
    message: `Authentication successful for ${shippingCompanyName}`,
    shippingCompanyName,
    data: authResponse,
  });
});

