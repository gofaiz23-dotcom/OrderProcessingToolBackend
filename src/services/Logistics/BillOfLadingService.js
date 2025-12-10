import { getEndpointConfig } from '../../config/ShippingDB.js';
import { NotFoundError, AppError, ValidationError, ErrorMessages } from '../../utils/error.js';

export const createBillOfLading = async (companyName, bearerToken, requestBody) => {
  console.log('createBillOfLading - Starting:', {
    companyName,
    hasBearerToken: !!bearerToken,
    bearerTokenLength: bearerToken?.length,
    requestBodyKeys: requestBody ? Object.keys(requestBody) : [],
    hasBol: !!requestBody?.bol,
  });
  
  try {
    // Get bill of lading endpoint configuration
    const bolConfig = getEndpointConfig(companyName, 'createBillOfLading');
    
    if (!bolConfig) {
      throw new NotFoundError(ErrorMessages.ENDPOINT_NOT_FOUND('createBillOfLading'));
    }

    if (!bolConfig.url) {
      throw new NotFoundError(ErrorMessages.CONFIG_MISSING(companyName));
    }

    // Normalize request body first (phone numbers need to be normalized before validation)
    const normalizedBody = normalizeRequestBody(requestBody);
    
    // Validate normalized request body (after normalization, phone numbers should be in correct format)
    try {
      validateRequestBody(normalizedBody, companyName);
    } catch (validationError) {
      console.error('BOL Validation Error:', validationError.message);
      throw validationError;
    }
    
    // Log normalized body for debugging (phone numbers should be normalized)
    console.log('BOL Request - Normalized Body (phone numbers normalized):', JSON.stringify(normalizedBody, null, 2).substring(0, 1000));
    
    // Merge bodyTemplate with user's request body
    let mergedBody;
    try {
      mergedBody = mergeBodyWithTemplate(bolConfig.bodyTemplate, normalizedBody);
    } catch (mergeError) {
      console.error('BOL Template Merge Error:', mergeError.message);
      throw new AppError(`Failed to merge request with template: ${mergeError.message}`, 500);
    }
    
    // Remove null and undefined values from the merged body (XPO API doesn't accept null values)
    const cleanedBody = removeNullValues(mergedBody);
    
    // Log the cleaned body for debugging
    console.log('XPO BOL Request - Cleaned Body:', JSON.stringify(cleanedBody, null, 2));
    console.log('XPO BOL Request - URL:', bolConfig.url);
    console.log('XPO BOL Request - Method:', bolConfig.method);

  // Prepare headers with Bearer token
  const headers = {
    ...bolConfig.headers,
    Authorization: `Bearer ${bearerToken}`,
  };

  // Get Content-Type from config (no hardcoding - always from ShippingDB.js)
  const contentType = headers['Content-Type'] || headers['content-type'];
  
  // Format body based on Content-Type from config (fully dynamic)
  let body;
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    // Convert to URL-encoded format
    body = new URLSearchParams();
    Object.entries(cleanedBody).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value.toString());
        }
      }
    });
    body = body.toString();
  } else {
    // Default to JSON (or use Content-Type from config)
    body = JSON.stringify(cleanedBody);
  }

  // Make API call to shipping company
  let response;
  try {
    response = await fetch(bolConfig.url, {
      method: bolConfig.method,
      headers,
      body,
    });
  } catch (fetchError) {
    // Handle network errors, connection errors, etc.
    console.error('XPO API Network Error:', {
      error: fetchError.message,
      url: bolConfig.url,
      method: bolConfig.method,
    });
    throw new AppError(
      `Failed to connect to XPO API: ${fetchError.message}`,
      503
    );
  }

  if (!response.ok) {
    let errorData = {};
    let errorText = '';
    
    // Try to get error response as text first (can only read once)
    try {
      errorText = await response.text();
      // Try to parse as JSON
      if (errorText && errorText.trim()) {
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          // If not JSON, use the text as error message
          errorData = { message: errorText, rawResponse: errorText };
        }
      } else {
        errorData = { message: response.statusText || 'Unknown error' };
      }
    } catch (textError) {
      // If we can't even get text, use status text
      console.error('Failed to read XPO error response:', textError);
      errorData = { message: response.statusText || 'Unknown error' };
      errorText = response.statusText || 'Unknown error';
    }
    
    // Log full error response for debugging (always log, even if empty)
    console.error('XPO API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      errorData: errorData,
      errorText: errorText,
      errorTextLength: errorText?.length || 0,
      requestBody: JSON.stringify(cleanedBody, null, 2).substring(0, 1000), // Log what we sent (truncated)
    });
    
    // Try to extract detailed error message from XPO response
    // XPO API might return errors in different formats
    let errorMessage = null;
    
    // First, try to extract moreInfo array from error object (XPO API specific - contains detailed error messages)
    if (errorData.error?.moreInfo && Array.isArray(errorData.error.moreInfo) && errorData.error.moreInfo.length > 0) {
      const moreInfoMessages = errorData.error.moreInfo.map(e => {
        if (typeof e === 'string') return e;
        return e.message || e.msg || e.field || e.error || JSON.stringify(e);
      }).filter(Boolean);
      if (moreInfoMessages.length > 0) {
        errorMessage = moreInfoMessages.join('; ');
      }
    }
    
    // Try to extract validation errors array (most detailed)
    if (!errorMessage && errorData.validationErrors && Array.isArray(errorData.validationErrors) && errorData.validationErrors.length > 0) {
      const validationMessages = errorData.validationErrors.map(e => {
        if (typeof e === 'string') return e;
        return e.message || e.field || e.error || JSON.stringify(e);
      }).filter(Boolean);
      if (validationMessages.length > 0) {
        errorMessage = `Validation errors: ${validationMessages.join('; ')}`;
      }
    }
    
    // Try errors array
    if (!errorMessage && errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      const errorMessages = errorData.errors.map(e => {
        if (typeof e === 'string') return e;
        return e.message || e.msg || e.field || e.error || JSON.stringify(e);
      }).filter(Boolean);
      if (errorMessages.length > 0) {
        errorMessage = `Errors: ${errorMessages.join('; ')}`;
      }
    }
    
    // Try other error message fields
    if (!errorMessage) {
      errorMessage = 
        errorData.message || 
        errorData.error?.message || 
        errorData.errorMessage ||
        errorData.error?.errorMessage ||
        errorData.detail ||
        errorData.error?.detail ||
        errorData.title ||
        errorData.type ||
        errorData.status ||
        errorData.fault?.faultstring ||
        errorData.fault?.detail ||
        (errorData.rawResponse && typeof errorData.rawResponse === 'string' && errorData.rawResponse.length < 500 ? errorData.rawResponse : null) ||
        (typeof errorData === 'string' && errorData.length < 500 ? errorData : null);
    }
    
    // If we still don't have a message, try the raw error text
    if (!errorMessage && errorText) {
      // Check if errorText is JSON that we couldn't parse
      if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.message || parsed.error || parsed.errorMessage || errorText.substring(0, 200);
        } catch {
          errorMessage = errorText.substring(0, 200);
        }
      } else {
        errorMessage = errorText.substring(0, 200);
      }
    }
    
    // If still no message, use the full errorData as JSON string (limited length)
    if (!errorMessage && Object.keys(errorData).length > 0) {
      const errorDataStr = JSON.stringify(errorData);
      errorMessage = errorDataStr.length < 500 ? errorDataStr : errorDataStr.substring(0, 500) + '...';
    }
    
    // Final fallback - use status-based message
    if (!errorMessage || errorMessage.trim() === '') {
      errorMessage = ErrorMessages.API_ERROR(response.status);
    }
    
    // If error message is too long, truncate it
    if (errorMessage && errorMessage.length > 500) {
      errorMessage = errorMessage.substring(0, 500) + '...';
    }
    
    // Ensure errorMessage is always a valid string
    if (typeof errorMessage !== 'string') {
      errorMessage = String(errorMessage) || ErrorMessages.API_ERROR(response.status);
    }
    
    // Log the final error message we're using
    console.error('XPO API Error - Final Error Message:', errorMessage);
    console.error('XPO API Error - Response Status:', response.status);
    console.error('XPO API Error - Full Error Data:', JSON.stringify(errorData, null, 2));
    
    // If we have validation errors, log them separately for clarity
    if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
      console.error('XPO API Error - Validation Errors:', JSON.stringify(errorData.validationErrors, null, 2));
    }
    if (errorData.errors && Array.isArray(errorData.errors)) {
      console.error('XPO API Error - Errors Array:', JSON.stringify(errorData.errors, null, 2));
    }
    
    throw new AppError(
      errorMessage,
      response.status
    );
  }

    // Parse successful response
    let data;
    try {
      const responseText = await response.text();
      if (!responseText) {
        throw new AppError('XPO API returned empty response', 500);
      }
      data = JSON.parse(responseText);
      console.log('XPO BOL Response - Success:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('XPO API Response Parse Error:', {
        error: parseError.message,
        status: response.status,
        stack: parseError.stack,
      });
      throw new AppError(
        `Failed to parse XPO API response: ${parseError.message}`,
        500
      );
    }
    
    return data;
  } catch (error) {
    // Catch any unhandled errors and log them properly
    console.error('Error in createBillOfLading:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode,
      companyName,
      hasRequestBody: !!requestBody,
    });
    
    // If it's already an AppError, re-throw it
    if (error instanceof AppError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    
    // Otherwise, wrap it in an AppError with detailed message
    // Provide a more user-friendly error message
    const errorMessage = error.message || 'Unknown error occurred';
    throw new AppError(
      `Failed to create bill of lading: ${errorMessage}. Please check your request data and try again.`,
      error.statusCode || 500
    );
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

// Helper function to remove null and undefined values from object
// XPO API rejects requests with null values for required fields
// Preserves empty strings for emergencyContactName and emergencyContactPhone
// Preserves empty arrays for additionalService
const removeNullValues = (obj) => {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    // Preserve empty arrays (especially for additionalService)
    const cleaned = obj.map(removeNullValues).filter(item => item !== undefined && item !== null);
    // Always return arrays (even if empty) - empty arrays are valid for additionalService
    return cleaned;
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      // Special handling for email objects - if emailAddr is null, remove the entire email object
      if (key === 'email' && typeof obj[key] === 'object' && obj[key] !== null) {
        if (obj[key].emailAddr === null || obj[key].emailAddr === undefined || obj[key].emailAddr === '') {
          // Skip this email object entirely if emailAddr is null/undefined/empty
          continue;
        }
      }
      
      // Special handling for phone objects - if phoneNbr is empty or invalid, remove the entire phone object
      // XPO requires phone numbers in NNN-NNNNNNN format, so empty/invalid phones should be removed
      // Note: This removal happens AFTER normalization, so normalized empty strings will be removed
      if (key === 'phone' && typeof obj[key] === 'object' && obj[key] !== null) {
        const phoneNbr = obj[key].phoneNbr;
        if (!phoneNbr || phoneNbr === '' || phoneNbr === '+1' || phoneNbr === '1' || 
            (typeof phoneNbr === 'string' && !phoneNbr.trim().match(/^\d{3}-\d{7}$/))) {
          // Skip this phone object entirely if phoneNbr is empty/invalid
          // Valid format must be NNN-NNNNNNN (3 digits, hyphen, 7 digits)
          continue;
        }
      }
      
      // Preserve empty strings for emergencyContactName
      if (key === 'emergencyContactName') {
        cleaned[key] = obj[key] === null || obj[key] === undefined ? '' : obj[key];
        continue;
      }
      
      // Preserve emergencyContactPhone structure (even if phoneNbr is empty)
      if (key === 'emergencyContactPhone' && typeof obj[key] === 'object' && obj[key] !== null) {
        cleaned[key] = {
          phoneNbr: obj[key].phoneNbr === null || obj[key].phoneNbr === undefined ? '' : obj[key].phoneNbr
        };
        continue;
      }
      
      // Preserve empty arrays for additionalService
      if (key === 'additionalService' && Array.isArray(obj[key])) {
        cleaned[key] = obj[key]; // Keep as-is (even if empty)
        continue;
      }
      
      // Special handling for pickupInfo - only include if it has meaningful data
      if (key === 'pickupInfo' && typeof obj[key] === 'object' && obj[key] !== null) {
        const pickupInfo = obj[key];
        const hasPickupDate = pickupInfo.pkupDate && pickupInfo.pkupDate !== '';
        const hasPickupTime = pickupInfo.pkupTime && pickupInfo.pkupTime !== '';
        const hasDockCloseTime = pickupInfo.dockCloseTime && pickupInfo.dockCloseTime !== '';
        const hasContact = pickupInfo.contact && 
          (pickupInfo.contact.companyName || pickupInfo.contact.fullName || 
           (pickupInfo.contact.phone && pickupInfo.contact.phone.phoneNbr));
        
        // Only include pickupInfo if at least one meaningful field exists
        if (hasPickupDate || hasPickupTime || hasDockCloseTime || hasContact) {
          const cleanedPickupInfo = removeNullValues(pickupInfo);
          if (cleanedPickupInfo && typeof cleanedPickupInfo === 'object' && Object.keys(cleanedPickupInfo).length > 0) {
            cleaned[key] = cleanedPickupInfo;
          }
        }
        continue;
      }
      
      // Special handling for declaredValueAmt - only include if amt is not null/undefined
      if (key === 'declaredValueAmt' && typeof obj[key] === 'object' && obj[key] !== null) {
        if (obj[key].amt !== null && obj[key].amt !== undefined) {
          const cleanedValue = removeNullValues(obj[key]);
          if (cleanedValue && typeof cleanedValue === 'object' && Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue;
          }
        }
        continue;
      }
      
      // Special handling for declaredValueAmtPerLb - only include if amt is not null/undefined
      if (key === 'declaredValueAmtPerLb' && typeof obj[key] === 'object' && obj[key] !== null) {
        if (obj[key].amt !== null && obj[key].amt !== undefined) {
          const cleanedValue = removeNullValues(obj[key]);
          if (cleanedValue && typeof cleanedValue === 'object' && Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue;
          }
        }
        continue;
      }
      
      // Special handling for excessLiabilityChargeInit - only include if it's not null/undefined/empty
      if (key === 'excessLiabilityChargeInit') {
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
          cleaned[key] = obj[key];
        }
        continue;
      }
      
      const value = removeNullValues(obj[key]);
      // Only include the key if the value is not undefined/null
      if (value !== undefined && value !== null) {
        // Special handling for objects that become empty after cleaning (but allow arrays)
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
          continue;
        }
        cleaned[key] = value;
      } else if (typeof obj[key] === 'string' && obj[key] === '') {
        // Preserve empty strings for other fields
        cleaned[key] = '';
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  
  return obj;
};

