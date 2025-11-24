import { getInboxMessages, getSentMessages, sendGmailMessage } from '../services/gmailService.js';

const parseLimit = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return undefined;
  return Math.min(Math.max(number, 1), 100);
};

export const getInbox = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const messages = await getInboxMessages(limit);
    res.json({ count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

export const getSent = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const messages = await getSentMessages(limit);
    res.json({ count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { to, subject, text, html } = req.body;

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

    const response = await sendGmailMessage({ to, subject, text, html, attachments });

    res.status(201).json({
      message: 'Email sent successfully',
      id: response.data.id,
      threadId: response.data.threadId,
    });
  } catch (error) {
    next(error);
  }
};

