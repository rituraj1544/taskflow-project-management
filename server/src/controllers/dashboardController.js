import { prisma } from '../config/prisma.js';
import { accessibleProjectIds } from '../services/projectAccess.js';

export async function getStats(req, res) {
  const projectIds = await accessibleProjectIds(req.user.id);
  const now = new Date();
  const [totalProjects, activeProjects, totalTasks, byStatus, byPriority, overdueTasks] = await Promise.all([
    prisma.project.count({ where: { id: { in: projectIds } } }),
    prisma.project.count({ where: { id: { in: projectIds }, status: 'ACTIVE' } }),
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.groupBy({ by: ['status'], where: { projectId: { in: projectIds } }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where: { projectId: { in: projectIds } }, _count: { _all: true } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: { not: 'COMPLETED' }, dueDate: { lt: now } } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((item) => [item.status, item._count._all]));
  res.json({ stats: {
    totalProjects, activeProjects, totalTasks,
    completedTasks: counts.COMPLETED || 0,
    pendingTasks: totalTasks - (counts.COMPLETED || 0),
    overdueTasks,
    taskStatuses: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'].map((status) => ({ status, count: counts[status] || 0 })),
    taskPriorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => ({ priority, count: byPriority.find((item) => item.priority === priority)?._count._all || 0 })),
  } });
}

export async function getRecentProjects(req, res) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.user.id } } },
    include: { owner: { select: { fullName: true } }, _count: { select: { tasks: true, members: true } } },
    orderBy: { updatedAt: 'desc' }, take: 5,
  });
  const projectIds = projects.map(({ id }) => id);
  const completed = await prisma.task.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, status: 'COMPLETED' }, _count: { _all: true } });
  const completedByProject = Object.fromEntries(completed.map(({ projectId, _count }) => [projectId, _count._all]));
  res.json({ projects: projects.map((project) => ({ ...project, completedCount: completedByProject[project.id] || 0 })) });
}

export async function getMyTasks(req, res) {
  const tasks = await prisma.task.findMany({
    where: { assigneeId: req.user.id, status: { not: 'COMPLETED' } },
    include: { project: { select: { id: true, name: true } }, creator: { select: { fullName: true } }, assignee: { select: { id: true, fullName: true } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], take: 8,
  });
  res.json({ tasks });
}

export async function getActivity(req, res) {
  const projectIds = await accessibleProjectIds(req.user.id);
  const activity = await prisma.activityLog.findMany({
    where: { projectId: { in: projectIds } },
    include: { user: { select: { id: true, fullName: true } }, project: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }, take: 12,
  });
  res.json({ activity });
}

export async function getUpcoming(req, res) {
  const tasks = await prisma.task.findMany({
    where: { assigneeId: req.user.id, status: { not: 'COMPLETED' }, dueDate: { gte: new Date() } },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { dueDate: 'asc' }, take: 6,
  });
  res.json({ tasks });
}
