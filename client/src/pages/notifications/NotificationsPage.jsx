import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Check, CheckCheck, CircleCheck, FolderKanban, ListTodo, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi, errorMessage } from '../../services/api.js';
import { Badge, Button, Card, EmptyState, Loading, PageHeading } from '../../components/common/UI.jsx';
import { dateLabel } from '../../utils/format.js';

const iconFor = (type) => ({ TASK_ASSIGNED: ListTodo, DEADLINE: BellRing, TASK_COMPLETED: CircleCheck, PROJECT_MEMBER: UserPlus }[type] || FolderKanban);
export default function NotificationsPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const load = useCallback(() => notificationApi.list().then(({ data: next }) => setData(next)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  const markRead = async (id) => { try { await notificationApi.read(id); setData((current) => ({ ...current, unreadCount: Math.max(0, current.unreadCount - 1), notifications: current.notifications.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item) })); } catch (error) { toast.error(errorMessage(error)); } };
  const readAll = async () => { try { await notificationApi.readAll(); await load(); toast.success('All caught up.'); } catch (error) { toast.error(errorMessage(error)); } };
  if (loading) return <Loading label="Checking your notifications…"/>;
  return <div className="mx-auto max-w-3xl animate-enter"><PageHeading eyebrow="A little heads-up" title="Notifications" description="Stay in the loop on assignments, deadlines and project updates." action={data?.unreadCount > 0 && <Button variant="secondary" size="sm" onClick={readAll}><CheckCheck size={14}/> Mark all read</Button>}/><Card className="overflow-hidden">{data?.notifications.length ? <div className="divide-y divide-line">{data.notifications.map((item) => { const Icon = iconFor(item.type); const content = <div className={`flex flex-1 items-start gap-3.5 px-4 py-4 sm:px-5 ${item.readAt ? '' : 'bg-brand-50/40'}`}><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.type === 'DEADLINE' ? 'bg-amber-50 text-amber' : 'bg-brand-50 text-brand-600'}`}><Icon size={17}/></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold leading-5 text-ink">{item.message}</p><div className="mt-1.5 flex items-center gap-2"><Badge value={item.type}/><span className="text-[10px] text-muted">{dateLabel(item.createdAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></div></div>{!item.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500"/>}{!item.readAt && <button aria-label="Mark notification as read" onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(item.id); }} className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-brand-600"><Check size={14}/></button>}</div>;
    return item.taskId ? <Link to={`/tasks/${item.taskId}`} onClick={() => !item.readAt && markRead(item.id)} key={item.id} className="block transition hover:bg-canvas">{content}</Link> : item.projectId ? <Link to={`/projects/${item.projectId}`} onClick={() => !item.readAt && markRead(item.id)} key={item.id} className="block transition hover:bg-canvas">{content}</Link> : <div key={item.id}>{content}</div>;
  })}</div> : <EmptyState icon={Bell} title="You’re all caught up" description="When something needs your attention, it’ll show up here."/>}</Card></div>;
}
