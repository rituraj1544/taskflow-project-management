import { prisma } from '../config/prisma.js';
import { createNotification, logActivity } from '../services/activity.js';
import { accessibleProjectIds, requireProjectManager, requireProjectMember } from '../services/projectAccess.js';
import { HttpError } from '../utils/httpError.js';
import { parseId } from '../utils/parseId.js';

const taskInclude = {
  assignee: { select: { id: true, fullName: true, email: true } },
  creator: { select: { id: true, fullName: true } },
  project: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
};
const validValues = { status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'], priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] };

async function assertAssignee(projectId, assigneeId) {
  if (assigneeId == null) return;
  if (!(await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: Number(assigneeId) } } }))) {
    throw new HttpError(400, 'The assignee must be a member of this project.');
  }
}

export async function listTasks(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const projectIds = await accessibleProjectIds(req.user.id);
  const projectId = req.query.projectId ? parseId(req.query.projectId, 'Project') : undefined;
  if (projectId && !projectIds.includes(projectId)) throw new HttpError(404, 'Project not found.');
  for (const key of ['status', 'priority']) if (req.query[key] && !validValues[key].includes(req.query[key])) throw new HttpError(400, `Invalid task ${key}.`);
  const where = {
    projectId: projectId ? { equals: projectId } : { in: projectIds },
    ...(req.query.mine === 'true' ? { assigneeId: req.user.id } : {}),
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.priority ? { priority: req.query.priority } : {}),
    ...(req.query.q ? { title: { contains: String(req.query.q).slice(0, 100) } } : {}),
  };
  const orderBy = req.query.sort === 'deadline' ? [{ dueDate: 'asc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }];
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.task.count({ where }),
  ]);
  res.json({ tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getTask(req, res) {
  const task = await prisma.task.findUnique({
    where: { id: parseId(req.params.id, 'Task') },
    include: {
      ...taskInclude,
      project: { include: { members: { include: { user: { select: { id: true, fullName: true, email: true } } } } } },
      comments: { include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!task) throw new HttpError(404, 'Task not found.');
  const membership = await requireProjectMember(task.projectId, req.user.id);
  res.json({ task: { ...task, currentRole: membership.role } });
}

export async function createTask(req, res) {
  const { projectId, assigneeId, ...data } = req.body;
  await requireProjectManager(projectId, req.user.id);
  await assertAssignee(projectId, assigneeId);
  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({ data: { ...data, projectId, assigneeId: assigneeId ?? null, creatorId: req.user.id } });
    const project = await tx.project.findUnique({ where: { id: projectId }, select: { name: true } });
    await logActivity(tx, { projectId, userId: req.user.id, action: 'TASK_CREATED', detail: `Created “${created.title}” in ${project.name}.` });
    if (assigneeId) {
      await logActivity(tx, { projectId, userId: req.user.id, action: 'TASK_ASSIGNED', detail: `Assigned “${created.title}” to a team member.` });
      if (assigneeId !== req.user.id) await createNotification(tx, { userId: assigneeId, type: 'TASK_ASSIGNED', taskId: created.id, projectId, message: `You were assigned “${created.title}” in ${project.name}.` });
    }
    return tx.task.findUnique({ where: { id: created.id }, include: taskInclude });
  });
  res.status(201).json({ task });
}

export async function updateTask(req, res) {
  const taskId = parseId(req.params.id, 'Task');
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new HttpError(404, 'Task not found.');
  const membership = await requireProjectMember(task.projectId, req.user.id);
  const keys = Object.keys(req.body);
  if (!['OWNER', 'MANAGER'].includes(membership.role) && !(membership.role === 'MEMBER' && task.assigneeId === req.user.id && keys.every((key) => key === 'status'))) {
    throw new HttpError(403, 'You can only update the status of tasks assigned to you.');
  }
  if (req.body.assigneeId !== undefined) await assertAssignee(task.projectId, req.body.assigneeId);
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.task.update({ where: { id: taskId }, data: req.body });
    if (req.body.assigneeId && req.body.assigneeId !== task.assigneeId && req.body.assigneeId !== req.user.id) {
      await createNotification(tx, { userId: req.body.assigneeId, type: 'TASK_ASSIGNED', taskId, projectId: task.projectId, message: `You were assigned “${result.title}”.` });
      await logActivity(tx, { projectId: task.projectId, userId: req.user.id, action: 'TASK_ASSIGNED', detail: `Assigned “${result.title}” to a team member.` });
    }
    if (req.body.status && req.body.status !== task.status) {
      await logActivity(tx, { projectId: task.projectId, userId: req.user.id, action: 'TASK_STATUS_CHANGED', detail: `Moved “${result.title}” to ${result.status.replace('_', ' ').toLowerCase()}.` });
      if (result.status === 'COMPLETED') {
        const recipients = new Set([task.creatorId, task.assigneeId].filter((id) => id && id !== req.user.id));
        for (const userId of recipients) await createNotification(tx, { userId, type: 'TASK_COMPLETED', taskId, projectId: task.projectId, message: `“${result.title}” was marked complete.` });
      }
    }
    return tx.task.findUnique({ where: { id: taskId }, include: taskInclude });
  });
  res.json({ task: updated });
}

export async function updateTaskStatus(req, res) {
  const taskId = parseId(req.params.id, 'Task');
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new HttpError(404, 'Task not found.');
  const membership = await requireProjectMember(task.projectId, req.user.id);
  if (!['OWNER', 'MANAGER'].includes(membership.role) && task.assigneeId !== req.user.id) throw new HttpError(403, 'You can only update tasks assigned to you.');
  const status = req.body.status;
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.task.update({ where: { id: taskId }, data: { status } });
    if (status !== task.status) {
      await logActivity(tx, { projectId: task.projectId, userId: req.user.id, action: 'TASK_STATUS_CHANGED', detail: `Moved “${task.title}” to ${status.replace('_', ' ').toLowerCase()}.` });
      if (status === 'COMPLETED') {
        const recipients = new Set([task.creatorId, task.assigneeId].filter((id) => id && id !== req.user.id));
        for (const userId of recipients) await createNotification(tx, { userId, type: 'TASK_COMPLETED', taskId, projectId: task.projectId, message: `“${task.title}” was marked complete.` });
      }
    }
    return tx.task.findUnique({ where: { id: taskId }, include: taskInclude });
  });
  res.json({ task: updated });
}

