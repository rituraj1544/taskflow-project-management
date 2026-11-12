import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

const publicUser = ({ id, fullName, email, createdAt }) => ({ id, fullName, email, createdAt });
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('taskflow_token', token, cookieOptions());
}

export async function register(req, res) {
  const { fullName, email, password } = req.body;
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'An account with that email already exists.');
  const user = await prisma.user.create({ data: { fullName, email, passwordHash: await bcrypt.hash(password, 12) } });
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
}

export async function login(req, res) {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new HttpError(401, 'Email or password is incorrect.');
  setSession(res, user);
  res.json({ user: publicUser(user) });
}

export function logout(_req, res) {
  res.clearCookie('taskflow_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  res.json({ message: 'Signed out.' });
}

export function me(req, res) { res.json({ user: req.user }); }

export async function changePassword(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect.');
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) } });
  res.json({ message: 'Password updated.' });
}