// Helper function to validate request body structure
const validateRequestBody = (requestBody, companyName) => {
  if (!requestBody || typeof requestBody !== 'object') {
    throw new ValidationError('Request body must be a valid object');
  }

  // Validate BOL structure
  if (!requestBody.bol || typeof requestBody.bol !== 'object') {
    throw new ValidationError('Request body must contain a "bol" object');
  }

  const bol = requestBody.bol;

  // Company-specific validation
  const normalizedCompanyName = companyName?.toLowerCase();
  
  if (normalizedCompanyName === 'estes') {
    // Estes API validation
    // Validate requester (Estes uses requestorRole)
    if (!bol.requestorRole) {
      throw new ValidationError('BOL must contain requestorRole');
    }
    
    // Estes uses origin/destination structure, not consignee/shipper
    // Skip XPO-specific validation for Estes
    return; // Early return for Estes - different structure
  } else {
    // XPO API validation (default)
    // Validate requester (XPO uses requester.role)
    if (!bol.requester || !bol.requester.role) {
      throw new ValidationError('BOL must contain requester with role');
    }

    // Validate consignee
    if (!bol.consignee) {
      throw new ValidationError('BOL must contain consignee information');
    }
    if (!bol.consignee.address || !bol.consignee.address.addressLine1 || !bol.consignee.address.cityName || 
        !bol.consignee.address.stateCd || !bol.consignee.address.postalCd) {
      throw new ValidationError('Consignee must have complete address (addressLine1, cityName, stateCd, postalCd)');
    }
    if (!bol.consignee.contactInfo || !bol.consignee.contactInfo.companyName) {
      throw new ValidationError('Consignee must have contactInfo with companyName');
    }
    // Validate consignee phone number (XPO requires phone number in NNN-NNNNNNN format)
    if (!bol.consignee.contactInfo.phone || !bol.consignee.contactInfo.phone.phoneNbr) {
      throw new ValidationError('Consignee must have a phone number');
    }
    const consigneePhoneNbr = bol.consignee.contactInfo.phone.phoneNbr.trim();
    // Check if phone number is empty or just placeholder
    if (!consigneePhoneNbr || consigneePhoneNbr === '+1' || consigneePhoneNbr === '1') {
      throw new ValidationError('Consignee must have a valid phone number');
    }
    // Validate format: NNN-NNNNNNN (3 digits, hyphen, 7 digits)
    if (!consigneePhoneNbr.match(/^\d{3}-\d{7}$/)) {
      throw new ValidationError('Consignee phone number format should be NNN-NNNNNNN (area code and phone number, respectively)');
    }

    // Validate shipper
    if (!bol.shipper) {
      throw new ValidationError('BOL must contain shipper information');
    }
    if (!bol.shipper.address || !bol.shipper.address.addressLine1 || !bol.shipper.address.cityName || 
        !bol.shipper.address.stateCd || !bol.shipper.address.postalCd) {
      throw new ValidationError('Shipper must have complete address (addressLine1, cityName, stateCd, postalCd)');
    }
    if (!bol.shipper.contactInfo || !bol.shipper.contactInfo.companyName) {
      throw new ValidationError('Shipper must have contactInfo with companyName');
    }
    // Validate shipper phone number (XPO requires phone number in NNN-NNNNNNN format)
    if (!bol.shipper.contactInfo.phone || !bol.shipper.contactInfo.phone.phoneNbr) {
      throw new ValidationError('Shipper must have a phone number');
    }
    const shipperPhoneNbr = bol.shipper.contactInfo.phone.phoneNbr.trim();
    // Check if phone number is empty or just placeholder
    if (!shipperPhoneNbr || shipperPhoneNbr === '+1' || shipperPhoneNbr === '1') {
      throw new ValidationError('Shipper must have a valid phone number');
    }
    // Validate format: NNN-NNNNNNN (3 digits, hyphen, 7 digits)
    if (!shipperPhoneNbr.match(/^\d{3}-\d{7}$/)) {
      throw new ValidationError('Shipper phone number format should be NNN-NNNNNNN (area code and phone number, respectively)');
    }

    // Validate billToCust
    if (!bol.billToCust) {
      throw new ValidationError('BOL must contain billToCust information');
    }
    if (!bol.billToCust.address || !bol.billToCust.address.addressLine1 || !bol.billToCust.address.cityName || 
        !bol.billToCust.address.stateCd || !bol.billToCust.address.postalCd) {
      throw new ValidationError('BillToCust must have complete address (addressLine1, cityName, stateCd, postalCd)');
    }
    if (!bol.billToCust.contactInfo || !bol.billToCust.contactInfo.companyName) {
      throw new ValidationError('BillToCust must have contactInfo with companyName');
    }
    // Validate billToCust phone number format (XPO requires NNN-NNNNNNN format)
    if (bol.billToCust.contactInfo.phone && bol.billToCust.contactInfo.phone.phoneNbr) {
      const phoneNbr = bol.billToCust.contactInfo.phone.phoneNbr.trim();
      if (phoneNbr && !phoneNbr.match(/^\d{3}-\d{7}$/)) {
        throw new ValidationError('Bill to customer phone number format should be NNN-NNNNNNN (area code and phone number, respectively)');
      }
    }

    // Validate commodityLine
    if (!bol.commodityLine || !Array.isArray(bol.commodityLine) || bol.commodityLine.length === 0) {
      throw new ValidationError('BOL must contain at least one commodity in commodityLine array');
    }

    // Validate each commodity
    bol.commodityLine.forEach((commodity, index) => {
      if (!commodity.pieceCnt || commodity.pieceCnt < 1) {
        throw new ValidationError(`Commodity at index ${index} must have pieceCnt >= 1`);
      }
      if (!commodity.packaging || !commodity.packaging.packageCd) {
        throw new ValidationError(`Commodity at index ${index} must have packaging with packageCd`);
      }
      if (!commodity.grossWeight || typeof commodity.grossWeight.weight !== 'number' || commodity.grossWeight.weight <= 0) {
        throw new ValidationError(`Commodity at index ${index} must have grossWeight with weight > 0`);
      }
      if (!commodity.desc || typeof commodity.desc !== 'string' || commodity.desc.trim().length === 0) {
        throw new ValidationError(`Commodity at index ${index} must have a non-empty description`);
      }
    });

    // Validate chargeToCd
    if (!bol.chargeToCd || typeof bol.chargeToCd !== 'string') {
      throw new ValidationError('BOL must have chargeToCd (e.g., "P" for Prepaid, "C" for Collect)');
    }
  }
};