export async function deleteTask(req, res) {
  const task = await prisma.task.findUnique({ where: { id: parseId(req.params.id, 'Task') } });
  if (!task) throw new HttpError(404, 'Task not found.');
  await requireProjectManager(task.projectId, req.user.id);
  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id: task.id } });
    await logActivity(tx, { projectId: task.projectId, userId: req.user.id, action: 'TASK_DELETED', detail: `Deleted “${task.title}”.` });
  });
  res.json({ message: 'Task deleted.' });
}

async function taskAndMembership(taskId, userId) {
  const task = await prisma.task.findUnique({ where: { id: parseId(taskId, 'Task') } });
  if (!task) throw new HttpError(404, 'Task not found.');
  const membership = await requireProjectMember(task.projectId, userId);
  return { task, membership };
}

export async function listComments(req, res) {
  const { task } = await taskAndMembership(req.params.id, req.user.id);
  const comments = await prisma.comment.findMany({ where: { taskId: task.id }, include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } });
  res.json({ comments });
}

export async function addComment(req, res) {
  const { task } = await taskAndMembership(req.params.id, req.user.id);
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({ data: { taskId: task.id, userId: req.user.id, body: req.body.body }, include: { user: { select: { id: true, fullName: true } } } });
    await logActivity(tx, { projectId: task.projectId, userId: req.user.id, action: 'COMMENT_ADDED', detail: `Commented on “${task.title}”.` });
    return created;
  });
  res.status(201).json({ comment });
}

export async function updateComment(req, res) {
  const comment = await prisma.comment.findUnique({ where: { id: parseId(req.params.id, 'Comment') }, include: { task: true } });
  if (!comment) throw new HttpError(404, 'Comment not found.');
  const membership = await requireProjectMember(comment.task.projectId, req.user.id);
  if (comment.userId !== req.user.id && !['OWNER', 'MANAGER'].includes(membership.role)) throw new HttpError(403, 'You cannot edit this comment.');
  const updated = await prisma.comment.update({ where: { id: comment.id }, data: { body: req.body.body }, include: { user: { select: { id: true, fullName: true } } } });
  res.json({ comment: updated });
}

export async function deleteComment(req, res) {
  const comment = await prisma.comment.findUnique({ where: { id: parseId(req.params.id, 'Comment') }, include: { task: true } });
  if (!comment) throw new HttpError(404, 'Comment not found.');
  const membership = await requireProjectMember(comment.task.projectId, req.user.id);
  if (comment.userId !== req.user.id && !['OWNER', 'MANAGER'].includes(membership.role)) throw new HttpError(403, 'You cannot delete this comment.');
  await prisma.comment.delete({ where: { id: comment.id } });
  res.json({ message: 'Comment deleted.' });
}
