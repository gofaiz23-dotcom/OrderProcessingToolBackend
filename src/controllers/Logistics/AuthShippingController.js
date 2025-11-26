import { authenticateShippingCompany } from '../../services/Logistics/AuthShippingService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { ValidationError, NotFoundError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const authShippingCompany = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Validate required fields
  if (!username) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('username'));
  }

  if (!password) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('password'));
  }

  // Get shipping company config using helper function
  const authConfig = getEndpointConfig('estes', 'auth');
  if (!authConfig) {
    throw new NotFoundError(ErrorMessages.NO_COMPANIES_CONFIGURED);
  }

  const shippingCompanyName = authConfig.shippingCompanyName;

  // Authenticate with shipping company
  const authResponse = await authenticateShippingCompany(
    shippingCompanyName,
    username,
    password
  );

  res.status(200).json({
    message: `Authentication successful for ${shippingCompanyName}`,
    shippingCompanyName,
    data: authResponse,
  });
});

