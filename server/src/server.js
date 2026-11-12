import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './config/prisma.js';
import { notifyUpcomingDeadlines } from './services/activity.js';

const port = Number(process.env.PORT || 5000);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Copy server/.env.example to server/.env and configure it.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');

await prisma.$connect();
const app = createApp();
const server = app.listen(port, () => console.log(`TaskFlow API listening on http://localhost:${port}`));

const deadlineCheck = async () => {
  try { await notifyUpcomingDeadlines(); }
  catch (error) { console.error('Deadline notification job failed:', error.message); }
};
await deadlineCheck();
const deadlineTimer = setInterval(deadlineCheck, 60 * 60 * 1000);
deadlineTimer.unref();

async function shutdown() {
  clearInterval(deadlineTimer);
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
