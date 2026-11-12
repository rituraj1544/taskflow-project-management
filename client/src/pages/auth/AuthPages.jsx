import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Command, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../services/api.js';

function AuthShell({ mode, children }) {
  const isLogin = mode === 'login';
  return <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.02fr_.98fr]">
    <div className="relative hidden overflow-hidden bg-navy px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
      <div className="absolute -right-32 -top-20 h-[520px] w-[520px] rounded-full border border-white/[.07]"/><div className="absolute -right-12 top-0 h-[380px] w-[380px] rounded-full border border-white/[.06]"/><div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-brand-500/25 blur-[90px]"/>
      <Link to="/login" className="relative flex w-fit items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500"><Command size={19}/></span><span className="font-display text-xl font-extrabold tracking-[-.05em]">taskflow<span className="text-brand-400">.</span></span></Link>
      <div className="relative max-w-lg pb-14"><span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[11px] font-semibold text-white/75"><Sparkles size={13} className="text-amber"/> A calmer way to get things done</span><h1 className="font-display text-[42px] font-extrabold leading-[1.12] tracking-[-.055em] xl:text-[50px]">Good work happens<br/><span className="text-brand-400">in the flow.</span></h1><p className="mt-5 max-w-sm text-sm leading-7 text-white/55">Bring your projects, people and next steps together. Spend less time chasing updates and more time making progress.</p>
        <div className="mt-10 flex items-center gap-4"><div className="flex -space-x-2">{['AM','JC','SR','KT'].map((person, i) => <span key={person} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-navy text-[9px] font-bold text-white ${['bg-brand-500','bg-violet','bg-mint','bg-coral'][i]}`}>{person}</span>)}</div><div><div className="flex gap-0.5 text-amber">{'★★★★★'.split('').map((star, i) => <span key={i}>{star}</span>)}</div><p className="text-[10px] text-white/50">Loved by teams that ship</p></div></div>
      </div><p className="relative text-[10px] text-white/30">© 2026 TaskFlow workspace</p>
    </div>
    <div className="grid min-h-screen place-items-center px-5 py-10 sm:px-8"><div className="w-full max-w-[420px]">
      <div className="mb-9 flex items-center gap-2.5 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white"><Command size={19}/></span><span className="font-display text-xl font-extrabold tracking-[-.05em]">taskflow<span className="text-brand-500">.</span></span></div>
      <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.15em] text-brand-600">{isLogin ? 'Welcome back' : 'Get started for free'}</p><h2 className="font-display text-[30px] font-extrabold tracking-[-.05em] text-ink">{isLogin ? 'Sign in to TaskFlow' : 'Create your account'}</h2><p className="mt-2 text-sm text-muted">{isLogin ? 'Pick up where your team left off.' : 'A better way to keep your team in sync.'}</p></div>{children}
      <p className="mt-8 text-center text-xs text-slate-400">By continuing, you agree to our <span className="font-semibold text-slate-600">Terms</span> and <span className="font-semibold text-slate-600">Privacy Policy</span>.</p>
    </div></div>
  </div>;
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, required = true }) {
  const [show, setShow] = useState(false);
  const password = type === 'password';
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">{label}</span><span className="relative block"><input required={required} type={password && show ? 'text' : type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-50"/>{password && <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}</span></label>;
}

export function LoginPage() {
  const { user, login } = useAuth(); const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' }); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace/>;
  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await login(values); toast.success('You’re signed in.'); navigate('/'); } catch (error) { toast.error(errorMessage(error, 'Could not sign in.')); } finally { setBusy(false); } };
  return <AuthShell mode="login"><form onSubmit={submit} className="space-y-5"><Field label="Email address" type="email" value={values.email} onChange={change('email')} placeholder="you@company.com" autoComplete="email"/><Field label="Password" type="password" value={values.password} onChange={change('password')} placeholder="Enter your password" autoComplete="current-password"/><div className="flex items-center justify-between"><label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="rounded border-line text-brand-500 focus:ring-brand-500"/> Remember me</label><span className="text-xs font-bold text-brand-600">Secure sign in <LockKeyhole size={12} className="ml-1 inline"/></span></div><button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight size={16}/>}</button></form><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-line"/><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">New to TaskFlow?</span><span className="h-px flex-1 bg-line"/></div><Link to="/register" className="flex h-11 w-full items-center justify-center rounded-xl border border-line text-sm font-bold text-ink transition hover:bg-canvas">Create an account</Link></AuthShell>;
}

export function RegisterPage() {
  const { user, register } = useAuth(); const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: '', email: '', password: '', confirmPassword: '' }); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace/>;
  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); if (values.password !== values.confirmPassword) return toast.error('Your passwords don’t match.'); setBusy(true); try { await register(values); toast.success('Your workspace is ready.'); navigate('/'); } catch (error) { toast.error(errorMessage(error, 'Could not create your account.')); } finally { setBusy(false); } };
  return <AuthShell mode="register"><form onSubmit={submit} className="space-y-4"><Field label="Full name" value={values.fullName} onChange={change('fullName')} placeholder="Alex Morgan" autoComplete="name"/><Field label="Work email" type="email" value={values.email} onChange={change('email')} placeholder="you@company.com" autoComplete="email"/><Field label="Password" type="password" value={values.password} onChange={change('password')} placeholder="At least 8 characters" autoComplete="new-password"/><Field label="Confirm password" type="password" value={values.confirmPassword} onChange={change('confirmPassword')} placeholder="Enter it one more time" autoComplete="new-password"/><p className="flex items-center gap-1.5 text-[11px] text-muted"><Check size={13} className="text-mint"/> Use at least 8 characters to keep your account secure.</p><button disabled={busy} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50">{busy ? 'Creating your account…' : 'Create account'} {!busy && <ArrowRight size={16}/>}</button></form><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-line"/><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Already a member?</span><span className="h-px flex-1 bg-line"/></div><Link to="/login" className="flex h-11 w-full items-center justify-center rounded-xl border border-line text-sm font-bold text-ink transition hover:bg-canvas">Sign in instead</Link></AuthShell>;
}
