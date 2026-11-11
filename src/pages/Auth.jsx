import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'
import { categories } from '../constants/categories'

const HOME = { customer: '/client/overview', merchant: '/merchant/overview', admin: '/admin/overview', 'super-admin': '/admin/overview' }
const field = 'w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--red)]'
const catName = (c) => (Array.isArray(c) ? c[0] : typeof c === 'string' ? c : c.name)
const F = ({ label, children }) => <label className="block text-sm font-semibold">{label}<div className="mt-1 font-normal">{children}</div></label>

export default function Auth({ role }) {
  const { state, registerCustomer, registerMerchant, signInWithPassword } = useAppState(), nav = useNavigate(), isM = role === 'merchant'
  const [mode, setMode] = useState('signup'), [step, setStep] = useState(1), [err, setErr] = useState('')
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', business: '', address: '', description: '', cats: [] })
  const set = (k) => (e) => { setErr(''); setF({ ...f, [k]: e.target.value }) }
  if (state.session) return <Navigate to={HOME[state.session.role] || '/login'} replace />

  const signIn = (e) => { e.preventDefault(); const u = signInWithPassword(role, f.email, f.password); if (!u) return setErr('Wrong email or password for this path.'); nav(HOME[role]) }
  const finish = () => {
    const r = isM ? registerMerchant({ ownerName: f.name, email: f.email, password: f.password, phone: f.phone, businessName: f.business, address: f.address, description: f.description, categories: f.cats }) : registerCustomer({ name: f.name, email: f.email, phone: f.phone, password: f.password })
    if (!r.ok) { setErr(r.error); if (isM && /name|phone|address|business/i.test(r.error)) setStep(1); else if (isM && /categor/i.test(r.error)) setStep(2); return }
    nav(HOME[role])
  }
  const toggle = (c) => setF({ ...f, cats: f.cats.includes(c) ? f.cats.filter((x) => x !== c) : [...f.cats, c] })
  const next1 = () => (!f.business.trim() || !f.name.trim() || !f.phone.trim() || !f.address.trim()) ? setErr('Fill in business name, your name, phone and address.') : (setErr(''), setStep(2))
  const box = 'rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5'

  return <div className="min-h-[100svh] bg-[var(--blush)] px-4 py-6 text-[var(--ink)]"><div className="mx-auto max-w-md">
    <Link to="/welcome" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--muted)]"><ChevronLeft size={16} />Back</Link>
    <img src="/logo.webp" alt="WakaStore" className="mb-4 h-9" />
    <h1 className="text-2xl font-extrabold tracking-tight">{isM ? 'Sell on WakaStore' : 'Start building'}</h1>
    <p className="mb-4 text-sm text-[var(--muted)]">{isM ? 'Apply once. An admin reviews your business before you can list products.' : 'Create an account to request quotations and order materials.'}</p>
    <div className="mb-4 grid grid-cols-2 rounded-xl bg-[var(--surface)] p-1 text-sm font-semibold">{[['signup', isM ? 'Apply' : 'Create account'], ['signin', 'Sign in']].map(([k, l]) => <button key={k} onClick={() => { setMode(k); setStep(1); setErr('') }} className={`rounded-lg py-2 ${mode === k ? 'bg-[var(--red)] text-white' : 'text-[var(--muted)]'}`}>{l}</button>)}</div>
    {err && <p role="alert" className="mb-3 rounded-xl bg-[var(--surface)] p-3 text-sm font-semibold text-[var(--red)]">{err}</p>}

    {mode === 'signin' && <form onSubmit={signIn} className={`${box} space-y-3`}><F label="Email"><input className={field} type="email" value={f.email} onChange={set('email')} autoComplete="email" /></F><F label="Password"><input className={field} type="password" value={f.password} onChange={set('password')} autoComplete="current-password" /></F>
      <button className="primary w-full" type="submit">Sign in</button><p className="text-center text-xs text-[var(--muted)]">Demo accounts: <Link to="/login" className="font-semibold underline">see the list</Link></p></form>}

    {mode === 'signup' && !isM && <div className={`${box} space-y-3`}><F label="Full name"><input className={field} value={f.name} onChange={set('name')} autoComplete="name" /></F><F label="Email"><input className={field} type="email" value={f.email} onChange={set('email')} autoComplete="email" /></F><F label="Phone (optional)"><input className={field} value={f.phone} onChange={set('phone')} autoComplete="tel" /></F><F label="Password (6+ characters)"><input className={field} type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></F>
      <button className="primary w-full" onClick={finish}>Create account</button><p className="text-xs text-[var(--muted)]">Prototype: details stay in this browser only.</p></div>}

    {mode === 'signup' && isM && <><div className="mb-3 flex items-center gap-2 text-xs font-semibold">{['Business', 'Categories', 'Review'].map((l, k) => <span key={l} className={`flex items-center gap-1 rounded-full px-3 py-1 ${step === k + 1 ? 'bg-[var(--ink)] text-[var(--canvas)]' : step > k + 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--surface)] text-[var(--muted)]'}`}>{step > k + 1 ? <Check size={12} /> : k + 1}. {l}</span>)}</div>
      {step === 1 && <div className={`${box} space-y-3`}><F label="Business name"><input className={field} value={f.business} onChange={set('business')} /></F><F label="Your name"><input className={field} value={f.name} onChange={set('name')} /></F><F label="Business phone"><input className={field} value={f.phone} onChange={set('phone')} autoComplete="tel" /></F><F label="Business address"><input className={field} value={f.address} onChange={set('address')} /></F><F label="About your business (optional)"><input className={field} value={f.description} onChange={set('description')} /></F><button className="primary w-full" onClick={next1}>Continue</button></div>}
      {step === 2 && <div className={`${box} space-y-3`}><b className="text-sm">What do you sell? Pick one or more.</b><div className="flex flex-wrap gap-2">{categories.map(catName).map((c) => <button key={c} onClick={() => { setErr(''); toggle(c) }} aria-pressed={f.cats.includes(c)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${f.cats.includes(c) ? 'border-[var(--red)] bg-[var(--blush)] text-[var(--red)]' : 'border-[var(--line)]'}`}>{c}</button>)}</div>
        <div className="flex gap-2"><button className="secondary" onClick={() => setStep(1)}>Back</button><button className="primary flex-1" onClick={() => f.cats.length ? (setErr(''), setStep(3)) : setErr('Pick at least one category.')}>Continue</button></div></div>}
      {step === 3 && <div className={`${box} space-y-3`}><F label="Login email"><input className={field} type="email" value={f.email} onChange={set('email')} autoComplete="email" /></F><F label="Password (6+ characters)"><input className={field} type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></F>
        <div className="rounded-xl bg-[var(--soft)] p-3 text-sm"><b>{f.business}</b><div className="text-[var(--muted)]">{f.address} · {f.phone}</div><div className="mt-1 text-xs text-[var(--muted)]">{f.cats.join(', ')}</div></div>
        <ol className="space-y-1 text-xs text-[var(--muted)]"><li>1. You submit this application (status: Pending).</li><li>2. An admin approves or rejects it.</li><li>3. Once approved, add products and receive orders.</li><li>4. If rejected, you can edit and resubmit after 5 working days.</li></ol>
        <div className="flex gap-2"><button className="secondary" onClick={() => setStep(2)}>Back</button><button className="primary flex-1" onClick={finish}>Submit application</button></div></div>}</>}
  </div></div>
}
