import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emails = { owner: `owner-${suffix}@taskflow.test`, member: `member-${suffix}@taskflow.test` };
const password = 'TaskflowTest!2026';
const owner = request.agent(app);
const member = request.agent(app);
let ownerId; let memberId; let projectId;

test('register, project permissions, task workflow, notifications, and logout', async () => {
  const ownerSignup = await owner.post('/api/auth/register').send({ fullName: 'Test Owner', email: emails.owner, password, confirmPassword: password }).expect(201);
  ownerId = ownerSignup.body.user.id;
  const memberSignup = await member.post('/api/auth/register').send({ fullName: 'Test Member', email: emails.member, password, confirmPassword: password }).expect(201);
  memberId = memberSignup.body.user.id;
  await owner.get('/api/auth/me').expect(200);

  const project = await owner.post('/api/projects').send({ name: `Workflow project ${suffix}`, status: 'ACTIVE' }).expect(201);
  projectId = project.body.project.id;
  await member.patch(`/api/projects/${projectId}`).send({ name: 'Not allowed' }).expect(404);
  await owner.patch(`/api/projects/${projectId}`).send({ description: 'Project permissions are enforced.' }).expect(200);
  const membership = await owner.post(`/api/projects/${projectId}/members`).send({ email: emails.member, role: 'MEMBER' }).expect(201);

  const created = await owner.post('/api/tasks').send({ projectId, title: 'Test task', priority: 'HIGH', assigneeId: memberId }).expect(201);
  const taskId = created.body.task.id;
  const unassignedTask = await owner.post('/api/tasks').send({ projectId, title: 'Unassigned task', assigneeId: null, dueDate: null }).expect(201);
  assert.equal(unassignedTask.body.task.assigneeId, null);
  assert.equal(unassignedTask.body.task.dueDate, null);
  await member.get(`/api/tasks/${taskId}`).expect(200);
  await member.patch(`/api/tasks/${taskId}`).send({ title: 'Unauthorized edit' }).expect(403);
  await member.patch(`/api/tasks/${taskId}/status`).send({ status: 'IN_PROGRESS' }).expect(200);
  const comment = await member.post(`/api/tasks/${taskId}/comments`).send({ body: 'Starting this task now.' }).expect(201);
  await owner.patch(`/api/comments/${comment.body.comment.id}`).send({ body: 'Thanks, I saw the update.' }).expect(200);
  const notifications = await member.get('/api/notifications').expect(200);
  assert.ok(notifications.body.notifications.some((item) => item.type === 'TASK_ASSIGNED'));
  await member.get('/api/dashboard/stats').expect(200);
  await owner.post(`/api/tasks/${taskId}/comments`).send({ body: 'Thanks for the update.' }).expect(201);
  await owner.patch(`/api/tasks/${taskId}/status`).send({ status: 'COMPLETED' }).expect(200);
  const completedNotifications = await member.get('/api/notifications').expect(200);
  assert.ok(completedNotifications.body.notifications.some((item) => item.type === 'TASK_COMPLETED'));
  await member.delete(`/api/projects/${projectId}/members/${membership.body.member.id}`).expect(403);
  await owner.delete(`/api/projects/${projectId}/members/${membership.body.member.id}`).expect(200);
  await owner.patch(`/api/tasks/${taskId}`).send({ title: 'Updated test task', priority: 'URGENT' }).expect(200);
  await owner.delete(`/api/tasks/${taskId}`).expect(200);
  await owner.delete(`/api/tasks/${unassignedTask.body.task.id}`).expect(200);
  await owner.delete(`/api/projects/${projectId}`).expect(200);
  await member.post('/api/auth/logout').expect(200);
  await member.get('/api/auth/me').expect(401);
  await member.post('/api/auth/login').send({ email: emails.member, password }).expect(200);
  await member.get('/api/auth/me').expect(200);
  await member.post('/api/auth/logout').expect(200);
});

after(async () => {
  if (projectId) await prisma.project.deleteMany({ where: { id: projectId } });
  const ids = [ownerId, memberId].filter(Boolean);
  if (ids.length) await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});
