import dotenv from 'dotenv';

dotenv.config();

// Common configuration for Estes
const estesCommon = {
  shippingCompanyName: 'estes',
  description: 'Estes Express Lines',
  baseUrl: process.env.ESTES_BASE_URL || '',
  apikey: process.env.ESTES_API_KEY || '',
};

// Shipping Companies Configuration (Database Structure)
export const estes = [
  {
    shippingCompanyName: estesCommon.shippingCompanyName,
    description: estesCommon.description,
    jsonb: {
      baseUrl: estesCommon.baseUrl,
      auth: {
        url: `${estesCommon.baseUrl}/authenticate`,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: estesCommon.apikey,
        },
        bodyTemplate: {
          username: null, // string
          password: null, // string
        },
      },
    },
  },
  {
    shippingCompanyName: estesCommon.shippingCompanyName,
    description: estesCommon.description,
    jsonb: {
      baseUrl: estesCommon.baseUrl,
      createRateQuote: {
        url: `${estesCommon.baseUrl}/v1/rate-quotes`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: estesCommon.apikey,
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        bodyTemplate: {
          quoteRequest: {
            shipDate: null, // string (YYYY-MM-DD)
            shipTime: null, // string (HH:MM)
            serviceLevels: null, // array of strings (e.g., ["LTL", "LTLTC"])
            origin: {
              address: {
                city: null, // string
                stateProvince: null, // string
                postalCode: null, // string
                country: null, // string
              },
            },
            destination: {
              address: {
                city: null, // string
                stateProvince: null, // string
                postalCode: null, // string
                country: null, // string
              },
            },
          },
          payment: {
            account: null, // string
            payor: null, // string (e.g., "Shipper", "Consignee", "Third Party")
            terms: null, // string (e.g., "Prepaid")
          },
          requestor: {
            name: null, // string
            phone: null, // string
            email: null, // string
          },
          commodity: {
            handlingUnits: [
              {
                count: null, // number
                type: null, // string (e.g., "BX")
                weight: null, // number
                weightUnit: null, // string (e.g., "Pounds")
                length: null, // number
                width: null, // number
                height: null, // number
                dimensionsUnit: null, // string (e.g., "Inches")
                isStackable: null, // boolean
                isTurnable: null, // boolean
                lineItems: [
                  {
                    description: null, // string
                    weight: null, // number
                    pieces: null, // number
                    packagingType: null, // string
                    classification: null, // string
                    isHazardous: null, // boolean
                  },
                ],
              },
            ],
          },
          accessorials: {
            codes: null, // array of strings (e.g., ["LGATE", "HD"])
          },
        },
      },
    },
  },
  {
    shippingCompanyName: estesCommon.shippingCompanyName,
    description: estesCommon.description,
    jsonb: {
      baseUrl: estesCommon.baseUrl,
      createBillOfLading: {
        url: `${estesCommon.baseUrl}/v1/bol`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: estesCommon.apikey,
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        bodyTemplate: {
          version: null, // string (e.g., "v2.0.1")
          bol: {
            function: null, // string (e.g., "Create")
            isTest: null, // boolean
            requestorRole: null, // string (e.g., "Third Party")
            requestedPickupDate: null, // string (ISO 8601 format, e.g., "2025-11-27T00:00:00.000")
            specialInstructions: null, // string
          },
          payment: {
            terms: null, // string (e.g., "Prepaid")
          },
          origin: {
            account: null, // string
            name: null, // string
            address1: null, // string
            city: null, // string
            stateProvince: null, // string
            postalCode: null, // string
            country: null, // string (e.g., "USA")
            contact: {
              name: null, // string
              phone: null, // string
              email: null, // string
            },
          },
          destination: {
            name: null, // string
            address1: null, // string
            city: null, // string
            stateProvince: null, // string
            postalCode: null, // string
            country: null, // string (e.g., "USA")
            contact: {
              phone: null, // string
              email: null, // string
            },
          },
          billTo: {
            account: null, // string
            name: null, // string
            address1: null, // string
            city: null, // string
            stateProvince: null, // string
            postalCode: null, // string
            country: null, // string (e.g., "USA")
            contact: {
              name: null, // string
              phone: null, // string
              email: null, // string
            },
          },
          referenceNumbers: {
            masterBol: null, // string
            quoteID: null, // string
          },
          commodities: {
            lineItemLayout: null, // string (e.g., "Nested")
            handlingUnits: [
              {
                count: null, // number
                type: null, // string (e.g., "PAT")
                weight: null, // number
                weightUnit: null, // string (e.g., "Pounds")
                length: null, // number
                width: null, // number
                height: null, // number
                dimensionsUnit: null, // string (e.g., "Inches")
                stackable: null, // boolean
                lineItems: [
                  {
                    description: null, // string
                    weight: null, // number
                    weightUnit: null, // string (e.g., "Pounds")
                    pieces: null, // number
                    packagingType: null, // string (e.g., "CTN")
                    classification: null, // string
                    nmfc: null, // string
                    nmfcSub: null, // string
                    hazardous: null, // boolean
                  },
                ],
              },
            ],
          },
          accessorials: {
            codes: null, // array of strings (e.g., ["LFTD", "RES", "PREACC"])
          },
          images: {
            includeBol: null, // boolean
            includeShippingLabels: null, // boolean
            shippingLabels: {
              format: null, // string (e.g., "Zebra")
              quantity: null, // number
              position: null, // number
            },
            email: {
              includeBol: null, // boolean
              includeLabels: null, // boolean
              addresses: null, // array of strings
            },
          },
          notifications: [
            {
              email: null, // string
            },
          ],
        },
      },
    },
  },
];

// Helper function to get endpoint config by company name and endpoint name
export const getEndpointConfig = (companyName, endpointName) => {
  const config = estes.find(
    (item) =>
      item.shippingCompanyName.toLowerCase() === companyName.toLowerCase() &&
      item.jsonb[endpointName]
  );
  if (!config) {
    return null;
  }
  return {
    ...config.jsonb[endpointName],
    baseUrl: config.jsonb.baseUrl,
    shippingCompanyName: config.shippingCompanyName,
    description: config.description,
  };
};
