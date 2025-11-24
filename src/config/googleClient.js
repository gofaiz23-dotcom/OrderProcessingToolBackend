import { google } from 'googleapis';
import { config } from './env.js';
import { getLatestRefreshToken } from '../services/googleAuthTokenService.js';

const { clientId, clientSecret, redirectUri, userEmail } = config.google;

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const storedToken = await getLatestRefreshToken();
if (storedToken) {
  oAuth2Client.setCredentials({ refresh_token: storedToken });
}

export const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

export const googleAuthClient = oAuth2Client;

export const googleUserEmail = userEmail;

