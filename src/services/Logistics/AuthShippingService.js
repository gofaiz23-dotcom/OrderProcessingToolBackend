import { getEndpointConfig } from '../../config/ShippingDB.js';

export const authenticateShippingCompany = async (companyName, username, password) => {
  try {
    // Get auth endpoint configuration
    const authConfig = getEndpointConfig(companyName, 'auth');
    
    if (!authConfig) {
      throw new Error(`Shipping company "${companyName}" or auth endpoint not found`);
    }

    if (!authConfig.url) {
      throw new Error(`Configuration missing for shipping company "${companyName}"`);
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
      throw new Error(
        errorData.message || `Authentication failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Shipping authentication error:', error);
    throw error;
  }
};

