import { Router } from 'express';
import * as users from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);
router.get('/profile', users.getProfile);
router.patch('/profile', validate(profileSchema), users.updateProfile);
router.get('/search', users.searchUsers);
export default router;
