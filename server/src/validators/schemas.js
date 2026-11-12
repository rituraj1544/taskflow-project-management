import { z } from 'zod';

const optionalDate = z.union([z.null(), z.coerce.date()]).optional();
const projectStatuses = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'];
const taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
  confirmPassword: z.string().min(8).max(72),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export const loginSchema = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(1).max(72) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(8).max(72) });
export const profileSchema = z.object({ fullName: z.string().trim().min(2).max(120), email: z.email().trim().toLowerCase() }).partial();

const projectFields = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().max(5000).nullable().optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  status: z.enum(projectStatuses).optional(),
});
const validProjectDates = (value) => !value.startDate || !value.endDate || value.startDate <= value.endDate;
export const projectSchema = projectFields.refine(validProjectDates, { path: ['endDate'], message: 'End date must be after the start date.' });
export const projectUpdateSchema = projectFields.partial().refine(validProjectDates, { path: ['endDate'], message: 'End date must be after the start date.' });
export const addMemberSchema = z.object({ email: z.email().trim().toLowerCase(), role: z.enum(['MANAGER', 'MEMBER']).default('MEMBER') });
export const memberRoleSchema = z.object({ role: z.enum(['MANAGER', 'MEMBER']) });

export const taskSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().max(5000).nullable().optional(),
  projectId: z.coerce.number().int().positive(),
  assigneeId: z.union([z.null(), z.coerce.number().int().positive()]).optional(),
  priority: z.enum(priorities).default('MEDIUM'),
  status: z.enum(taskStatuses).default('TODO'),
  dueDate: optionalDate,
});
export const taskUpdateSchema = taskSchema.omit({ projectId: true }).partial();
export const statusSchema = z.object({ status: z.enum(taskStatuses) });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(4000) });
