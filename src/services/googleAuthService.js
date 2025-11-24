import { googleAuthClient } from '../config/googleClient.js';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

export const buildGoogleAuthUrl = () =>
  googleAuthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: GMAIL_SCOPES,
  });

export const exchangeCodeForTokens = async (code) => {
  const { tokens } = await googleAuthClient.getToken(code);

  if (tokens.refresh_token) {
    googleAuthClient.setCredentials({ refresh_token: tokens.refresh_token });
  }

  return tokens;
};


