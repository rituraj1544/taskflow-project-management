import { prisma } from '../config/prisma.js';

export function logActivity(tx, { projectId, userId, action, detail }) {
  return tx.activityLog.create({ data: { projectId, userId, action, detail } });
}

export function createNotification(tx, { userId, type, message, taskId = null, projectId = null }) {
  return tx.notification.create({ data: { userId, type, message, taskId, projectId } });
}

export async function notifyUpcomingDeadlines() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tasks = await prisma.task.findMany({
    where: { status: { not: 'COMPLETED' }, dueDate: { gte: now, lte: soon }, assigneeId: { not: null } },
    select: { id: true, title: true, projectId: true, assigneeId: true },
  });
  for (const task of tasks) {
    const existing = await prisma.notification.findFirst({
      where: { userId: task.assigneeId, taskId: task.id, type: 'DEADLINE', createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });
    if (!existing) await prisma.notification.create({
      data: { userId: task.assigneeId, taskId: task.id, projectId: task.projectId, type: 'DEADLINE', message: `“${task.title}” is due within 24 hours.` },
    });
  }
}
