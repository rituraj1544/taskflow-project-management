import { Router } from 'express';
import * as tasks from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { commentSchema, statusSchema, taskSchema, taskUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);
router.get('/', tasks.listTasks);
router.post('/', validate(taskSchema), tasks.createTask);
router.get('/:id/comments', tasks.listComments);
router.post('/:id/comments', validate(commentSchema), tasks.addComment);
router.patch('/:id/status', validate(statusSchema), tasks.updateTaskStatus);
router.get('/:id', tasks.getTask);
router.patch('/:id', validate(taskUpdateSchema), tasks.updateTask);
router.delete('/:id', tasks.deleteTask);
export default router;
