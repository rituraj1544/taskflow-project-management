# TaskFlow

TaskFlow is a full-stack team project and task manager built with React, Express, Prisma and MySQL. Teams can organize work into projects, assign tasks, track progress on a Kanban board, and discuss tasks in one place.

## Features

- Email and password registration, login and logout with bcrypt password hashing and an HTTP-only JWT cookie.
- Project membership with owner, manager and member roles enforced by the API.
- Project, member, task and comment create/read/update/delete workflows.
- Task assignment, priorities, due dates, status changes, search, filters, sorting and pagination.
- Drag tasks across a Kanban board; each move is saved through the API.
- Dashboard counts and charts queried from MySQL, with upcoming work and recent activity.
- Database-backed assignment, deadline, completion and team membership notifications.
- Responsive workspace, profile management, password change and toast feedback.

## Technology

- **Client:** React 19, Vite, React Router, Tailwind CSS, Axios, Recharts, dnd-kit, Lucide and React Hot Toast.
- **Server:** Node.js ES modules, Express 5, Prisma ORM 6, Zod, bcryptjs, JWT, Helmet, CORS and Morgan.
- **Database:** MySQL 8.4.

## Architecture

```text
client/                 React application
  src/components/       Shared UI, layout and task components
  src/context/           Authentication state
  src/pages/             Auth, dashboard, project, task, profile pages
  src/services/          Axios client and API methods
server/
  prisma/schema.prisma   Relational schema
  prisma/migrations/     Versioned SQL schema changes
  prisma/seed.js         Optional demo workspace data
  prisma/seed-demo.js    Idempotent demo data for an existing account
  src/controllers/       HTTP request handlers
  src/middleware/        Authentication, validation, error handling
  src/routes/            REST route definitions
  src/services/          Project access, activity and notifications
  src/validators/        Zod request schemas
```

### Database relationships

```mermaid
erDiagram
  USER ||--o{ PROJECT : owns
  USER ||--o{ PROJECT_MEMBER : joins
  PROJECT ||--o{ PROJECT_MEMBER : includes
  PROJECT ||--o{ TASK : contains
  USER ||--o{ TASK : creates
  USER o|--o{ TASK : receives
  TASK ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes
  USER ||--o{ NOTIFICATION : receives
  PROJECT ||--o{ ACTIVITY_LOG : records
  USER o|--o{ ACTIVITY_LOG : performs
```

`ProjectMember` has a unique `(projectId, userId)` constraint. Tasks, comments, notifications and activity records have indexes for project, assignee, status, read state and creation time. Project ownership is separate from membership so the owner cannot accidentally lose ownership by changing a team role.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm.
- MySQL 8.4 running locally or remotely.

## Install and configure

1. Install the workspace dependencies:

   ```bash
   npm install
   ```

2. Create a MySQL database. For a local MySQL shell:

   ```sql
   CREATE DATABASE taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

   The MySQL account configured in `server/.env` needs permission to create and update tables in this database. Use an app-specific database user with limited privileges outside local development.

3. Copy `server/.env.example` to `server/.env`, then set the connection URL, a private random JWT secret, the client origin and port:

   ```dotenv
   DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/taskflow_db"
   JWT_SECRET="replace_with_a_long_random_secret_at_least_32_characters"
   CLIENT_URL="http://localhost:5173"
   PORT=5000
   NODE_ENV="development"
   ```

   Percent-encode reserved characters in the URL password (for example `@` becomes `%40`). Keep `server/.env` private; it is ignored by Git. The frontend can use `client/.env` with `VITE_API_URL=http://localhost:5000/api` if the API is hosted elsewhere.

4. Generate the Prisma client, create/apply the initial migration, and optionally create the original sample workspace:

   ```bash
   npm run db:generate -w server
   npm run db:migrate -w server -- --name init
   npm run db:seed -w server
   ```

   Use `npm run db:deploy -w server` to apply committed migrations in production. `npm run db:studio -w server` opens Prisma Studio.

5. Start the API and client together (Terminal):

   ```bash
   npm run dev
   ```

   The client is at <http://localhost:5173> and the API health check is at <http://localhost:5000/api/health>. Run `npm run build` to create the production client bundle.

## Demo accounts

Run the seed command to create these development accounts. They all use `TaskflowDemo2026!` as their password:

| Role | Email |
| --- | --- |
| Owner | `alex@taskflow.demo` |
| Manager | `jamie@taskflow.demo` |
| Member | `sam@taskflow.demo` |

The original seed script is idempotent for Alex's sample project. To populate a workspace for an account you already registered, explicitly run:

```bash
npm run db:seed:demo -- --email="your-login@email.com"
```

You can also set `DEMO_OWNER_EMAIL` and run `npm run db:seed:demo`. This creates three projects, 15 tasks, four safe `.test` teammate accounts, comments, activity history and read/unread notifications. It assigns the projects to the target account and gives that owner open tasks, so the dashboard is populated. The operation uses stable demo keys and upserts, preserves existing user passwords and unrelated records, and refuses to run with `NODE_ENV=production`. It is never run automatically by migrations.

New teammate accounts use the development password `TaskflowDemo2026!`; an account that already existed keeps its own password. The seed assigns different teammates to different projects, so memberships continue to enforce project-level access.

## API overview

All routes are under `/api`. Authentication is carried by the `taskflow_token` HTTP-only cookie. Validation errors return status `400` with field details; unauthenticated and unauthorized requests return `401` and `403`; inaccessible project IDs return `404`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/change-password` |
| Users | `GET /users/profile`, `PATCH /users/profile`, `GET /users/search?q=` |
| Projects | `GET /projects`, `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id` |
| Project members | `GET /projects/:id/members`, `POST /projects/:id/members`, `PATCH /projects/:id/members/:memberId`, `DELETE /projects/:id/members/:memberId` |
| Tasks | `GET /tasks` (filters: `projectId`, `mine`, `status`, `priority`, `q`, `sort`, `page`, `limit`), `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `PATCH /tasks/:id/status`, `DELETE /tasks/:id` |
| Comments | `GET/POST /tasks/:id/comments`, `PATCH/DELETE /comments/:id` |
| Dashboard | `GET /dashboard/stats`, `/dashboard/recent-projects`, `/dashboard/my-tasks`, `/dashboard/upcoming`, `/dashboard/activity` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |

## Roles

- **Owner:** controls project details and membership and manages every task.
- **Manager:** creates, assigns and updates project tasks.
- **Member:** sees their accessible projects, updates their assigned task status, and comments on project tasks.

The server checks membership and role before serving or changing project data. Frontend controls only reflect these permissions; they do not grant access.

## Testing

With the development database configured and migrated, run:

```bash
npm test
```

The Node test runner exercises registration, project membership, task assignment and status updates, comments, notifications, dashboard access and logout. Test records use unique addresses and are removed after the run.

For manual API exploration, import `postman/TaskFlow API.postman_collection.json` and `postman/TaskFlow Local.postman_environment.json`. Select the local environment, run **Login**, then use the project and task requests in order. The collection stores the created IDs in the environment as it runs.

## Screenshots

Add screenshots here after running the application.

## Deployment notes

Build the client with `npm run build` and deploy the `client/dist` output to a static host. Deploy the Express server separately, set the production environment variables, and run `npm run db:deploy -w server` as a release step. The browser origin must match `CLIENT_URL`. Use HTTPS, a strong unique `JWT_SECRET`, and a dedicated database account in production. Keep the client and API on the same site for the configured `SameSite=Lax` authentication cookie.
