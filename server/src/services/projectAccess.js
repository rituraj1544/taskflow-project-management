import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

export async function membershipFor(projectId, userId) {
  const id = Number(projectId);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  return prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: id, userId } } });
}

export async function requireProjectMember(projectId, userId) {
  const membership = await membershipFor(projectId, userId);
  if (!membership) throw new HttpError(404, 'Project not found.');
  return membership;
}

export async function requireProjectManager(projectId, userId) {
  const membership = await requireProjectMember(projectId, userId);
  if (!['OWNER', 'MANAGER'].includes(membership.role)) throw new HttpError(403, 'You need a manager role to do that.');
  return membership;
}

export async function accessibleProjectIds(userId) {
  const memberships = await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } });
  return memberships.map(({ projectId }) => projectId);
}
