import { Router } from 'express';
import multer from 'multer';
import { getInbox, getSent, sendEmail } from '../controllers/emailController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.post('/send', upload.array('attachments'), sendEmail);

export default router;

