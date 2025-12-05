# Logistics API Documentation

## Base URL
```
http://localhost:3000/api/v1/Logistics
```
*Replace `localhost:3000` with your actual server URL*

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Rate Quote](#2-rate-quote)
3. [Bill of Lading](#3-bill-of-lading)
4. [Pickup Request](#4-pickup-request)
5. [Shipment History](#5-shipment-history)
6. [Shipment Status Update](#6-shipment-status-update)
7. [Shipped Orders Management](#7-shipped-orders-management)

---

## 1. Authentication

### POST `/api/v1/Logistics/Authenticate`

Authenticate with a shipping company to obtain access token.

**Full URL:** `POST http://localhost:3000/api/v1/Logistics/Authenticate`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "shippingCompany": "estes",
  "username": "your_username",
  "password": "your_password"
}
```

**Example for XPO:**
```json
{
  "shippingCompany": "xpo",
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "message": "Authentication successful for estes",
  "shippingCompanyName": "estes",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Supported Companies:** `estes`, `xpo`

---

## 2. Rate Quote

### POST `/api/v1/Logistics/create-rate-quote`

Create a rate quote for shipping.

**Full URL:** `POST http://localhost:3000/api/v1/Logistics/create-rate-quote`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body (Estes):**
```json
{
  "shippingCompany": "estes",
  "quoteRequest": {
    "shipDate": "2025-12-05",
    "shipTime": "12:00",
    "serviceLevels": ["LTL", "LTLTC"],
    "origin": {
      "address": {
        "city": "New York",
        "stateProvince": "NY",
        "postalCode": "10001",
        "country": "USA"
      }
    },
    "destination": {
      "address": {
        "city": "Los Angeles",
        "stateProvince": "CA",
        "postalCode": "90210",
        "country": "USA"
      }
    }
  },
  "payment": {
    "account": "123456",
    "payor": "Shipper",
    "terms": "Prepaid"
  },
  "commodity": {
    "handlingUnits": [
      {
        "count": 1,
        "type": "BX",
        "weight": 500,
        "weightUnit": "Pounds",
        "length": 40,
        "width": 40,
        "height": 40,
        "dimensionsUnit": "Inches",
        "isStackable": true,
        "isTurnable": false
      }
    ]
  }
}
```

**Request Body (XPO):**
```json
{
  "shippingCompany": "xpo",
  "shipmentInfo": {
    "paymentTermCd": "P",
    "shipmentDate": "2025-12-05T12:00:00.000Z",
    "accessorials": [],
    "shipper": {
      "address": {
        "postalCd": "10001"
      }
    },
    "consignee": {
      "address": {
        "postalCd": "90210"
      }
    },
    "commodity": [
      {
        "pieceCnt": 1,
        "packageCode": "BOX",
        "grossWeight": {
          "weight": 500,
          "weightUom": "LBS"
        },
        "nmfcClass": "85",
        "hazmatInd": false,
        "dimensions": {
          "length": 40,
          "width": 40,
          "height": 40,
          "dimensionsUom": "INCH"
        }
      }
    ],
    "palletCnt": 0,
    "linealFt": 0
  }
}
```

**Response:**
```json
{
  "message": "Rate quote created successfully for estes",
  "shippingCompanyName": "estes",
  "data": {
    "quoteId": "RQ123456",
    "totalCost": 1250.50,
    "currency": "USD"
  }
}
```

---

## 3. Bill of Lading

### POST `/api/v1/Logistics/create-bill-of-lading`

Create a bill of lading for shipment.

**Full URL:** `POST http://localhost:3000/api/v1/Logistics/create-bill-of-lading`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body (Estes):**
```json
{
  "shippingCompany": "estes",
  "version": "v2.0.1",
  "bol": {
    "function": "Create",
    "isTest": false,
    "requestorRole": "Third Party",
    "requestedPickupDate": "2025-12-15T00:00:00.000",
    "specialInstructions": "Handle with care"
  },
  "payment": {
    "terms": "Prepaid"
  },
  "origin": {
    "account": "123456",
    "name": "Shipper Company",
    "address1": "123 Main St",
    "city": "New York",
    "stateProvince": "NY",
    "postalCode": "10001",
    "country": "USA",
    "contact": {
      "name": "John Doe",
      "phone": "555-1234",
      "email": "john@example.com"
    }
  },
  "destination": {
    "name": "Consignee Company",
    "address1": "456 Oak Ave",
    "city": "Los Angeles",
    "stateProvince": "CA",
    "postalCode": "90210",
    "country": "USA",
    "contact": {
      "phone": "555-5678",
      "email": "contact@example.com"
    }
  },
  "commodities": {
    "handlingUnits": [
      {
        "count": 1,
        "type": "PAT",
        "weight": 500,
        "weightUnit": "Pounds",
        "length": 40,
        "width": 40,
        "height": 40,
        "dimensionsUnit": "Inches",
        "stackable": true,
        "lineItems": [
          {
            "description": "Furniture",
            "weight": 500,
            "pieces": 1,
            "packagingType": "CTN",
            "classification": "250",
            "nmfc": "079300",
            "nmfcSub": "03",
            "hazardous": false
          }
        ]
      }
    ]
  }
}
```

**Request Body (XPO):**
```json
{
  "shippingCompany": "xpo",
  "bol": {
    "requester": {
      "role": "S"
    },
    "consignee": {
      "address": {
        "addressLine1": "2125 Exchange Drive",
        "cityName": "Arlington",
        "stateCd": "TX",
        "countryCd": "US",
        "postalCd": "76011"
      },
      "contactInfo": {
        "companyName": "John Company",
        "email": {
          "emailAddr": "contact@example.com"
        },
        "phone": {
          "phoneNbr": "123-4567890"
        }
      }
    },
    "shipper": {
      "address": {
        "addressLine1": "10506 SHOEMAKER AVE",
        "cityName": "SANTA FE SPRINGS",
        "stateCd": "CA",
        "countryCd": "US",
        "postalCd": "90670"
      },
      "contactInfo": {
        "companyName": "Shipper Company",
        "email": {
          "emailAddr": "shipper@example.com"
        },
        "phone": {
          "phoneNbr": "123-4567890"
        }
      }
    },
    "billToCust": {
      "address": {
        "addressLine1": "10506 SHOEMAKER AVE",
        "cityName": "SANTA FE SPRINGS",
        "stateCd": "CA",
        "countryCd": "US",
        "postalCd": "90670"
      },
      "contactInfo": {
        "companyName": "Shipper Company",
        "email": {
          "emailAddr": "shipper@example.com"
        },
        "phone": {
          "phoneNbr": "123-4567890"
        }
      }
    },
    "commodityLine": [
      {
        "pieceCnt": 1,
        "packaging": {
          "packageCd": "PLT"
        },
        "grossWeight": {
          "weight": 350
        },
        "desc": "Furniture items",
        "nmfcClass": "250",
        "nmfcItemCd": "079300",
        "sub": "03",
        "hazmatInd": false
      }
    ],
    "chargeToCd": "P",
    "pickupInfo": {
      "pkupDate": "2025-12-15T12:00:00-08:00",
      "pkupTime": "2025-12-15T12:00:00-08:00",
      "dockCloseTime": "2025-12-15T13:00:00-08:00",
      "contact": {
        "companyName": "Shipper Company",
        "fullName": "John Doe",
        "phone": {
          "phoneNbr": "123-4567890"
        }
      }
    }
  },
  "autoAssignPro": true
}
```

**Response:**
```json
{
  "message": "Bill of Lading created successfully for estes",
  "shippingCompanyName": "estes",
  "data": {
    "bolNumber": "BOL123456",
    "proNumber": "PRO789012",
    "status": "created"
  }
}
```

---

## 4. Pickup Request

### POST `/api/v1/Logistics/create-pickup-request`

Create a pickup request for shipment.

**Full URL:** `POST http://localhost:3000/api/v1/Logistics/create-pickup-request`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body (Estes):**
```json
{
  "shippingCompany": "estes",
  "shipper": {
    "shipperName": "Shipper Company",
    "accountCode": "123456",
    "shipperAddress": {
      "addressInfo": {
        "addressLine1": "123 Main St",
        "city": "New York",
        "stateProvince": "NY",
        "postalCode": "10001",
        "countryAbbrev": "USA"
      }
    },
    "shipperContacts": {
      "shipperContact": [
        {
          "contactInfo": {
            "name": {
              "firstName": "John",
              "lastName": "Doe"
            },
            "email": "john@example.com",
            "phone": {
              "areaCode": 555,
              "number": 1234567
            }
          }
        }
      ]
    }
  },
  "requestAction": "CREATE",
  "paymentTerms": "PREPAID",
  "pickupDate": "2025-12-17",
  "pickupStartTime": "09:00",
  "pickupEndTime": "17:00",
  "totalPieces": 10,
  "totalWeight": 5000,
  "totalHandlingUnits": 5
}
```

**Request Body (XPO):**
```json
{
  "shippingCompany": "xpo",
  "pickupRqstInfo": {
    "pkupDate": "2016-12-17T00:00:00",
    "readyTime": "2016-12-17T14:00:00",
    "closeTime": "2016-12-17T17:00:00",
    "specialEquipmentCd": "F",
    "insidePkupInd": true,
    "shipper": {
      "name": "Shipper Company",
      "addressLine1": "1234 NW Somewhere St",
      "addressLine2": "Apt 301",
      "cityName": "Portland",
      "stateCd": "OR",
      "countryCd": "US",
      "postalCd": "97209"
    },
    "requestor": {
      "contact": {
        "companyName": "Shipper Company",
        "email": {
          "emailAddr": "contact@example.com"
        },
        "fullName": "John Doe",
        "phone": {
          "phoneNbr": "503-5551212"
        }
      },
      "roleCd": "S"
    },
    "contact": {
      "companyName": "Shipper Company",
      "email": {
        "emailAddr": "contact@example.com"
      },
      "fullName": "John Doe",
      "phone": {
        "phoneNbr": "503-5551212"
      }
    },
    "remarks": "Handle with care",
    "pkupItem": [
      {
        "destZip6": "55122",
        "totWeight": {
          "weight": 500
        },
        "loosePiecesCnt": 0,
        "palletCnt": 4,
        "garntInd": false,
        "hazmatInd": false,
        "frzbleInd": false,
        "holDlvrInd": false,
        "foodInd": false,
        "remarks": "Fragile items"
      }
    ]
  }
}
```

**Response:**
```json
{
  "message": "Pickup request created successfully for estes",
  "shippingCompanyName": "estes",
  "data": {
    "pickupRequestNumber": "PUR123456",
    "status": "scheduled",
    "pickupDate": "2025-12-17"
  }
}
```

---

## 5. Shipment History

### GET `/api/v1/Logistics/shipment-history`

Get shipment history/tracking information.

**Full URL:** `GET http://localhost:3000/api/v1/Logistics/shipment-history`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters (Estes):**
- `shippingCompany` (required) - Company name: `estes` or `xpo`
- `pro` (optional) - PRO tracking number (10 digits)
- `po` (optional) - Purchase Order number (1-15 chars)
- `bol` (optional) - Bill Of Lading number (1-25 chars)
- `pur` (optional) - Pickup Request number (1-10 chars)
- `ldn` (optional) - Load number (1-25 chars)
- `exl` (optional) - EXLA-ID number (1-25 chars)
- `interlinePro` (optional) - Interline PRO (1-15 chars)

**Query Parameters (XPO):**
- `shippingCompany` (required) - Company name: `estes` or `xpo`
- `referenceNumbers` (required) - Reference number (e.g., "439-581122")

**Example URLs:**

**Estes:**
```
GET http://localhost:3000/api/v1/Logistics/shipment-history?shippingCompany=estes&pro=1234567890
GET http://localhost:3000/api/v1/Logistics/shipment-history?shippingCompany=estes&bol=ABC123
```

**XPO:**
```
GET http://localhost:3000/api/v1/Logistics/shipment-history?shippingCompany=xpo&referenceNumbers=439-581122
```

**Alternative (using `company` parameter):**
```
GET http://localhost:3000/api/v1/Logistics/shipment-history?company=estes&pro=1234567890
```

**Response:**
```json
{
  "message": "Shipment history retrieved successfully for estes",
  "shippingCompanyName": "estes",
  "data": {
    "shipments": [
      {
        "proNumber": "1234567890",
        "status": "in_transit",
        "currentLocation": "Chicago, IL",
        "estimatedDelivery": "2025-12-20"
      }
    ]
  }
}
```

---

## 6. Shipment Status Update

### PUT `/api/v1/Logistics/shipment-status`

Update shipment status for one or multiple orders.

**Full URL:** `PUT http://localhost:3000/api/v1/Logistics/shipment-status`

**Headers:**
```
Content-Type: application/json
```

**Request Body (Format 1 - Single Status for Single/Multiple IDs):**
```json
{
  "ids": 1,
  "status": "delivered"
}
```

**Or for multiple IDs:**
```json
{
  "ids": [1, 2, 3],
  "status": "delivered"
}
```

**Request Body (Format 2 - Multiple IDs with Different Statuses):**
```json
{
  "updates": [
    {
      "id": 1,
      "status": "delivered"
    },
    {
      "id": 2,
      "status": "in_transit"
    },
    {
      "id": 3,
      "status": "pending"
    }
  ]
}
```

**Response (Format 1):**
```json
{
  "message": "Status updated successfully for 3 order(s)",
  "count": 3,
  "ids": [1, 2, 3],
  "status": "delivered"
}
```

**Response (Format 2):**
```json
{
  "message": "Status updated successfully for 3 order(s)",
  "count": 3,
  "updates": [
    { "id": 1, "status": "delivered" },
    { "id": 2, "status": "in_transit" },
    { "id": 3, "status": "pending" }
  ]
}
```

---

## 7. Shipped Orders Management

### 7.1 Create Shipped Order

#### POST `/api/v1/Logistics/shipped-orders`

Create a new logistics shipped order.

**Full URL:** `POST http://localhost:3000/api/v1/Logistics/shipped-orders`

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `sku` (required) - SKU identifier
- `orderOnMarketPlace` (required) - Order identifier
- `ordersJsonb` (optional) - JSON object or string
- `rateQuotesResponseJsonb` (optional) - JSON object or string
- `bolResponseJsonb` (optional) - JSON object or string
- `pickupResponseJsonb` (optional) - JSON object or string
- `files` (optional) - Array of files (max 10 files, 50MB each)

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/Logistics/shipped-orders \
  -F "sku=SKU123" \
  -F "orderOnMarketPlace=ORDER456" \
  -F "ordersJsonb={\"key\":\"value\"}" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf"
```

**Response:**
```json
{
  "message": "Logistics shipped order created successfully",
  "data": {
    "id": 1,
    "sku": "SKU123",
    "orderOnMarketPlace": "ORDER456",
    "status": "pending",
    "uploads": ["/uploads/file1.pdf", "/uploads/file2.pdf"],
    "createdAt": "2025-12-15T10:00:00.000Z"
  }
}
```

---

### 7.2 Get All Shipped Orders

#### GET `/api/v1/Logistics/shipped-orders`

Get all shipped orders with pagination, filtering, and sorting.

**Full URL:** `GET http://localhost:3000/api/v1/Logistics/shipped-orders`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)
- `sku` (optional) - Filter by SKU (partial match, case-insensitive)
- `orderOnMarketPlace` (optional) - Filter by order ID (partial match, case-insensitive)
- `status` (optional) - Filter by status (exact match, case-insensitive)
- `sortBy` (optional) - Sort field: `id`, `createdAt`, `updatedAt` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Example URLs:**
```
GET http://localhost:3000/api/v1/Logistics/shipped-orders?page=1&limit=20
GET http://localhost:3000/api/v1/Logistics/shipped-orders?status=pending&sortBy=createdAt&sortOrder=asc
GET http://localhost:3000/api/v1/Logistics/shipped-orders?sku=SKU123
```

**Response:**
```json
{
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "sku": "SKU123",
        "orderOnMarketPlace": "ORDER456",
        "status": "pending",
        "uploads": [],
        "createdAt": "2025-12-15T10:00:00.000Z",
        "updatedAt": "2025-12-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 7.3 Get Shipped Order by ID

#### GET `/api/v1/Logistics/shipped-orders/:id`

Get a specific shipped order by ID.

**Full URL:** `GET http://localhost:3000/api/v1/Logistics/shipped-orders/1`

**Path Parameters:**
- `id` (required) - Order ID

**Response:**
```json
{
  "message": "Order retrieved successfully",
  "data": {
    "id": 1,
    "sku": "SKU123",
    "orderOnMarketPlace": "ORDER456",
    "status": "pending",
    "uploads": ["/uploads/file1.pdf"],
    "ordersJsonb": {},
    "rateQuotesResponseJsonb": {},
    "bolResponseJsonb": {},
    "pickupResponseJsonb": {},
    "createdAt": "2025-12-15T10:00:00.000Z",
    "updatedAt": "2025-12-15T10:00:00.000Z"
  }
}
```

---

### 7.4 Update Shipped Order

#### PUT `/api/v1/Logistics/shipped-orders/:id`

Update an existing shipped order.

**Full URL:** `PUT http://localhost:3000/api/v1/Logistics/shipped-orders/1`

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `sku` (optional) - SKU identifier
- `orderOnMarketPlace` (optional) - Order identifier
- `status` (optional) - Order status
- `ordersJsonb` (optional) - JSON object or string
- `rateQuotesResponseJsonb` (optional) - JSON object or string
- `bolResponseJsonb` (optional) - JSON object or string
- `pickupResponseJsonb` (optional) - JSON object or string
- `files` (optional) - Array of files (max 10 files, 50MB each)

**Response:**
```json
{
  "message": "Order updated successfully",
  "data": {
    "id": 1,
    "sku": "SKU123",
    "status": "delivered",
    "updatedAt": "2025-12-15T11:00:00.000Z"
  }
}
```

---

### 7.5 Delete Shipped Order by ID

#### DELETE `/api/v1/Logistics/shipped-orders/:id`

Delete a specific shipped order by ID.

**Full URL:** `DELETE http://localhost:3000/api/v1/Logistics/shipped-orders/1`

**Path Parameters:**
- `id` (required) - Order ID

**Response:**
```json
{
  "message": "Order deleted successfully",
  "data": {
    "id": 1
  }
}
```

---

### 7.6 Delete Shipped Orders by Date Range

#### DELETE `/api/v1/Logistics/shipped-orders`

Delete multiple shipped orders within a date range.

**Full URL:** `DELETE http://localhost:3000/api/v1/Logistics/shipped-orders`

**Query Parameters:**
- `startDate` (required) - Start date in format: `YYYY-MM-DD`
- `endDate` (required) - End date in format: `YYYY-MM-DD`

**Example URL:**
```
DELETE http://localhost:3000/api/v1/Logistics/shipped-orders?startDate=2025-01-01&endDate=2025-12-31
```

**Response:**
```json
{
  "message": "Orders deleted successfully",
  "count": 25,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

---

### 7.7 Get All Orders JSONB

#### GET `/api/v1/Logistics/orders-jsonb`

Get all orders' JSONB data only (without other fields) with pagination, filtering, and sorting.

**Full URL:** `GET http://localhost:3000/api/v1/Logistics/orders-jsonb`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)
- `sku` (optional) - Filter by SKU (partial match, case-insensitive)
- `orderOnMarketPlace` (optional) - Filter by order ID (partial match, case-insensitive)
- `status` (optional) - Filter by status (exact match, case-insensitive)
- `sortBy` (optional) - Sort field: `id`, `createdAt`, `updatedAt` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "message": "Orders JSONB retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "ordersJsonb": {
          "key": "value",
          "orderDetails": {}
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

---

### 7.8 Get Order JSONB by ID

#### GET `/api/v1/Logistics/orders-jsonb/:id`

Get a specific order's JSONB data by ID.

**Full URL:** `GET http://localhost:3000/api/v1/Logistics/orders-jsonb/1`

**Path Parameters:**
- `id` (required) - Order ID

**Response:**
```json
{
  "message": "Order JSONB retrieved successfully",
  "data": {
    "id": 1,
    "ordersJsonb": {
      "key": "value",
      "orderDetails": {}
    }
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "ValidationError",
  "message": "shippingCompany field is required"
}
```

**401 Unauthorized:**
```json
{
  "error": "AuthenticationError",
  "message": "Missing or invalid authorization token"
}
```

**404 Not Found:**
```json
{
  "error": "NotFoundError",
  "message": "The requested endpoint \"createRateQuote for company: fedex\" is not available"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Notes

1. **Shipping Company Parameter:** All endpoints (except shipped orders management) require a `shippingCompany` parameter in the request body (POST) or query string (GET). Supported values: `estes`, `xpo`

2. **Authentication:** Most endpoints require a Bearer token in the Authorization header. Obtain the token using the `/Authenticate` endpoint first.

3. **File Uploads:** The shipped orders endpoints support file uploads via `multipart/form-data`. Maximum 10 files, 50MB each.

4. **Pagination:** List endpoints support pagination with `page` and `limit` query parameters.

5. **Filtering:** List endpoints support filtering by `sku`, `orderOnMarketPlace`, and `status`.

6. **Sorting:** List endpoints support sorting by `id`, `createdAt`, or `updatedAt` with `asc` or `desc` order.

---

## Support

For issues or questions, please contact the development team.

