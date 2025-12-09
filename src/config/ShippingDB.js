import dotenv from 'dotenv';

dotenv.config();

// Common configuration for Estes
const estesCommon = {
  shippingCompanyName: 'estes',
  description: 'Estes Express Lines',
  baseUrl: process.env.ESTES_BASE_URL || '',
  apikey: process.env.ESTES_API_KEY || '',
};

// Common configuration for XPO
const xpoCommon = {
  shippingCompanyName: 'xpo',
  description: 'XPO Logistics',
  baseUrl: process.env.XPO_BASE_URL || '',
  apikey: process.env.XPO_API_KEY || '',
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

// XPO Shipping Company Configuration
export const xpo = [
  {
    shippingCompanyName: xpoCommon.shippingCompanyName,
    description: xpoCommon.description,
    jsonb: {
      baseUrl: xpoCommon.baseUrl,
      auth: {
        url: `${xpoCommon.baseUrl}/token`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${xpoCommon.apikey}`, // Basic Auth with API key
        },
        bodyTemplate: {
          grant_type: 'password', // Fixed value: password
          username: null, // string - provided by user
          password: null, // string - provided by user
        },
        // Note: Body will be sent as form-urlencoded, not JSON
        // Service layer should convert bodyTemplate to URLSearchParams format
      },
    },
  },
  {
    shippingCompanyName: xpoCommon.shippingCompanyName,
    description: xpoCommon.description,
    jsonb: {
      baseUrl: xpoCommon.baseUrl,
      createRateQuote: {
        url: `${xpoCommon.baseUrl}/rating/1.0/ratequotes`,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        bodyTemplate: {
          shipmentInfo: {
            accessorials: [
              {
                accessorialCd: null, // string (e.g., "DLG")
                accessorialDesc: null, // string (e.g., "DLG DEST LIFTGATE SERVICE")
                accessorialType: null, // string (e.g., "Destination")
              },
              {
                accessorialCd: null, // string (e.g., "RSD")
                accessorialDesc: null, // string (e.g., "RSD DEST RESIDENTIAL DELIVERY")
                accessorialType: null, // string (e.g., "Destination")
              },
              {
                accessorialCd: null, // string (e.g., "DNC")
                accessorialDesc: null, // string (e.g., "DNC DEST NOTIFICATION")
                accessorialType: null, // string (e.g., "Destination")
              },
            ],
            commodity: [
              {
                pieceCnt: null, // number
                packageCode: null, // string (e.g., "PLT")
                grossWeight: {
                  weight: null, // number
                  weightUom: null, // string (e.g., "lbs")
                },
                desc: null, // string (e.g., "KD furniture")
                nmfcClass: null, // string (e.g., "250")
                nmfcItemCd: null, // string (e.g., "079300")
                hazmatInd: null, // boolean
                dimensions: {
                  length: null, // number
                  width: null, // number
                  height: null, // number
                  dimensionsUom: null, // string (e.g., "INCH")
                },
              },
            ],
            freezableInd: null, // boolean
            hazmatInd: null, // boolean
            paymentTermCd: null, // string (e.g., "P")
            shipmentDate: null, // string (ISO 8601 format, e.g., "2025-12-08T17:00:00.000Z")
            shipper: {
              acctInstId: null, // string (e.g., "531230")
              // accountCode: null, // string (e.g., "AMQKGULA002")
              // accountClass: null, // string (e.g., "M")
              // address: {
              //   streetAddress1: null, // string (e.g., "10506 SHOEMAKER AVE")
              //   streetAddress2: null, // string
              //   city: null, // string (e.g., "SANTA FE SPRINGS")
              //   stateProvinceCd: null, // string (e.g., "CA")
              //   postalCd: null, // string (e.g., "90670")
              //   countryCd: null, // string (e.g., "US")
              // }
            },
            consignee: {
              address: {
                postalCd: null, // string (e.g., "08505")
                countryCd: null, // string (e.g., "US")
              },
            },
            bill2Party: {
              address: {
                usZip4: null, // string
              },
            },
            palletCnt: null, // number
            linealFt: null, // number
          },
        },
      },
    },
  },
  {
    shippingCompanyName: xpoCommon.shippingCompanyName,
    description: xpoCommon.description,
    jsonb: {
      baseUrl: xpoCommon.baseUrl,
      createBillOfLading: {
        url: `${xpoCommon.baseUrl}/billoflading/1.0/billsoflading`,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        bodyTemplate: {
          bol: {
            requester: {
              role: null, // string (e.g., "S")
            },
            consignee: {
              address: {
                addressLine1: null, // string
                cityName: null, // string
                stateCd: null, // string
                countryCd: null, // string (e.g., "US")
                postalCd: null, // string
              },
              contactInfo: {
                companyName: null, // string
                email: {
                  emailAddr: null, // string
                },
                phone: {
                  phoneNbr: null, // string
                },
              },
            },
            shipper: {
              address: {
                addressLine1: null, // string
                cityName: null, // string
                stateCd: null, // string
                countryCd: null, // string (e.g., "US")
                postalCd: null, // string
              },
              contactInfo: {
                companyName: null, // string
                email: {
                  emailAddr: null, // string
                },
                phone: {
                  phoneNbr: null, // string
                },
              },
            },
            billToCust: {
              address: {
                addressLine1: null, // string
                cityName: null, // string
                stateCd: null, // string
                countryCd: null, // string (e.g., "US")
                postalCd: null, // string
              },
              contactInfo: {
                companyName: null, // string
                email: {
                  emailAddr: null, // string
                },
                phone: {
                  phoneNbr: null, // string
                },
              },
            },
            commodityLine: [
              {
                pieceCnt: null, // number
                packaging: {
                  packageCd: null, // string (e.g., "PLT")
                },
                grossWeight: {
                  weight: null, // number
                },
                desc: null, // string
                hazmatInd: null, // boolean
                nmfcClass: null, // string (e.g., "125")
                nmfcItemCd: null, // string (e.g., "079300")
                sub: null, // string (e.g., "03")
              },
            ],
            remarks: null, // string
            emergencyContactName: null, // string
            emergencyContactPhone: {
              phoneNbr: null, // string
            },
            chargeToCd: null, // string (e.g., "P")
            additionalService: [], // array
            suppRef: {
              otherRefs: [
                {
                  referenceTypeCd: null, // string (e.g., "Other")
                  reference: null, // string
                  referenceCode: null, // string (e.g., "RQ#")
                  referenceDescr: null, // string
                },
              ],
            },
          },
          autoAssignPro: null, // boolean
        },
      },
    },
  },
  {
    shippingCompanyName: xpoCommon.shippingCompanyName,
    description: xpoCommon.description,
    jsonb: {
      baseUrl: xpoCommon.baseUrl,
      createPickupRequest: {
        url: `${xpoCommon.baseUrl}/pickuprequest/1.0/cust-pickup-requests`,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        bodyTemplate: {
          pickupRqstInfo: {
            pkupDate: null, // string (ISO 8601 format, e.g., "2016-12-17T00:00:00")
            readyTime: null, // string (ISO 8601 format, e.g., "2016-12-17T14:00:00")
            closeTime: null, // string (ISO 8601 format, e.g., "2016-12-17T17:00:00")
            specialEquipmentCd: null, // string (e.g., "F")
            insidePkupInd: null, // boolean
            shipper: {
              name: null, // string
              addressLine1: null, // string
              addressLine2: null, // string
              cityName: null, // string
              stateCd: null, // string
              countryCd: null, // string (e.g., "US")
              postalCd: null, // string
            },
            requestor: {
              contact: {
                companyName: null, // string
                email: {
                  emailAddr: null, // string
                },
                fullName: null, // string
                phone: {
                  phoneNbr: null, // string
                },
              },
              roleCd: null, // string (e.g., "S")
            },
            contact: {
              companyName: null, // string
              email: {
                emailAddr: null, // string
              },
              fullName: null, // string
              phone: {
                phoneNbr: null, // string
              },
            },
            remarks: null, // string
            pkupItem: [
              {
                destZip6: null, // string (e.g., "55122")
                totWeight: {
                  weight: null, // number
                },
                loosePiecesCnt: null, // number
                palletCnt: null, // number
                garntInd: null, // boolean
                hazmatInd: null, // boolean
                frzbleInd: null, // boolean
                holDlvrInd: null, // boolean
                foodInd: null, // boolean
                remarks: null, // string
              },
            ],
          },
        },
      },
    },
  },
  {
    shippingCompanyName: xpoCommon.shippingCompanyName,
    description: xpoCommon.description,
    jsonb: {
      baseUrl: xpoCommon.baseUrl,
      getShipmentHistory: {
        url: `${xpoCommon.baseUrl}/tracking/1.0/shipments/shipment-status-details`,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ', // Will be replaced with user's token
        },
        queryParameters: {
          referenceNumbers: null, // string (e.g., "439-581122")
        },
      },
    },
  },
];

// Combine all shipping companies into a single array for dynamic lookup
// Add new companies here - they will automatically be available in all routes
const allShippingCompanies = [
  ...estes,
  ...xpo,
  // Add more companies here as needed:
  // ...fedex,
  // ...ups,
];

// Helper function to get endpoint config by company name and endpoint name
// This function automatically searches ALL configured shipping companies
export const getEndpointConfig = (companyName, endpointName) => {
  const config = allShippingCompanies.find(
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
