import { downloadBOLPDF } from '../../services/Logistics/XPOBOLPDFService.js';
import { AuthenticationError, ValidationError, ErrorMessages, asyncHandler } from '../../utils/error.js';

/**
 * Handler for downloading BOL PDF
 * POST /api/v1/Logistics/download-bol-pdf
 * Body: { shippingCompanyName, pdfUri, token }
 */
export const downloadBOLPDFHandler = asyncHandler(async (req, res, next) => {
  const { shippingCompanyName, pdfUri, token } = req.body;

  // Validate required fields
  if (!shippingCompanyName) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('shippingCompanyName'));
  }

  if (!pdfUri) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD('pdfUri'));
  }

  if (!token) {
    throw new AuthenticationError(ErrorMessages.MISSING_TOKEN);
  }

  // Call XPO API and get response with shippingCompanyName added
  const response = await downloadBOLPDF(shippingCompanyName, token, pdfUri);

  // Return JSON response (same as XPO API response with shippingCompanyName added)
  res.status(response.code === '200' ? 200 : parseInt(response.code) || 500).json(response);
});

