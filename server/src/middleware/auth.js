import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies?.taskflow_token || bearerToken;
    if (!token) throw new HttpError(401, 'Please sign in to continue.');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, fullName: true, email: true, createdAt: true },
    });
    if (!user) throw new HttpError(401, 'Your session is no longer valid.');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Please sign in to continue.'));
  }
}
