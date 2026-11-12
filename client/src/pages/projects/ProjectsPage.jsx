import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban, Plus, Search, Users } from 'lucide-react';
import { projectsApi, errorMessage } from '../../services/api.js';
import { Badge, Button, Card, EmptyState, Loading, PageHeading } from '../../components/common/UI.jsx';
import { dateLabel, titleCase } from '../../utils/format.js';
import toast from 'react-hot-toast';

const statusOptions = ['ALL', 'ACTIVE', 'PLANNING', 'ON_HOLD', 'COMPLETED'];
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [status, setStatus] = useState('ALL');
  const load = () => projectsApi.list().then(({ data }) => setProjects(data.projects)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => projects.filter((project) => (status === 'ALL' || project.status === status) && project.name.toLowerCase().includes(query.toLowerCase())), [projects, query, status]);
  if (loading) return <Loading label="Loading your projects…"/>;
  return <div className="animate-enter">
    <PageHeading eyebrow="Your work, together" title="Projects" description={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'} across your workspace.`} action={<Button to="/projects/new"><Plus size={16}/> New project</Button>}/>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">{statusOptions.map((item) => <button key={item} onClick={() => setStatus(item)} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${status === item ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{item === 'ALL' ? 'All projects' : titleCase(item)}</button>)}</div><label className="flex h-9 w-full items-center gap-2 rounded-xl border border-line bg-white px-3 text-muted sm:w-56"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project…" className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"/></label></div>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((project, index) => {
      const progress = project._count.tasks ? Math.round((project.completedCount || 0) / project._count.tasks * 100) : 0;
      return <Link to={`/projects/${project.id}`} key={project.id} style={{ animationDelay: `${index * 45}ms` }} className="group animate-enter rounded-2.5xl border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift sm:p-6">
        <div className="mb-5 flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white"><FolderKanban size={19}/></span><Badge value={project.status}/></div>
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">{project.name}</h2><p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{project.description || 'A shared space for your team to plan and make progress.'}</p>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4"><span className="inline-flex items-center gap-1.5 text-[11px] text-muted"><FolderKanban size={13}/>{project._count.tasks} tasks</span><span className="inline-flex items-center gap-1.5 text-[11px] text-muted"><Users size={13}/>{project._count.members} people</span><span className="ml-auto text-[10px] text-muted">Updated {dateLabel(project.updatedAt, { month: 'short', day: 'numeric' })}</span><ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-brand-500"/></div>
        <div className="mt-4"><div className="mb-1.5 flex justify-between text-[10px] font-semibold text-muted"><span>Project progress</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }}/></div></div>
      </Link>;
    })}</div> : <Card><EmptyState icon={FolderKanban} title={query || status !== 'ALL' ? 'No matching projects' : 'Start your first project'} description={query || status !== 'ALL' ? 'Try another name or status filter.' : 'Create a project to bring your team and work together.'} action={!query && status === 'ALL' && <Button to="/projects/new"><Plus size={15}/> Create project</Button>}/></Card>}
  </div>;
}
