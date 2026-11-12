import { Router } from 'express';
import { deleteComment, updateComment } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { commentSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);
router.patch('/:id', validate(commentSchema), updateComment);
router.delete('/:id', deleteComment);
export default router;
