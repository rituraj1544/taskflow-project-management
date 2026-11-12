import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as auth from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();
const signInLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please wait a few minutes.' } });
router.post('/register', signInLimit, validate(registerSchema), auth.register);
router.post('/login', signInLimit, validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);
router.patch('/change-password', requireAuth, validate(changePasswordSchema), auth.changePassword);
export default router;
