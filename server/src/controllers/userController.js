import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, fullName: true, email: true, createdAt: true } });
  res.json({ user });
}

export async function updateProfile(req, res) {
  const { fullName, email } = req.body;
  if (!fullName && !email) throw new HttpError(400, 'Add a name or email change first.');
  if (email && await prisma.user.findFirst({ where: { email, id: { not: req.user.id } } })) throw new HttpError(409, 'That email is already in use.');
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { ...(fullName ? { fullName } : {}), ...(email ? { email } : {}) }, select: { id: true, fullName: true, email: true, createdAt: true } });
  res.json({ user });
}

export async function searchUsers(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });
  const users = await prisma.user.findMany({
    where: { id: { not: req.user.id }, OR: [{ email: { contains: q } }, { fullName: { contains: q } }] },
    select: { id: true, fullName: true, email: true }, take: 10,
  });
  res.json({ users });
}
