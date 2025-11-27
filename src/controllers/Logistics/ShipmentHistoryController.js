import { getShipmentHistory } from '../../services/Logistics/ShipmentHistoryService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';
import { AuthenticationError, NotFoundError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

export const getShipmentHistoryHandler = asyncHandler(async (req, res, next) => {
  // Get Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError(ErrorMessages.MISSING_TOKEN);
  }

  const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Get shipping company config using helper function
  const historyConfig = getEndpointConfig('estes', 'getShipmentHistory');
  if (!historyConfig) {
    throw new NotFoundError(ErrorMessages.NO_COMPANIES_CONFIGURED);
  }

  const shippingCompanyName = historyConfig.shippingCompanyName;

  // Get query parameters
  const { pro, po, bol, pur, ldn, exl, interlinePro } = req.query;

  // Prepare query parameters object
  const queryParams = {
    pro: pro || null,
    po: po || null,
    bol: bol || null,
    pur: pur || null,
    ldn: ldn || null,
    exl: exl || null,
    interlinePro: interlinePro || null,
  };

  // Get shipment history with token and query params
  const historyResponse = await getShipmentHistory(
    shippingCompanyName,
    bearerToken,
    queryParams
  );

  res.status(200).json({
    message: `Shipment history retrieved successfully for ${shippingCompanyName}`,
    shippingCompanyName,
    data: historyResponse,
  });
});

