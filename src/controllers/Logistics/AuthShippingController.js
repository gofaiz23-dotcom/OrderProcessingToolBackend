import { authenticateShippingCompany } from '../../services/Logistics/AuthShippingService.js';
import { getEndpointConfig } from '../../config/ShippingDB.js';

export const authShippingCompany = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username) {
      return res.status(400).json({
        message: 'Field "username" is required.',
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Field "password" is required.',
      });
    }

    // Get shipping company config using helper function
    const authConfig = getEndpointConfig('estes', 'auth');
    if (!authConfig) {
      return res.status(500).json({
        message: 'No shipping companies configured.',
      });
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
  } catch (error) {
    console.error('Error authenticating shipping company:', error);
    next({
      status: error.status || 500,
      message: error.message || 'Internal server error',
    });
  }
};

