import { getEndpointConfig } from '../../config/ShippingDB.js';
import { NotFoundError, AuthenticationError, ErrorMessages, AppError } from '../../utils/error.js';

export const authenticateShippingCompany = async (companyName, username, password) => {
  // Get auth endpoint configuration
  const authConfig = getEndpointConfig(companyName, 'auth');
  
  if (!authConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND('auth'));
  }

  if (!authConfig.url) {
    throw new NotFoundError(ErrorMessages.CONFIG_MISSING(companyName));
  }

  // Prepare request body with username and password from user
  const requestBody = {
    ...authConfig.bodyTemplate,
    username,
    password,
  };

  // Make API call to shipping company
  const response = await fetch(authConfig.url, {
    method: authConfig.method,
    headers: {
      ...authConfig.headers,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AuthenticationError(
      errorData.message || ErrorMessages.API_ERROR(response.status)
    );
  }

  const data = await response.json();
  return data;
};

