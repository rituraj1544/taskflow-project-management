import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash('TaskflowDemo2026!', 12);
const people = [
  { fullName: 'Alex Morgan', email: 'alex@taskflow.demo' },
  { fullName: 'Jamie Chen', email: 'jamie@taskflow.demo' },
  { fullName: 'Sam Rivera', email: 'sam@taskflow.demo' },
];

try {
  const users = [];
  for (const person of people) users.push(await prisma.user.upsert({
    where: { email: person.email },
    update: {},
    create: { ...person, passwordHash },
  }));
  const [owner, manager, member] = users;
  let project = await prisma.project.findFirst({ where: { name: 'Website refresh', ownerId: owner.id } });
  if (!project) project = await prisma.project.create({
    data: { name: 'Website refresh', description: 'A focused refresh of the product website and onboarding experience.', status: 'ACTIVE', startDate: new Date(), endDate: new Date(Date.now() + 45 * 86400000), ownerId: owner.id },
  });
  for (const [user, role] of [[owner, 'OWNER'], [manager, 'MANAGER'], [member, 'MEMBER']]) {
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: user.id } }, update: { role }, create: { projectId: project.id, userId: user.id, role } });
  }
  const examples = [
    { title: 'Map the current onboarding flow', status: 'COMPLETED', priority: 'MEDIUM', assigneeId: manager.id },
    { title: 'Design the new landing page', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: member.id },
    { title: 'Review mobile navigation', status: 'IN_REVIEW', priority: 'URGENT', assigneeId: manager.id },
    { title: 'Prepare launch checklist', status: 'TODO', priority: 'LOW', assigneeId: member.id },
  ];
  for (const task of examples) {
    const exists = await prisma.task.findFirst({ where: { projectId: project.id, title: task.title } });
    if (!exists) await prisma.task.create({ data: { ...task, projectId: project.id, creatorId: owner.id, dueDate: new Date(Date.now() + (task.status === 'COMPLETED' ? 10 : 3) * 86400000) } });
  }
  const activityExists = await prisma.activityLog.findFirst({ where: { projectId: project.id } });
  if (!activityExists) await prisma.activityLog.create({ data: { projectId: project.id, userId: owner.id, action: 'PROJECT_CREATED', detail: `Created project “${project.name}”.` } });
  console.log('Seed data is ready. Demo users: alex@taskflow.demo, jamie@taskflow.demo, sam@taskflow.demo');
} finally {
  await prisma.$disconnect();
}
