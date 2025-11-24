import { google } from 'googleapis';
import { config } from './env.js';

const { clientId, clientSecret, redirectUri, refreshToken, userEmail } = config.google;

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

if (refreshToken) {
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
}

export const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

export const googleAuthClient = oAuth2Client;

export const googleUserEmail = userEmail;

