import { getWalmartToken } from '../../services/Walmart/walmartTokenService.js';
import { asyncHandler } from '../../utils/error.js';

/**
 * GET /api/v1/walmart/token
 * Get Walmart OAuth token
 */
export const getToken = asyncHandler(async (req, res) => {
  const tokenData = await getWalmartToken();

  res.status(200).json({
    success: true,
    message: 'Walmart token retrieved successfully',
    data: tokenData,
  });
});

