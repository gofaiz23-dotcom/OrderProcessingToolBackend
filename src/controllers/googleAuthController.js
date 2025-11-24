import { buildGoogleAuthUrl, exchangeCodeForTokens } from '../services/googleAuthService.js';

export const getGoogleAuthUrl = (req, res, next) => {
  try {
    const url = buildGoogleAuthUrl();
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

export const handleGoogleAuthCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code' });
    }

    const tokens = await exchangeCodeForTokens(code);

    res.json({
      message: 'Authorization successful. Save the refresh_token securely.',
      tokens,
    });
  } catch (error) {
    next(error);
  }
};


