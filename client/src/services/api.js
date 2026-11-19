import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => error?.response?.data?.error || error?.response?.data?.message || fallback;

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.patch('/auth/change-password', data),
};
export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMember: (id, memberId, data) => api.patch(`/projects/${id}/members/${memberId}`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
};
export const tasksApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  status: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  remove: (id) => api.delete(`/tasks/${id}`),
  comments: (id) => api.get(`/tasks/${id}/comments`),
  addComment: (id, body) => api.post(`/tasks/${id}/comments`, { body }),
  updateComment: (id, body) => api.patch(`/comments/${id}`, { body }),
  removeComment: (id) => api.delete(`/comments/${id}`),
};
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  projects: () => api.get('/dashboard/recent-projects'),
  tasks: () => api.get('/dashboard/my-tasks'),
  activity: () => api.get('/dashboard/activity'),
  upcoming: () => api.get('/dashboard/upcoming'),
};
export const notificationApi = {
  list: () => api.get('/notifications'),
  read: (id) => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};
export const usersApi = {
  update: (data) => api.patch('/users/profile', data),
  search: (q) => api.get('/users/search', { params: { q } }),
};
