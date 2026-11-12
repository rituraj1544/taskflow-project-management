import { Router } from 'express';
import * as dashboard from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/stats', dashboard.getStats);
router.get('/recent-projects', dashboard.getRecentProjects);
router.get('/my-tasks', dashboard.getMyTasks);
router.get('/upcoming', dashboard.getUpcoming);
router.get('/activity', dashboard.getActivity);
export default router;
