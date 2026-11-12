import { Router } from 'express';
import * as projects from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addMemberSchema, memberRoleSchema, projectSchema, projectUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);
router.get('/', projects.listProjects);
router.post('/', validate(projectSchema), projects.createProject);
router.get('/:id/members', projects.listMembers);
router.post('/:id/members', validate(addMemberSchema), projects.addMember);
router.patch('/:id/members/:memberId', validate(memberRoleSchema), projects.updateMemberRole);
router.delete('/:id/members/:memberId', projects.removeMember);
router.get('/:id', projects.getProject);
router.patch('/:id', validate(projectUpdateSchema), projects.updateProject);
router.delete('/:id', projects.deleteProject);
export default router;
