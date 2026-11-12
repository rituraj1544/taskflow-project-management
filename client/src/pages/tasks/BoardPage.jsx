import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Columns3, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsApi, tasksApi, errorMessage } from '../../services/api.js';
import { Avatar, Badge, Button, Card, Loading, PageHeading } from '../../components/common/UI.jsx';
import { shortDate, titleCase } from '../../utils/format.js';

const columns = [{ id: 'TODO', label: 'To do', color: 'bg-slate-400' }, { id: 'IN_PROGRESS', label: 'In progress', color: 'bg-brand-500' }, { id: 'IN_REVIEW', label: 'In review', color: 'bg-violet' }, { id: 'COMPLETED', label: 'Completed', color: 'bg-mint' }];

function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(task.id) });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return <article ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none cursor-grab rounded-2xl border border-line bg-white p-3.5 shadow-[0_4px_14px_rgba(24,42,78,.035)] transition hover:border-brand-100 hover:shadow-card active:cursor-grabbing"><div className="mb-2 flex items-start justify-between gap-2"><Badge value={task.priority}/><GripVertical size={14} className="mt-0.5 text-slate-300"/></div><Link onClick={(e) => e.stopPropagation()} to={`/tasks/${task.id}`} className="block text-xs font-bold leading-5 text-ink hover:text-brand-600">{task.title}</Link><p className="mt-1 truncate text-[10px] text-muted">{task.project.name}</p><div className="mt-3 flex items-center justify-between border-t border-line pt-2.5"><span className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted">{task.assignee ? <><Avatar name={task.assignee.fullName} size="sm" className="!h-6 !w-6 !text-[8px]"/><span className="max-w-24 truncate">{task.assignee.fullName.split(' ')[0]}</span></> : 'Unassigned'}</span><span className="flex items-center gap-1 text-[9px] text-muted">{task.dueDate && <><CalendarDays size={11}/>{shortDate(task.dueDate)}</>}</span></div></article>;
}

function BoardColumn({ column, items }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return <section ref={setNodeRef} className={`flex min-h-[430px] min-w-[260px] flex-col rounded-2xl border p-3 transition ${isOver ? 'border-brand-200 bg-brand-50/60' : 'border-line bg-slate-100/55'}`}><div className="mb-3 flex items-center gap-2 px-1"><span className={`h-2 w-2 rounded-full ${column.color}`}/><h2 className="flex-1 text-xs font-bold text-ink">{column.label}</h2><span className="grid h-5 min-w-5 place-items-center rounded-md bg-white px-1 text-[10px] font-bold text-muted">{items.length}</span></div><div className="flex flex-1 flex-col gap-2.5">{items.map((task) => <TaskCard key={task.id} task={task}/>)}{!items.length && <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-slate-200 text-[10px] text-slate-400">Drop a task here</div>}</div></section>;
}

export default function BoardPage() {
  const [params, setParams] = useSearchParams(); const selected = params.get('projectId') || ''; const [projects, setProjects] = useState([]); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }));
  const load = useCallback(async () => { setLoading(true); try { const [projectResult, taskResult] = await Promise.all([projectsApi.list(), tasksApi.list({ limit: 100, ...(selected ? { projectId: Number(selected) } : {}) })]); setProjects(projectResult.data.projects); setTasks(taskResult.data.tasks); } catch (error) { toast.error(errorMessage(error, 'Could not load the board.')); } finally { setLoading(false); } }, [selected]);
  useEffect(() => { load(); }, [load]);
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.id, tasks.filter((task) => task.status === column.id)])), [tasks]);
  const projectChange = (event) => { const next = new URLSearchParams(params); if (event.target.value) next.set('projectId', event.target.value); else next.delete('projectId'); setParams(next); };
  const move = async ({ active, over }) => {
    if (!over || saving) return;
    const destination = String(over.id); const id = Number(active.id); const task = tasks.find((item) => item.id === id);
    if (!task || !columns.some((column) => column.id === destination) || destination === task.status) return;
    setTasks((current) => current.map((item) => item.id === id ? { ...item, status: destination } : item)); setSaving(true);
    try { await tasksApi.status(id, destination); toast.success(`Moved to ${titleCase(destination)}.`); }
    catch (error) { toast.error(errorMessage(error, 'Could not move that task.')); await load(); }
    finally { setSaving(false); }
  };
  if (loading) return <Loading label="Loading your Kanban board…"/>;
  return <div className="animate-enter"><PageHeading eyebrow="See the whole picture" title="Kanban board" description="Drag tasks between columns to update their status." action={<label className="text-[10px] font-bold text-muted">Project<select value={selected} onChange={projectChange} className="ml-2 h-9 max-w-44 rounded-xl border border-line bg-white px-2.5 text-xs font-semibold text-ink outline-none"><option value="">All projects</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>}/>
    {tasks.length === 0 ? <Card className="mb-4"><div className="p-12 text-center"><Columns3 size={24} className="mx-auto text-brand-500"/><h2 className="mt-3 font-display font-bold">A clear board, ready for your work</h2><p className="mt-1 text-xs text-muted">Create tasks in a project, then move them through your team’s workflow.</p><Button to="/projects" variant="secondary" size="sm" className="mt-4">Browse projects</Button></div></Card> : <DndContext sensors={sensors} onDragEnd={move}><div className="scrollbar-none flex gap-3 overflow-x-auto pb-3">{columns.map((column) => <div className="w-[280px] shrink-0 sm:w-[300px]" key={column.id}><BoardColumn column={column} items={grouped[column.id]}/></div>)}</div></DndContext>}
    {saving && <div className="fixed bottom-5 right-5 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white shadow-xl">Saving task status…</div>}
  </div>;
}
