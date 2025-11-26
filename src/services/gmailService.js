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

const fetchMessageDetails = async (messages = []) => {
  if (!messages.length) return [];

  const detailPromises = messages.map(async ({ id }) => {
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

    return {
      id: data.id,
      threadId: data.threadId,
      snippet: data.snippet,
      internalDate: data.internalDate,
      headers,
      textBody,
      htmlBody,
      attachments,
    };
  });

  return Promise.all(detailPromises);
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

