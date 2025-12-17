import { gmail, googleUserEmail } from '../config/googleClient.js';

const DEFAULT_MAX_RESULTS = 20;
const HEADER_WHITELIST = ['From', 'To', 'Subject', 'Date', 'Cc', 'Bcc'];

/** Gmail-like limits */
const MAX_ATTACHMENTS = 50;
const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

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
                size: data.size || body.size || 0,
                contentBase64: data.data,
              }))
          : Promise.resolve({
              filename: part.filename,
              mimeType,
              size: body.size || 0,
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

/**
 * Validate attachments like Gmail
 */
const validateAttachments = (attachments = []) => {
  if (attachments.length > MAX_ATTACHMENTS) {
    throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
  }

  const totalSize = attachments.reduce(
    (sum, file) => sum + (file.size || 0),
    0,
  );

  if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
    throw new Error(
      `Total attachment size exceeds 25MB (Current: ${(totalSize / 1024 / 1024).toFixed(
        2,
      )} MB)`,
    );
  }
};

const buildEmailBody = ({ to, cc, bcc, subject, text, html, attachments }) => {
  validateAttachments(attachments);

  const boundary = `mixed-${Date.now()}`;
  const lines = [
    'MIME-Version: 1.0',
    `To: ${to}`,
    `From: ${googleUserEmail}`,
    `Subject: ${subject}`,
  ];

  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);

  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push('');

  if (text && html) {
    const alternativeBoundary = `alt-${Date.now()}`;
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`);
    lines.push('');

    lines.push(`--${alternativeBoundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('');
    lines.push(text);
    lines.push('');

    lines.push(`--${alternativeBoundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('');
    lines.push(html);
    lines.push('');

    lines.push(`--${alternativeBoundary}--`);
  } else if (html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('');
    lines.push(html);
    lines.push('');
  } else if (text) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('');
    lines.push(text);
    lines.push('');
  }

  // Separate inline images (referenced in HTML with cid:) from regular attachments
  const inlineImages = new Map();
  const regularAttachments = [];
  
  if (html) {
    // Extract all cid: references from HTML
    const cidMatches = html.match(/cid:([^\s"'>]+)/gi) || [];
    const cidFiles = new Set();
    cidMatches.forEach(match => {
      const filename = match.replace(/^cid:/i, '').trim();
      if (filename) {
        cidFiles.add(filename.toLowerCase());
      }
    });
    
    // Helper function to normalize filename for comparison
    const normalizeFilename = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    
    // Categorize attachments
    (attachments || []).forEach((file) => {
      const fileKey = file.filename.toLowerCase();
      const normalizedFileKey = normalizeFilename(file.filename);
      
      // Check if this file is referenced in HTML with cid:
      // Match by original filename or sanitized filename
      const isInline = cidFiles.has(fileKey) || 
                       cidFiles.has(normalizedFileKey) ||
                       Array.from(cidFiles).some(cid => {
                         const normalizedCid = normalizeFilename(cid);
                         return normalizedCid === normalizedFileKey || normalizedCid === fileKey;
                       });
      
      if (isInline) {
        inlineImages.set(normalizedFileKey, file);
      } else {
        regularAttachments.push(file);
      }
    });
  } else {
    // No HTML, so all attachments are regular
    regularAttachments.push(...(attachments || []));
  }
  
  // Add inline images first (for proper email client rendering)
  inlineImages.forEach((file) => {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${file.mimeType}`);
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('Content-Disposition: inline');
    // Use sanitized filename as Content-ID (must match the cid: reference in HTML)
    const contentId = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    lines.push(`Content-ID: <${contentId}>`);
    lines.push('');
    lines.push(file.contentBase64);
    lines.push('');
  });
  
  // Add regular attachments
  regularAttachments.forEach((file) => {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${file.mimeType}`);
    lines.push('Content-Transfer-Encoding: base64');
    lines.push(`Content-Disposition: attachment; filename="${file.filename}"`);
    lines.push('');
    lines.push(file.contentBase64);
    lines.push('');
  });

  lines.push(`--${boundary}--`);

  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const sendGmailMessage = async ({
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments,
}) => {
  const raw = buildEmailBody({ to, cc, bcc, subject, text, html, attachments });

  return gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
};
