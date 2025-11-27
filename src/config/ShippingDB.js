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
                    nmfc: null, // string
                    nmfcSub: null, // string
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
  {
    shippingCompanyName: estesCommon.shippingCompanyName,
    description: estesCommon.description,
    jsonb: {
      baseUrl: estesCommon.baseUrl,
      createPickupRequest: {
        url: `${estesCommon.baseUrl}/v1/pickup-request`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: estesCommon.apikey,
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        bodyTemplate: {
          shipper: {
            shipperName: null, // string
            accountCode: null, // string
            shipperAddress: {
              addressInfo: {
                addressLine1: null, // string
                addressLine2: null, // string
                city: null, // string
                stateProvince: null, // string
                postalCode: null, // string
                postalCode4: null, // string
                countryAbbrev: null, // string (e.g., "USA")
              },
            },
            shipperContacts: {
              shipperContact: [
                {
                  contactInfo: {
                    name: {
                      firstName: null, // string
                      middleName: null, // string
                      lastName: null, // string
                    },
                    email: null, // string
                    phone: {
                      areaCode: null, // number
                      number: null, // number
                      extension: null, // number
                    },
                    fax: {
                      areaCode: null, // number
                      number: null, // number
                    },
                    receiveNotifications: null, // string (e.g., "Y", "N")
                    notificationMethod: null, // string (e.g., "EMAIL")
                  },
                },
              ],
            },
          },
          requestAction: null, // string (e.g., "CREATE")
          paymentTerms: null, // string (e.g., "PREPAID")
          pickupDate: null, // string (YYYY-MM-DD)
          pickupStartTime: null, // string (HH:MM)
          pickupEndTime: null, // string (HH:MM)
          totalPieces: null, // string or number
          totalWeight: null, // string or number
          totalHandlingUnits: null, // string or number
          hazmatFlag: null, // string (e.g., "Y", "N")
          expeditedCode: null, // string
          whoRequested: null, // string (e.g., "THIRD_PARTY")
          trailer: null, // array
          referenceNumbers: {
            referenceNumber: [
              {
                referenceInfo: {
                  type: null, // string (e.g., "PRO", "PON", "BOL", "EUI", "LDN", "SNO")
                  value: null, // string
                  required: null, // string (e.g., "Y", "N")
                  totalPieces: null, // number
                  totalWeight: null, // number
                },
              },
            ],
          },
          commodities: {
            commodity: [
              {
                commodityInfo: {
                  code: null, // string
                  packageCode: null, // string (e.g., "PAT")
                  description: null, // string
                  hazmat: {
                    hazmatCode: null, // string
                    hazmatFlag: null, // string (e.g., "Y", "N")
                  },
                  pieces: null, // string or number
                  weight: null, // string or number
                  nmfcNumber: null, // string
                  nmfcSubNumber: null, // string
                },
              },
            ],
          },
          comments: {
            comment: [
              {
                commentInfo: {
                  type: null, // string (e.g., "PICKUP_INSTRUCTIONS")
                  commentText: null, // string
                },
              },
            ],
          },
          consignee: {
            accountCode: null, // string
            accountName: null, // string
          },
          thirdParty: {
            accountCode: null, // string
            accountName: null, // string
          },
          addresses: {
            address: [
              {
                addressInfo: {
                  addressType: null, // string (e.g., "PICKUP", "DOCK")
                  addressLine1: null, // string
                  addressLine2: null, // string
                  city: null, // string
                  stateProvince: null, // string
                  postalCode: null, // string
                  postalCode4: null, // string
                  countryAbbrev: null, // string (e.g., "USA")
                },
              },
            ],
          },
          contacts: {
            contact: [
              {
                contactInfo: {
                  contactType: null, // string (e.g., "REQUESTER", "DOCK")
                  name: {
                    firstName: null, // string
                    middleName: null, // string
                    lastName: null, // string
                  },
                  email: null, // string
                  phone: {
                    areaCode: null, // string or number
                    number: null, // string or number
                    extension: null, // string or number
                  },
                  fax: {
                    areaCode: null, // number
                    number: null, // number
                  },
                  receiveNotifications: null, // string (e.g., "Y", "N")
                  notificationMethod: null, // string (e.g., "EMAIL")
                },
              },
            ],
          },
          notifications: {
            notification: [
              {
                notificationInfo: {
                  type: null, // string (e.g., "REJECTED", "ACCEPTED", "COMPLETED")
                },
              },
            ],
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
      getShipmentHistory: {
        url: `${estesCommon.baseUrl}/v1/shipments/history`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: estesCommon.apikey,
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        queryParameters: {
          pro: null, // number (10 digits) - PRO tracking number
          po: null, // string (1-15 chars) - Purchase Order number
          bol: null, // string (1-25 chars) - Bill Of Lading number
          pur: null, // string (1-10 chars) - Pickup Request number
          ldn: null, // string (1-25 chars) - Load number
          exl: null, // string (1-25 chars) - EXLA-ID number
          interlinePro: null, // string (1-15 chars) - Interline PRO (From/To)
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
