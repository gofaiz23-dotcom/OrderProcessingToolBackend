import { getEndpointConfig } from '../../config/ShippingDB.js';

export const createRateQuote = async (companyName, bearerToken, requestBody) => {
  try {
    // Get rate quote endpoint configuration
    const rateQuoteConfig = getEndpointConfig(companyName, 'createRateQuote');
    
    if (!rateQuoteConfig) {
      throw new Error(`Shipping company "${companyName}" or createRateQuote endpoint not found`);
    }

    if (!rateQuoteConfig.url) {
      throw new Error(`Configuration missing for shipping company "${companyName}"`);
    }

    // Merge bodyTemplate with user's request body
    const mergedBody = mergeBodyWithTemplate(rateQuoteConfig.bodyTemplate, requestBody);

    // Prepare headers with Bearer token
    const headers = {
      ...rateQuoteConfig.headers,
      Authorization: `Bearer ${bearerToken}`,
    };

    // Make API call to shipping company
    const response = await fetch(rateQuoteConfig.url, {
      method: rateQuoteConfig.method,
      headers,
      body: JSON.stringify(mergedBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Rate quote creation failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Rate quote creation error:', error);
    throw error;
  }
};

// Helper function to merge user body with template
const mergeBodyWithTemplate = (template, userBody) => {
  const merged = JSON.parse(JSON.stringify(template)); // Deep clone

  const mergeRecursive = (templateObj, userObj) => {
    for (const key in userObj) {
      if (userObj[key] !== null && userObj[key] !== undefined) {
        if (
          typeof userObj[key] === 'object' &&
          !Array.isArray(userObj[key]) &&
          templateObj[key] &&
          typeof templateObj[key] === 'object' &&
          !Array.isArray(templateObj[key])
        ) {
          mergeRecursive(templateObj[key], userObj[key]);
        } else {
          templateObj[key] = userObj[key];
        }
      }
    }
  };

  mergeRecursive(merged, userBody);
  return merged;
};

