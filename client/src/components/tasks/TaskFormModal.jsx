import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi, errorMessage } from '../../services/api.js';
import { Button } from '../common/UI.jsx';

const field = 'mt-1.5 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50';
export default function TaskFormModal({ project, members = [], onClose, onCreated }) {
  const [values, setValues] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [busy, setBusy] = useState(false);
  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      await tasksApi.create({ ...values, projectId: Number(project.id), assigneeId: values.assigneeId ? Number(values.assigneeId) : null, dueDate: values.dueDate || null });
      toast.success('Task created.'); onCreated?.(); onClose();
    } catch (error) { toast.error(errorMessage(error, 'Could not create the task.')); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/45 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="w-full max-w-lg animate-enter rounded-2.5xl bg-white p-6 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-brand-600">{project.name}</p><h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">Create a task</h2></div><button onClick={onClose} className="rounded-xl p-2 text-muted hover:bg-canvas"><X size={18}/></button></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-bold">Task title<input name="title" autoFocus required minLength={2} maxLength={180} value={values.title} onChange={update} placeholder="What needs to get done?" className={field}/></label>
        <label className="block text-xs font-bold">Description <span className="font-normal text-muted">(optional)</span><textarea name="description" rows="3" value={values.description} onChange={update} placeholder="Add a little more context…" className={`${field} h-auto py-2.5`}/></label>
        <div className="grid gap-4 sm:grid-cols-3"><label className="block text-xs font-bold">Priority<select name="priority" value={values.priority} onChange={update} className={field}>{['LOW','MEDIUM','HIGH','URGENT'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-xs font-bold">Due date<input type="date" name="dueDate" value={values.dueDate} onChange={update} className={field}/></label><label className="block text-xs font-bold">Assignee<select name="assigneeId" value={values.assigneeId} onChange={update} className={field}><option value="">Unassigned</option>{members.map(({ user }) => <option value={user.id} key={user.id}>{user.fullName}</option>)}</select></label></div>
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create task'}</Button></div>
      </form>
    </div>
  </div>;
}
