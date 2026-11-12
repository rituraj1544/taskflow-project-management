import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban } from 'lucide-react';
import { initials, titleCase } from '../../utils/format.js';

const palette = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
export function Avatar({ name, size = 'md', className = '' }) {
  const color = palette[(name || '').length % palette.length];
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${color} ${sizes[size]} ${className}`}>{initials(name)}</span>;
}

const statusStyles = {
  PLANNING: 'bg-slate-100 text-slate-600', ACTIVE: 'bg-emerald-50 text-emerald-700', ON_HOLD: 'bg-amber-50 text-amber-700', COMPLETED: 'bg-blue-50 text-blue-700',
  TODO: 'bg-slate-100 text-slate-600', IN_PROGRESS: 'bg-blue-50 text-blue-700', IN_REVIEW: 'bg-violet-50 text-violet-700',
  LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-blue-50 text-blue-700', HIGH: 'bg-amber-50 text-amber-700', URGENT: 'bg-rose-50 text-rose-700',
};
export function Badge({ value, dot = false }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[value] || 'bg-slate-100 text-slate-600'}`}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{titleCase(value || 'Unknown')}
  </span>;
}

export function PageHeading({ eyebrow, title, description, action, children }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>{eyebrow && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-brand-600">{eyebrow}</p>}
      <h1 className="font-display text-2xl font-extrabold tracking-[-.04em] text-ink sm:text-[30px]">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
    </div>
    {action || children}
  </div>;
}

export function Card({ children, className = '' }) { return <section className={`rounded-2.5xl border border-line bg-white shadow-card ${className}`}>{children}</section>; }
export function SectionTitle({ title, action, className = '' }) { return <div className={`mb-4 flex items-center justify-between ${className}`}><h2 className="font-display text-[15px] font-bold tracking-tight text-ink">{title}</h2>{action}</div>; }
export function Loading({ label = 'Loading your workspace…' }) { return <div className="grid min-h-[42vh] place-items-center"><div className="text-center"><span className="mx-auto mb-4 block h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-500"/><p className="text-sm text-muted">{label}</p></div></div>; }
export function EmptyState({ title, description, action, icon: Icon = FolderKanban }) { return <div className="grid min-h-64 place-items-center px-5 py-12 text-center"><div className="max-w-sm"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={21}/></span><h3 className="font-display text-base font-bold text-ink">{title}</h3><p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div></div>; }
export function Button({ as: Component = 'button', to, variant = 'primary', size = 'md', className = '', children, ...props }) {
  const styles = {
    primary: 'bg-brand-500 text-white shadow-[0_5px_14px_rgba(65,105,245,.2)] hover:bg-brand-600',
    secondary: 'border border-line bg-white text-ink hover:bg-slate-50',
    ghost: 'text-muted hover:bg-slate-100 hover:text-ink', danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-11 px-5 text-sm' };
  const shared = { className: `inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${sizes[size]} ${className}`, ...props };
  return to ? <Link to={to} {...shared}>{children}</Link> : <Component {...shared}>{children}</Component>;
}
export function ProjectLink({ project }) {
  const total = project._count?.tasks || 0;
  const progress = total ? Math.round((project.completedCount || 0) / total * 100) : 0;
  return <Link to={`/projects/${project.id}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-canvas">
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><FolderKanban size={18}/></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-ink">{project.name}</span>
      <span className="mt-1 flex items-center justify-between gap-3 text-[10px] text-muted"><span>{total} tasks · {titleCase(project.status)}</span><span className="font-bold">{progress}%</span></span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }}/></span>
    </span><ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-brand-500"/>
  </Link>;
}
