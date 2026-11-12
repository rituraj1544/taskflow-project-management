import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'TaskflowDemo2026!';
const demoPrefix = 'taskflow-demo';

function argument(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.slice(2).find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim();
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

function dateFromToday(offsetDays, hour = 17) {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  if (offsetDays === 0 && hour === 17) value.setHours(23, 0, 0, 0);
  else value.setHours(hour, 0, 0, 0);
  return value;
}

function parseEmail(value) {
  const email = value?.toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

const ownerEmail = parseEmail(argument('email') || process.env.DEMO_OWNER_EMAIL);
if (process.env.NODE_ENV === 'production') {
  console.error('Demo data seeding is disabled when NODE_ENV=production.');
  process.exitCode = 1;
} else if (!ownerEmail) {
  console.error('Choose an existing account with --email=you@example.com or DEMO_OWNER_EMAIL.');
  process.exitCode = 1;
}

const people = [
  { key: 'rahul', fullName: 'Rahul Sharma', email: 'rahul.sharma@example.test' },
  { key: 'priya', fullName: 'Priya Singh', email: 'priya.singh@example.test' },
  { key: 'arjun', fullName: 'Arjun Kumar', email: 'arjun.kumar@example.test' },
  { key: 'neha', fullName: 'Neha Verma', email: 'neha.verma@example.test' },
];

const projectSpecs = [
  { key: 'platform', name: 'TaskFlow Platform Development', description: 'Development of a collaborative project and task management platform.', status: 'ACTIVE', startDate: dateFromToday(-32), endDate: dateFromToday(28) },
  { key: 'ecommerce', name: 'E-Commerce REST API', description: 'Development of product, inventory and order management APIs.', status: 'ACTIVE', startDate: dateFromToday(-18), endDate: dateFromToday(34) },
  { key: 'events', name: 'College Event Management Portal', description: 'A web application for managing college events and student registrations.', status: 'PLANNING', startDate: dateFromToday(-4), endDate: dateFromToday(48) },
];

const taskSpecs = [
  { key: 'auth-page', project: 'platform', title: 'Design authentication page', description: 'Finalize the responsive sign-in and account creation experience.', status: 'COMPLETED', priority: 'MEDIUM', assignee: 'priya', dueIn: -14 },
  { key: 'jwt-auth', project: 'platform', title: 'Implement JWT authentication', description: 'Finish secure session handling and protected API middleware.', status: 'IN_PROGRESS', priority: 'URGENT', assignee: 'owner', dueIn: -2 },
  { key: 'mysql-schema', project: 'platform', title: 'Create MySQL database schema', description: 'Review project, membership, task and notification relationships.', status: 'COMPLETED', priority: 'HIGH', assignee: 'arjun', dueIn: -9 },
  { key: 'project-apis', project: 'platform', title: 'Develop project management APIs', description: 'Complete project CRUD and owner-level authorization.', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'neha', dueIn: -1 },
  { key: 'task-assignment', project: 'platform', title: 'Implement task assignment', description: 'Allow managers to assign work to project members.', status: 'TODO', priority: 'MEDIUM', assignee: 'owner', dueIn: 0 },
  { key: 'kanban-board', project: 'platform', title: 'Build Kanban board', description: 'Connect drag and drop status updates to the task API.', status: 'IN_REVIEW', priority: 'MEDIUM', assignee: 'priya', dueIn: 7 },
  { key: 'dashboard-analytics', project: 'platform', title: 'Develop dashboard analytics', description: 'Show live status and priority breakdowns for accessible projects.', status: 'TODO', priority: 'HIGH', assignee: 'rahul', dueIn: 8 },
  { key: 'product-listing', project: 'ecommerce', title: 'Create product listing API', description: 'Add pagination, category filters and product search.', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'arjun', dueIn: 2 },
  { key: 'shopping-cart', project: 'ecommerce', title: 'Implement shopping cart', description: 'Support quantity updates and inventory-aware cart validation.', status: 'TODO', priority: 'MEDIUM', assignee: 'rahul', dueIn: 7 },
  { key: 'order-management', project: 'ecommerce', title: 'Develop order management', description: 'Add order creation, status changes and customer history.', status: 'IN_REVIEW', priority: 'URGENT', assignee: 'neha', dueIn: 8 },
  { key: 'rest-api-tests', project: 'ecommerce', title: 'Test REST APIs', description: 'Cover the product, cart and order request workflows.', status: 'COMPLETED', priority: 'MEDIUM', assignee: 'owner', dueIn: -10 },
  { key: 'event-registration', project: 'events', title: 'Create event registration form', description: 'Collect student details and validate registration capacity.', status: 'TODO', priority: 'HIGH', assignee: 'priya', dueIn: 7 },
  { key: 'event-admin', project: 'events', title: 'Build event admin dashboard', description: 'Give organizers a view of attendance and sign-up trends.', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'neha', dueIn: 2 },
  { key: 'deployment-docs', project: 'events', title: 'Prepare deployment documentation', description: 'Document environment setup, release and rollback steps.', status: 'TODO', priority: 'LOW', assignee: 'owner', dueIn: 1 },
  { key: 'event-approval', project: 'events', title: 'Implement event approval workflow', description: 'Let administrators review and publish submitted events.', status: 'COMPLETED', priority: 'MEDIUM', assignee: 'rahul', dueIn: -6 },
];

const memberships = {
  platform: [['owner', 'OWNER'], ['neha', 'MANAGER'], ['rahul', 'MEMBER'], ['priya', 'MEMBER'], ['arjun', 'MEMBER']],
  ecommerce: [['owner', 'OWNER'], ['neha', 'MANAGER'], ['rahul', 'MEMBER'], ['arjun', 'MEMBER']],
  events: [['owner', 'OWNER'], ['neha', 'MANAGER'], ['rahul', 'MEMBER'], ['priya', 'MEMBER']],
};

async function run() {
  if (process.exitCode) return;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Configure server/.env first.');
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true, fullName: true, email: true } });
  if (!owner) throw new Error(`No existing TaskFlow account was found for ${ownerEmail}. Register it first; the demo seed never creates or changes the owner account.`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const newAccounts = [];
  await prisma.$transaction(async (tx) => {
    const users = { owner };
    for (const person of people) {
      const existed = await tx.user.findUnique({ where: { email: person.email }, select: { id: true } });
      users[person.key] = await tx.user.upsert({
        where: { email: person.email },
        create: { fullName: person.fullName, email: person.email, passwordHash },
        update: {},
        select: { id: true, fullName: true, email: true },
      });
      if (!existed) newAccounts.push(person.email);
    }

    const projects = {};
    for (const spec of projectSpecs) {
      const demoKey = `${demoPrefix}:${owner.id}:project:${spec.key}`;
      const { key: _key, ...projectData } = spec;
      projects[spec.key] = await tx.project.upsert({
        where: { demoKey },
        create: { ...projectData, demoKey, ownerId: owner.id },
        update: { name: spec.name, description: spec.description, status: spec.status, startDate: spec.startDate, endDate: spec.endDate, ownerId: owner.id },
      });
    }

    for (const [projectKey, entries] of Object.entries(memberships)) {
      const project = projects[projectKey];
      for (const [personKey, role] of entries) {
        const user = users[personKey];
        await tx.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId: user.id } },
          create: { projectId: project.id, userId: user.id, role },
          update: { role },
        });
        if (personKey !== 'owner') {
          await upsertActivity(tx, owner.id, `${projectKey}:member:${personKey}`, {
            projectId: project.id, userId: owner.id, action: 'MEMBER_ADDED', detail: `Added ${user.fullName} to ${project.name}.`, createdAt: dateFromToday(-5),
          });
        }
      }
      await upsertActivity(tx, owner.id, `${projectKey}:created`, {
        projectId: project.id, userId: owner.id, action: 'PROJECT_CREATED', detail: `Created project “${project.name}”.`, createdAt: dateFromToday(-7),
      });
    }

    const tasks = {};
    for (const [index, spec] of taskSpecs.entries()) {
      const project = projects[spec.project];
      const assignee = users[spec.assignee];
      const demoKey = `${demoPrefix}:${owner.id}:task:${spec.key}`;
      tasks[spec.key] = await tx.task.upsert({
        where: { demoKey },
        create: {
          demoKey, title: spec.title, description: spec.description, projectId: project.id,
          assigneeId: assignee.id, creatorId: owner.id, status: spec.status, priority: spec.priority,
          dueDate: dateFromToday(spec.dueIn), createdAt: dateFromToday(-10 + (index % 8)),
        },
        update: {
          title: spec.title, description: spec.description, projectId: project.id,
          assigneeId: assignee.id, creatorId: owner.id, status: spec.status, priority: spec.priority,
          dueDate: dateFromToday(spec.dueIn),
        },
        include: { project: { select: { name: true } }, assignee: { select: { fullName: true } } },
      });
      await upsertActivity(tx, owner.id, `task:${spec.key}:created`, {
        projectId: project.id, userId: owner.id, action: 'TASK_CREATED', detail: `Created “${spec.title}” in ${project.name}.`, createdAt: dateFromToday(-4 + (index % 4)),
      });
      await upsertActivity(tx, owner.id, `task:${spec.key}:assigned`, {
        projectId: project.id, userId: owner.id, action: 'TASK_ASSIGNED', detail: `Assigned “${spec.title}” to ${assignee.fullName}.`, createdAt: dateFromToday(-3 + (index % 3)),
      });
      if (spec.status !== 'TODO') {
        await upsertActivity(tx, owner.id, `task:${spec.key}:status`, {
          projectId: project.id, userId: assignee.id, action: 'TASK_STATUS_CHANGED', detail: `Moved “${spec.title}” to ${spec.status.replace('_', ' ').toLowerCase()}.`, createdAt: dateFromToday(-2 + (index % 3)),
        });
      }
      if (spec.status === 'COMPLETED') {
        await upsertActivity(tx, owner.id, `task:${spec.key}:completed`, {
          projectId: project.id, userId: assignee.id, action: 'TASK_COMPLETED', detail: `Completed “${spec.title}”.`, createdAt: dateFromToday(-1),
        });
      }
    }

    const commentSpecs = [
      { key: 'auth-review', task: 'jwt-auth', author: 'neha', body: 'Please review the authentication workflow before we merge this change.', day: -1 },
      { key: 'dashboard-ready', task: 'dashboard-analytics', author: 'priya', body: 'The dashboard layout is ready for testing.', day: 0 },
      { key: 'api-complete', task: 'product-listing', author: 'arjun', body: 'API integration is completed and pagination is returning the expected results.', day: -2 },
      { key: 'testing-progress', task: 'rest-api-tests', author: 'owner', body: 'Testing is in progress; the final regression pass is complete.', day: -3 },
      { key: 'event-form', task: 'event-registration', author: 'neha', body: 'I have added the capacity validation and checked the empty state.', day: 0 },
    ];
    const comments = {};
    for (const spec of commentSpecs) {
      const task = tasks[spec.task];
      const author = users[spec.author];
      const demoKey = `${demoPrefix}:${owner.id}:comment:${spec.key}`;
      comments[spec.key] = await tx.comment.upsert({
        where: { demoKey },
        create: { demoKey, taskId: task.id, userId: author.id, body: spec.body, createdAt: dateFromToday(spec.day, 12) },
        update: { taskId: task.id, userId: author.id, body: spec.body },
      });
      await upsertActivity(tx, owner.id, `comment:${spec.key}`, {
        projectId: task.projectId, userId: author.id, action: 'COMMENT_ADDED', detail: `Commented on “${task.title}”.`, createdAt: dateFromToday(spec.day, 12),
      });
    }

    for (const [index, spec] of taskSpecs.entries()) {
      const task = tasks[spec.key];
      if (spec.assignee !== 'owner') continue;
      await upsertNotification(tx, owner.id, `assigned:${spec.key}`, {
        userId: owner.id, type: 'TASK_ASSIGNED', taskId: task.id, projectId: task.projectId,
        message: `You have been assigned “${task.title}” in ${task.project.name}.`, readAt: index === 1 ? dateFromToday(-1) : null,
      });
    }

    const deadlineTask = tasks['task-assignment'];
    await upsertNotification(tx, owner.id, 'deadline:task-assignment', {
      userId: owner.id, type: 'DEADLINE', taskId: deadlineTask.id, projectId: deadlineTask.projectId,
      message: `“${deadlineTask.title}” is due today.`, readAt: null,
    });
    const commentTask = tasks['dashboard-analytics'];
    await upsertNotification(tx, owner.id, 'comment:dashboard-analytics', {
      userId: owner.id, type: 'COMMENT', taskId: commentTask.id, projectId: commentTask.projectId,
      message: `${users.priya.fullName} commented on “${commentTask.title}”.`, readAt: dateFromToday(-1),
    });
    const completedTask = tasks['auth-page'];
    await upsertNotification(tx, owner.id, 'completed:auth-page', {
      userId: owner.id, type: 'TASK_COMPLETED', taskId: completedTask.id, projectId: completedTask.projectId,
      message: `“${completedTask.title}” has been marked completed.`, readAt: null,
    });
  }, { maxWait: 10000, timeout: 60000 });

  const summary = await prisma.project.findMany({
    where: { demoKey: { startsWith: `${demoPrefix}:${owner.id}:project:` } },
    select: { id: true, name: true, _count: { select: { tasks: true, members: true } } },
    orderBy: { id: 'asc' },
  });
  const taskCount = await prisma.task.count({ where: { demoKey: { startsWith: `${demoPrefix}:${owner.id}:task:` } } });
  const memberEmails = people.map(({ email }) => email);
  console.log(`Demo data is ready for ${owner.fullName} (${owner.email}).`);
  console.log(`${summary.length} projects, ${taskCount} tasks, ${people.length} demo teammates.`);
  for (const project of summary) console.log(`- ${project.name}: ${project._count.tasks} tasks, ${project._count.members} members`);
  console.log(`Teammate accounts: ${memberEmails.join(', ')}`);
  if (newAccounts.length) console.log(`Demo password for newly created teammate accounts: ${DEMO_PASSWORD}`);
  if (newAccounts.length < people.length) console.log('Any teammate accounts that already existed kept their original passwords.');
}

async function upsertActivity(tx, ownerId, key, data) {
  const demoKey = `${demoPrefix}:${ownerId}:activity:${key}`;
  return tx.activityLog.upsert({ where: { demoKey }, create: { ...data, demoKey }, update: data });
}

async function upsertNotification(tx, ownerId, key, data) {
  const demoKey = `${demoPrefix}:${ownerId}:notification:${key}`;
  const { readAt, ...fields } = data;
  return tx.notification.upsert({
    where: { demoKey },
    create: { ...fields, readAt, demoKey },
    update: fields,
  });
}

try {
  await run();
} catch (error) {
  console.error(`Demo data seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
