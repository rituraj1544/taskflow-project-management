import { prisma } from '../config/prisma.js';
import { createNotification, logActivity } from '../services/activity.js';
import { membershipFor, requireProjectMember } from '../services/projectAccess.js';
import { HttpError } from '../utils/httpError.js';
import { parseId } from '../utils/parseId.js';

const projectInclude = {
  owner: { select: { id: true, fullName: true, email: true } },
  _count: { select: { members: true, tasks: true } },
};

export async function listProjects(req, res) {
  if (req.query.status && !['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].includes(req.query.status)) throw new HttpError(400, 'Invalid project status.');
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.user.id } }, ...(req.query.status ? { status: req.query.status } : {}) },
    include: { ...projectInclude, members: { where: { userId: req.user.id }, select: { role: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  const projectIds = projects.map(({ id }) => id);
  const completed = await prisma.task.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, status: 'COMPLETED' }, _count: { _all: true } });
  const completedByProject = Object.fromEntries(completed.map(({ projectId, _count }) => [projectId, _count._all]));
  res.json({ projects: projects.map((project) => ({ ...project, currentRole: project.members[0]?.role, completedCount: completedByProject[project.id] || 0, members: undefined })) });
}

export async function getProject(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  const membership = await requireProjectMember(projectId, req.user.id);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ...projectInclude,
      members: { include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { joinedAt: 'asc' } },
      tasks: { include: { assignee: { select: { id: true, fullName: true, email: true } }, _count: { select: { comments: true } } }, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }] },
      activities: { take: 12, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, fullName: true } } } },
    },
  });
  res.json({ project: { ...project, currentRole: membership.role } });
}

export async function createProject(req, res) {
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({ data: { ...req.body, ownerId: req.user.id } });
    await tx.projectMember.create({ data: { projectId: created.id, userId: req.user.id, role: 'OWNER' } });
    await logActivity(tx, { projectId: created.id, userId: req.user.id, action: 'PROJECT_CREATED', detail: `Created project “${created.name}”.` });
    return tx.project.findUnique({ where: { id: created.id }, include: projectInclude });
  });
  res.status(201).json({ project });
}

export async function updateProject(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  const membership = await requireProjectMember(projectId, req.user.id);
  if (membership.role !== 'OWNER') throw new HttpError(403, 'Only the project owner can edit project details.');
  const current = await prisma.project.findUnique({ where: { id: projectId }, select: { startDate: true, endDate: true } });
  const startDate = req.body.startDate !== undefined ? req.body.startDate : current.startDate;
  const endDate = req.body.endDate !== undefined ? req.body.endDate : current.endDate;
  if (startDate && endDate && startDate > endDate) throw new HttpError(400, 'End date must be after the start date.');
  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({ where: { id: projectId }, data: req.body });
    await logActivity(tx, { projectId, userId: req.user.id, action: 'PROJECT_UPDATED', detail: `Updated project “${updated.name}”.` });
    return tx.project.findUnique({ where: { id: projectId }, include: projectInclude });
  });
  res.json({ project });
}

export async function deleteProject(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  const membership = await requireProjectMember(projectId, req.user.id);
  if (membership.role !== 'OWNER') throw new HttpError(403, 'Only the project owner can delete this project.');
  await prisma.project.delete({ where: { id: projectId } });
  res.json({ message: 'Project deleted.' });
}

export async function listMembers(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  await requireProjectMember(projectId, req.user.id);
  const members = await prisma.projectMember.findMany({ where: { projectId }, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { joinedAt: 'asc' } });
  res.json({ members });
}

export async function addMember(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  const membership = await membershipFor(projectId, req.user.id);
  if (!membership) throw new HttpError(404, 'Project not found.');
  if (membership.role !== 'OWNER') throw new HttpError(403, 'Only the project owner can manage team members.');
  const user = await prisma.user.findUnique({ where: { email: req.body.email }, select: { id: true, fullName: true, email: true } });
  if (!user) throw new HttpError(404, 'No TaskFlow account uses that email yet.');
  if (await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: user.id } } })) throw new HttpError(409, 'That person is already on this project.');
  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.projectMember.create({ data: { projectId, userId: user.id, role: req.body.role }, include: { user: { select: { id: true, fullName: true, email: true } } } });
    const project = await tx.project.findUnique({ where: { id: projectId }, select: { name: true } });
    await createNotification(tx, { userId: user.id, type: 'PROJECT_MEMBER', projectId, message: `You were added to “${project.name}”.` });
    await logActivity(tx, { projectId, userId: req.user.id, action: 'MEMBER_ADDED', detail: `Added ${user.fullName} to the project.` });
    return created;
  });
  res.status(201).json({ member });
}

export async function updateMemberRole(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  const membership = await membershipFor(projectId, req.user.id);
  if (!membership) throw new HttpError(404, 'Project not found.');
  if (membership.role !== 'OWNER') throw new HttpError(403, 'Only the project owner can manage team members.');
  const target = await prisma.projectMember.findFirst({ where: { id: parseId(req.params.memberId, 'Team member'), projectId } });
  if (!target || target.role === 'OWNER') throw new HttpError(404, 'Team member not found.');
  const updated = await prisma.projectMember.update({ where: { id: target.id }, data: { role: req.body.role }, include: { user: { select: { id: true, fullName: true, email: true } } } });
  res.json({ member: updated });
}

export async function removeMember(req, res) {
  const projectId = parseId(req.params.id, 'Project');
  const membership = await membershipFor(projectId, req.user.id);
  if (!membership) throw new HttpError(404, 'Project not found.');
  if (membership.role !== 'OWNER') throw new HttpError(403, 'Only the project owner can manage team members.');
  const target = await prisma.projectMember.findFirst({ where: { id: parseId(req.params.memberId, 'Team member'), projectId } });
  if (!target || target.role === 'OWNER') throw new HttpError(404, 'Team member not found.');
  const user = await prisma.user.findUnique({ where: { id: target.userId }, select: { fullName: true } });
  await prisma.$transaction(async (tx) => {
    await tx.projectMember.delete({ where: { id: target.id } });
    await tx.task.updateMany({ where: { projectId, assigneeId: target.userId }, data: { assigneeId: null } });
    await logActivity(tx, { projectId, userId: req.user.id, action: 'MEMBER_REMOVED', detail: `Removed ${user.fullName} from the project.` });
  });
  res.json({ message: 'Member removed.' });
}
