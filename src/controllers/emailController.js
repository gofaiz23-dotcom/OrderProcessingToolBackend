import { getInboxMessages, getSentMessages, sendGmailMessage } from '../services/gmailService.js';
import { getLatestRefreshToken } from '../services/googleAuthTokenService.js';

const parseLimit = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return undefined;
  return Math.min(Math.max(number, 1), 100);
};

const checkRefreshToken = async () => {
  const refreshToken = await getLatestRefreshToken();
  if (!refreshToken) {
    throw {
      status: 401,
      message: 'Refresh token not available. Please generate a refresh token by authorizing with Google.',
    };
  }
  return refreshToken;
};

const handleGmailError = (error) => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorResponse = error.response?.data || {};
  const errorDetails = JSON.stringify(errorResponse).toLowerCase();
  
  // Check for expired token indicators
  const isExpiredToken = 
    error.code === 401 ||
    error.status === 401 ||
    errorMessage.includes('invalid_grant') ||
    errorMessage.includes('token_expired') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid_token') ||
    errorMessage.includes('invalid credentials') ||
    errorMessage.includes('unauthorized') ||
    errorDetails.includes('invalid_grant') ||
    errorDetails.includes('token_expired') ||
    errorDetails.includes('expired') ||
    errorResponse.error === 'invalid_grant' ||
    errorResponse.error_description?.toLowerCase().includes('expired') ||
    errorResponse.error_description?.toLowerCase().includes('invalid_grant');

  // Check for missing token (already handled by checkRefreshToken, but catch API errors too)
  const isMissingToken = 
    error.code === 403 ||
    error.status === 403 ||
    errorMessage.includes('no credentials') ||
    errorMessage.includes('no refresh token');

  if (isExpiredToken) {
    return {
      status: 401,
      message: 'Refresh token has expired. Please generate a new refresh token by authorizing with Google.',
    };
  }

  if (isMissingToken) {
    return {
      status: 401,
      message: 'Refresh token not available. Please generate a refresh token by authorizing with Google.',
    };
  }

  // Return the original error if it has status, otherwise wrap it
  if (error.status) {
    return error;
  }
  
  return {
    status: error.status || 500,
    message: error.message || 'Internal server error',
  };
};

export const getInbox = async (req, res, next) => {
  try {
    await checkRefreshToken();
    const limit = parseLimit(req.query.limit);
    const messages = await getInboxMessages(limit);
    res.json({ count: messages.length, messages });
  } catch (error) {
    const handledError = handleGmailError(error);
    next(handledError);
  }
};

export const getSent = async (req, res, next) => {
  try {
    await checkRefreshToken();
    const limit = parseLimit(req.query.limit);
    const messages = await getSentMessages(limit);
    res.json({ count: messages.length, messages });
  } catch (error) {
    const handledError = handleGmailError(error);
    next(handledError);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    await checkRefreshToken();
    const { to, cc, bcc, subject, text, html } = req.body;

    if (!to || !subject || !(text || html)) {
      return res.status(400).json({
        message: 'Fields "to", "subject", and either "text" or "html" are required.',
      });
    }

    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      mimeType: file.mimetype,
      contentBase64: file.buffer.toString('base64'),
    }));

    const response = await sendGmailMessage({ to, cc, bcc, subject, text, html, attachments });

    res.status(201).json({
      message: 'Email sent successfully',
      id: response.data.id,
      threadId: response.data.threadId,
    });
  } catch (error) {
    const handledError = handleGmailError(error);
    next(handledError);
  }
};

