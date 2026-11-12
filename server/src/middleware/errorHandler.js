import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'That record already exists.' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'The requested record was not found.' });
    if (error.code === 'P2003') return res.status(400).json({ error: 'This change conflicts with related records.' });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
}
