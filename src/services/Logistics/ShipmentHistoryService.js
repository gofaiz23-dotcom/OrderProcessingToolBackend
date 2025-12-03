import { getEndpointConfig } from '../../config/ShippingDB.js';
import { NotFoundError, AppError, ErrorMessages } from '../../utils/error.js';

export const getShipmentHistory = async (companyName, bearerToken, queryParams) => {
  // Get shipment history endpoint configuration
  const historyConfig = getEndpointConfig(companyName, 'getShipmentHistory');
  
  if (!historyConfig) {
    throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND('getShipmentHistory'));
  }

  if (!historyConfig.url) {
    throw new NotFoundError(ErrorMessages.CONFIG_MISSING(companyName));
  }

  // Validate at least one query parameter is provided
  const hasParams = Object.values(queryParams).some(value => value !== null && value !== undefined && value !== '');
  if (!hasParams) {
    throw new AppError('At least one query parameter is required. For Estes: pro, po, bol, pur, ldn, exl, interline-pro. For XPO: referenceNumbers', 400);
  }

  // Build query string
  const queryString = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Handle interline-pro key
      const paramKey = key === 'interlinePro' ? 'interline-pro' : key;
      queryString.append(paramKey, value.toString());
    }
  });

  const url = `${historyConfig.url}?${queryString.toString()}`;

  // Prepare headers with Bearer token
  const headers = {
    ...historyConfig.headers,
    Authorization: `Bearer ${bearerToken}`,
  };

  // Make API call to shipping company
  const response = await fetch(url, {
    method: historyConfig.method,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AppError(
      errorData.message || ErrorMessages.API_ERROR(response.status),
      response.status
    );
  }

  const data = await response.json();
  return data;
};

