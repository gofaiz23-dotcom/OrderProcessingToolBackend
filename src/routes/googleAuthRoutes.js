import { Router } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleAuthCallback,
} from '../controllers/googleAuthController.js';

const router = Router();

router.get('/google', getGoogleAuthUrl);
router.get('/google/callback', handleGoogleAuthCallback);

export default router;


