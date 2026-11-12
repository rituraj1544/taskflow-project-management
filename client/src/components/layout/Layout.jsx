import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, ChevronDown, FolderKanban, LayoutDashboard, LogOut, Menu, Search, UserRound, X, Columns3, Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { notificationApi, errorMessage } from '../../services/api.js';
import { Avatar } from '../common/UI.jsx';
import toast from 'react-hot-toast';

const navigation = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }, { to: '/projects', label: 'Projects', icon: FolderKanban }, { to: '/tasks?mine=true', label: 'My tasks', icon: CheckSquare }, { to: '/board', label: 'Kanban board', icon: Columns3 }] },
  { label: 'Workspace', items: [{ to: '/notifications', label: 'Notifications', icon: Bell }, { to: '/profile', label: 'My profile', icon: UserRound }] },
];

function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => notificationApi.list().then(({ data }) => alive && setUnread(data.unreadCount)).catch(() => {});
    load(); const timer = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);
  const signOut = async () => { try { await logout(); navigate('/login'); } catch (error) { toast.error(errorMessage(error)); } };
  return <aside className="sidebar-pattern flex h-full w-[260px] shrink-0 flex-col bg-navy px-4 pb-4 pt-6 text-white">
    <div className="mb-9 flex items-center justify-between px-2"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/25"><Command size={19}/></span><span className="font-display text-lg font-extrabold tracking-[-.05em]">taskflow<span className="text-brand-400">.</span></span></div><button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 lg:hidden"><X size={19}/></button></div>
    <div className="mb-7 rounded-2xl border border-white/10 bg-white/[.055] p-3.5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/45">Your workspace</p><div className="mt-3 flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm font-bold">T</span><span className="flex-1 text-sm font-semibold">Team Taskflow</span><ChevronDown size={14} className="text-white/40"/></div></div>
    <div className="flex-1 space-y-7">{navigation.map((group) => <div key={group.label}><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/35">{group.label}</p><div className="space-y-1">{group.items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-900/25' : 'text-white/65 hover:bg-white/[.07] hover:text-white'}`}><Icon size={17}/><span className="flex-1">{label}</span>{label === 'Notifications' && unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}</NavLink>)}</div></div>)}</div>
    <div className="border-t border-white/10 pt-4"><div className="flex items-center gap-2.5 rounded-xl px-2 py-2"><Avatar name={user?.fullName} size="sm" className="!bg-brand-500 !text-white"/><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{user?.fullName}</span><span className="block truncate text-[10px] text-white/45">{user?.email}</span></span><button onClick={signOut} title="Sign out" className="rounded-lg p-2 text-white/45 transition hover:bg-white/10 hover:text-white"><LogOut size={16}/></button></div></div>
  </aside>;
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const section = navigation.flatMap((group) => group.items).find((item) => item.to.split('?')[0] === location.pathname)?.label || 'Project workspace';
  const submitSearch = (event) => { event.preventDefault(); navigate(`/tasks${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`); };
  return <div className="min-h-screen bg-canvas lg:flex">
    <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar/></div>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]"/><div className="relative h-full w-[275px] shadow-2xl"><Sidebar onClose={() => setOpen(false)}/></div></div>}
    <main className="min-w-0 flex-1 lg:pl-[260px]">
      <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-line/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
        <div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-xl border border-line p-2 text-ink lg:hidden"><Menu size={18}/></button><div className="hidden items-center gap-2 text-sm text-muted sm:flex"><span>Workspace</span><span className="text-slate-300">/</span><span className="font-semibold text-ink">{section}</span></div><span className="font-display text-base font-extrabold tracking-[-.05em] text-ink sm:hidden">taskflow<span className="text-brand-500">.</span></span></div>
        <div className="flex items-center gap-2.5 sm:gap-4">
          <form onSubmit={submitSearch} className="hidden h-9 w-52 items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-muted md:flex"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"/><kbd className="rounded border border-line bg-white px-1 py-0.5 text-[9px]">⌕</kbd></form>
          <button onClick={() => navigate('/notifications')} className="relative rounded-xl p-2 text-muted transition hover:bg-canvas hover:text-ink"><Bell size={18}/></button>
          <div className="hidden h-7 w-px bg-line sm:block"/><button onClick={() => navigate('/profile')} className="flex items-center gap-2.5"><Avatar name={user?.fullName} size="sm"/><span className="hidden text-left sm:block"><span className="block text-xs font-bold text-ink">{user?.fullName?.split(' ')[0]}</span><span className="block text-[10px] text-muted">My account</span></span></button>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:px-9 lg:py-8"><Outlet/></div>
    </main>
  </div>;
}
