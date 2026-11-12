import { prisma } from '../config/prisma.js';
import { parseId } from '../utils/parseId.js';

export async function listNotifications(req, res) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
  ]);
  res.json({ notifications, unreadCount });
}

export async function markRead(req, res) {
  const result = await prisma.notification.updateMany({ where: { id: parseId(req.params.id, 'Notification'), userId: req.user.id, readAt: null }, data: { readAt: new Date() } });
  res.json({ updated: result.count > 0 });
}

export async function markAllRead(req, res) {
  const result = await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } });
  res.json({ updated: result.count });
}
