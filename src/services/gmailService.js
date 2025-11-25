import { gmail, googleUserEmail } from '../config/googleClient.js';

const DEFAULT_MAX_RESULTS = 20;
const HEADER_WHITELIST = ['From', 'To', 'Subject', 'Date'];

const decodeBase64Url = (data) =>
  Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

const extractMessageContent = async (messageId, payload) => {
  if (!payload) {
    return { textBody: null, htmlBody: null, attachments: [] };
  }

  const partsQueue = [payload];
  let textBody = null;
  let htmlBody = null;
  const attachmentPromises = [];

  while (partsQueue.length) {
    const part = partsQueue.shift();
    if (!part) continue;

    if (part.parts?.length) {
      partsQueue.push(...part.parts);
    }

    const mimeType = part.mimeType ?? '';
    const body = part.body ?? {};
    const hasAttachment = Boolean(part.filename) && (body.attachmentId || body.data);

    if (mimeType.startsWith('text/plain') && body.data && !textBody) {
      textBody = decodeBase64Url(body.data);
    }

    if (mimeType.startsWith('text/html') && body.data && !htmlBody) {
      htmlBody = decodeBase64Url(body.data);
    }

    if (hasAttachment) {
      attachmentPromises.push(
        body.attachmentId
          ? gmail.users.messages.attachments
              .get({ userId: 'me', messageId, id: body.attachmentId })
              .then(({ data }) => ({
                filename: part.filename,
                mimeType,
                size: data.size || body.size,
                contentBase64: data.data,
              }))
          : Promise.resolve({
              filename: part.filename,
              mimeType,
              size: body.size,
              contentBase64: body.data,
            }),
      );
    }
  }

  const attachments = attachmentPromises.length ? await Promise.all(attachmentPromises) : [];
  return { textBody, htmlBody, attachments };
};

// Helper function to add delay between API calls to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchMessageDetails = async (messages = []) => {
  if (!messages.length) return [];

  const results = [];
  
  // Process messages sequentially with delay to avoid rate limiting
  // Gmail API allows 250 quota units per 100 seconds, each messages.get = 5 units
  // So max 50 requests per 100 seconds = 1 request per 2 seconds minimum
  for (let i = 0; i < messages.length; i++) {
    const { id } = messages[i];
    
    // Add delay between requests (except for the first one)
    // 2 seconds delay = safe rate (50 requests per 100 seconds)
    if (i > 0) {
      await delay(2000); // 2 seconds between requests
    }
    
    try {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      });

      const headers =
        data.payload?.headers?.reduce((acc, header) => {
          if (HEADER_WHITELIST.includes(header.name)) {
            acc[header.name] = header.value;
          }
          return acc;
        }, {}) ?? {};

      const { textBody, htmlBody, attachments } = await extractMessageContent(id, data.payload);

      results.push({
        id: data.id,
        threadId: data.threadId,
        snippet: data.snippet,
        internalDate: data.internalDate,
        headers,
        textBody,
        htmlBody,
        attachments,
      });
    } catch (error) {
      // If rate limited, wait longer and retry
      if (error.code === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 15;
        console.warn(`Rate limited. Waiting ${retryAfter} seconds before retry...`);
        await delay(retryAfter * 1000);
        // Retry this message
        i--;
        continue;
      }
      // For other errors, skip this message and continue
      console.error(`Error fetching message ${id}:`, error.message);
    }
  }

  return results;
};

const listMessages = async ({ labelIds, maxResults }) => {
  const response = await gmail.users.messages.list({
    userId: 'me',
    labelIds,
    maxResults: maxResults || DEFAULT_MAX_RESULTS,
  });

  const messages = response.data.messages ?? [];
  return fetchMessageDetails(messages);
};

export const getInboxMessages = async (maxResults) =>
  listMessages({ labelIds: ['INBOX'], maxResults });

export const getSentMessages = async (maxResults) =>
  listMessages({ labelIds: ['SENT'], maxResults });

const buildEmailBody = ({ to, subject, text, html, attachments }) => {
  const boundary = `mixed-${Date.now()}`;
  const lines = [
    'MIME-Version: 1.0',
    `To: ${to}`,
    `From: ${googleUserEmail}`,
    `Subject: ${subject}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
  ];

  // If both text and html exist, wrap them in multipart/alternative
  if (text && html) {
    const alternativeBoundary = `alt-${Date.now()}`;
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`);
    lines.push('');
    // Add text/plain part
    lines.push(`--${alternativeBoundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(text);
    lines.push('');
    // Add text/html part
    lines.push(`--${alternativeBoundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(html);
    lines.push('');
    lines.push(`--${alternativeBoundary}--`);
  } else if (html) {
    // Only HTML
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(html);
    lines.push('');
  } else if (text) {
    // Only text
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(text);
    lines.push('');
  }

  // Add attachments
  (attachments || []).forEach((file) => {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${file.mimeType}`);
    lines.push('Content-Transfer-Encoding: base64');
    lines.push(`Content-Disposition: attachment; filename="${file.filename}"`);
    lines.push('');
    lines.push(file.contentBase64);
    lines.push('');
  });

  lines.push(`--${boundary}--`);

  return Buffer.from(lines.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sendGmailMessage = async ({ to, subject, text, html, attachments }) => {
  const raw = buildEmailBody({ to, subject, text, html, attachments });

  return gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
};

