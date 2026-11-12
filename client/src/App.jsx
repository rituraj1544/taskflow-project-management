import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Loading } from './components/common/UI.jsx';

const Layout = lazy(() => import('./components/layout/Layout.jsx'));
const LoginPage = lazy(() => import('./pages/auth/AuthPages.jsx').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/AuthPages.jsx').then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.jsx'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage.jsx'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage.jsx'));
const ProjectFormPage = lazy(() => import('./pages/projects/ProjectFormPage.jsx'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage.jsx'));
const TaskDetailPage = lazy(() => import('./pages/tasks/TaskDetailPage.jsx'));
const BoardPage = lazy(() => import('./pages/tasks/BoardPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage.jsx'));

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <Loading/>;
  return user ? <Outlet/> : <Navigate to="/login" replace/>;
}

export default function App() {
  return <Suspense fallback={<Loading label="Opening your workspace…"/>}><Routes>
    <Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/>
    <Route element={<Protected/>}><Route element={<Layout/>}>
      <Route index element={<DashboardPage/>}/><Route path="projects" element={<ProjectsPage/>}/><Route path="projects/new" element={<ProjectFormPage/>}/><Route path="projects/:id/edit" element={<ProjectFormPage/>}/><Route path="projects/:id" element={<ProjectDetailPage/>}/>
      <Route path="tasks" element={<TasksPage/>}/><Route path="tasks/:id" element={<TaskDetailPage/>}/><Route path="board" element={<BoardPage/>}/>
      <Route path="notifications" element={<NotificationsPage/>}/><Route path="profile" element={<ProfilePage/>}/>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense>;
}