// Helper function to normalize and validate request body
const normalizeRequestBody = (requestBody) => {
  if (!requestBody || typeof requestBody !== 'object') {
    throw new ValidationError('Request body must be a valid object');
  }

  // Deep clone to avoid mutating original
  const normalized = JSON.parse(JSON.stringify(requestBody));

  // Normalize phone numbers to accept US formats like "626-7150682", "(626) 715-0682", "+1-626-715-0682", etc.
  // Target format: "XXX-XXXXXXX" (area code, hyphen, 7 digits) - matches working payload format
  // Removes spaces and parentheses, keeps hyphens, handles country code
  const normalizePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') return phone;
    
    // Trim whitespace
    let normalized = phone.trim();
    
    // If empty after trim, return empty string
    if (!normalized) return '';
    
    // If it's just "+1" (the default placeholder), return empty string
    // XPO requires actual phone numbers, not placeholders
    if (normalized === '+1' || normalized === '1') {
      return '';
    }
    
    // Handle US country code (+1 or 1 prefix) FIRST, before removing spaces/parentheses
    // This handles formats like "+1 (626) 715-0682", "+1-626-715-0682", "1-626-715-0682", etc.
    
    // Check for +1 at the start - remove +1 and any following whitespace, hyphens, or parentheses
    // Pattern: +1 followed by optional whitespace/punctuation
    if (normalized.match(/^\+1/)) {
      // Remove +1 and any following whitespace, hyphens, or parentheses (one or more)
      normalized = normalized.replace(/^\+1[\s\-\(\)]*/, '');
    } 
    // Check for leading 1- (only if followed by hyphen and it's an 11+ digit number)
    else if (normalized.match(/^1[-]/) && normalized.replace(/[^\d]/g, '').length >= 11) {
      normalized = normalized.replace(/^1[-]/, '');
    }
    // Check for leading 1 without hyphen (only if it's exactly 11 digits total after removing non-digits)
    else if (normalized.replace(/[^\d]/g, '').match(/^1\d{10}$/)) {
      // Remove leading 1 and any following whitespace/punctuation
      normalized = normalized.replace(/^1[\s\-\(\)]*/, '');
    }
    
    // Now remove spaces and parentheses (after handling +1 prefix)
    normalized = normalized.replace(/[\s\(\)]/g, '');
    
    // Remove any remaining non-digit, non-hyphen characters (like dots, slashes, etc.)
    normalized = normalized.replace(/[^\d\-]/g, '');
    
    // Extract digits only to check length
    const digitsOnly = normalized.replace(/[^\d]/g, '');
    
    // If we don't have exactly 10 digits, return empty string (invalid phone number)
    if (digitsOnly.length !== 10) {
      return '';
    }
    
    // XPO requires format: NNN-NNNNNNN (3 digits, hyphen, 7 digits)
    // Always format to this exact format regardless of input format
    // Remove all hyphens first, then format as NNN-NNNNNNN
    const digits = digitsOnly;
    normalized = `${digits.substring(0, 3)}-${digits.substring(3)}`;
    
    // Return the normalized phone number in XPO format: NNN-NNNNNNN
    // Examples:
    // "+1 (626) 715-0682" → "626-7150682"
    // "+1-626-715-0682" → "626-7150682"
    // "626-715-0682" → "626-7150682"
    // "626-7150682" → "626-7150682"
    // "6267150682" → "626-7150682"
    // "+1" → "" (empty - invalid)
    return normalized;
  };

  // Normalize contact info recursively
  const normalizeContactInfo = (contactInfo) => {
    if (!contactInfo || typeof contactInfo !== 'object') return contactInfo;
    
    if (contactInfo.phone && contactInfo.phone.phoneNbr) {
      try {
        contactInfo.phone.phoneNbr = normalizePhoneNumber(contactInfo.phone.phoneNbr);
      } catch (normalizeError) {
        // If normalization fails, log but keep original phone number
        console.warn('Phone number normalization failed, keeping original:', {
          phone: contactInfo.phone.phoneNbr,
          error: normalizeError.message
        });
        // Keep original phone number if normalization fails
      }
    }
    
    // Trim email addresses
    if (contactInfo.email && contactInfo.email.emailAddr) {
      contactInfo.email.emailAddr = contactInfo.email.emailAddr.trim();
    }
    
    // Trim company name
    if (contactInfo.companyName) {
      contactInfo.companyName = contactInfo.companyName.trim();
    }
    
    return contactInfo;
  };

  // Normalize address fields
  const normalizeAddress = (address) => {
    if (!address || typeof address !== 'object') return address;
    
    // Trim all string fields in address
    Object.keys(address).forEach(key => {
      if (typeof address[key] === 'string') {
        address[key] = address[key].trim();
      }
    });
    
    return address;
  };

  // Normalize BOL structure
  if (normalized.bol) {
    // Normalize consignee
    if (normalized.bol.consignee) {
      if (normalized.bol.consignee.address) {
        normalized.bol.consignee.address = normalizeAddress(normalized.bol.consignee.address);
      }
      if (normalized.bol.consignee.contactInfo) {
        normalized.bol.consignee.contactInfo = normalizeContactInfo(normalized.bol.consignee.contactInfo);
      }
    }

    // Normalize shipper
    if (normalized.bol.shipper) {
      if (normalized.bol.shipper.address) {
        normalized.bol.shipper.address = normalizeAddress(normalized.bol.shipper.address);
      }
      if (normalized.bol.shipper.contactInfo) {
        normalized.bol.shipper.contactInfo = normalizeContactInfo(normalized.bol.shipper.contactInfo);
      }
    }

    // Normalize billToCust
    if (normalized.bol.billToCust) {
      if (normalized.bol.billToCust.address) {
        normalized.bol.billToCust.address = normalizeAddress(normalized.bol.billToCust.address);
      }
      if (normalized.bol.billToCust.contactInfo) {
        normalized.bol.billToCust.contactInfo = normalizeContactInfo(normalized.bol.billToCust.contactInfo);
      }
    }

    // Normalize commodity descriptions
    if (normalized.bol.commodityLine && Array.isArray(normalized.bol.commodityLine)) {
      normalized.bol.commodityLine = normalized.bol.commodityLine.map(commodity => {
        if (commodity.desc && typeof commodity.desc === 'string') {
          commodity.desc = commodity.desc.trim();
        }
        return commodity;
      });
    }

    // Normalize additional services
    // XPO API expects array of objects (BolAdditionalService), not strings
    // Error: "Cannot construct instance of BolAdditionalService: no String-argument constructor/factory method to deserialize from String value ('LIFT_GATE')"
    // Working payload uses empty array [], so convert string arrays to empty array
    if (normalized.bol.additionalService && Array.isArray(normalized.bol.additionalService)) {
      // Check if array contains strings (invalid format for XPO)
      const hasStrings = normalized.bol.additionalService.some(item => typeof item === 'string');
      if (hasStrings) {
        // XPO API cannot deserialize strings - must be objects or empty array
        // Based on working payload, empty array is the safe option until we know the object structure
        console.warn('XPO BOL: additionalService contains strings, converting to empty array. XPO expects objects, not strings.');
        normalized.bol.additionalService = [];
      }
      // If already objects or empty, keep as-is (no need to trim objects)
    }

    // Normalize emergency contact phone number
    if (normalized.bol.emergencyContactPhone && normalized.bol.emergencyContactPhone.phoneNbr) {
      try {
        normalized.bol.emergencyContactPhone.phoneNbr = normalizePhoneNumber(normalized.bol.emergencyContactPhone.phoneNbr);
      } catch (normalizeError) {
        // If normalization fails, log but keep original phone number
        console.warn('Emergency contact phone normalization failed, keeping original:', {
          phone: normalized.bol.emergencyContactPhone.phoneNbr,
          error: normalizeError.message
        });
      }
    }

    // Trim emergency contact name
    if (normalized.bol.emergencyContactName && typeof normalized.bol.emergencyContactName === 'string') {
      normalized.bol.emergencyContactName = normalized.bol.emergencyContactName.trim();
    }
  }

  return normalized;
};

