import { useEffect, useState } from 'react'
import { Clock, Lock, LogOut, XCircle } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'
import { AUTO_APPROVE_MS, autoApproveAt, merchantIdOf } from '../data/quoteSeed'

const addWorkingDays = (from, n) => { const d = new Date(from); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n-- } return d }

// Only approved merchants can sell. Pending / rejected / suspended see a status screen instead.
export default function MerchantGate({ children }) {
  const { state, resubmitMerchant, autoApproveMerchant, signOut } = useAppState()
  const m = state.merchants.find((x) => x.id === merchantIdOf(state))

  // Demo mode: a merchant who just applied shows "pending" with a countdown, then is approved
  // automatically and lands on the merchant page. Hooks stay above every early return.
  const approveAt = autoApproveAt(m)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!approveAt) return undefined
    const id = m.id
    const tick = () => { const t = Date.now(); setNow(t); if (t >= approveAt) autoApproveMerchant(id) }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [approveAt, m?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const secondsLeft = approveAt ? Math.max(0, Math.ceil((approveAt - now) / 1000)) : 0
  const progress = approveAt ? Math.min(100, Math.max(0, ((AUTO_APPROVE_MS - (approveAt - now)) / AUTO_APPROVE_MS) * 100)) : 0

  // Do not redirect to /welcome here: Welcome redirects active merchant
  // sessions back to /merchant/overview, which creates a navigation loop
  // when browser storage contains an orphaned merchant session.
  if (!m) return <div className="mx-auto max-w-md px-4 py-10"><div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--blush)] text-[var(--red)]"><XCircle /></span>
    <span className="eyebrow mt-4 block">MERCHANT ACCOUNT UNAVAILABLE</span>
    <h1 className="mt-1 text-2xl font-bold">We couldn't find this merchant account</h1>
    <p className="mt-2 text-sm text-[var(--muted)]">This can happen after demo data has been reset. Sign out, then sign in or create a merchant account again.</p>
    <button className="primary mt-4 inline-flex items-center gap-2" onClick={signOut}><LogOut size={16} />Sign out</button>
  </div></div>
  if (m.status === 'approved') return children
  const when = m.rejectedAt ? addWorkingDays(m.rejectedAt, 5) : null, can = when && new Date() >= when
  const Icon = m.status === 'pending' ? Clock : m.status === 'rejected' ? XCircle : Lock
  return <div className="mx-auto max-w-md px-4 py-10"><div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--blush)] text-[var(--red)]"><Icon /></span>
    <span className="eyebrow mt-4 block">APPLICATION {m.status.toUpperCase()}</span><h1 className="mt-1 text-2xl font-bold">{m.name}</h1>
    {m.status === 'pending' && !approveAt && <p className="mt-2 text-sm text-[var(--muted)]">Your application is under review. You can add products and receive orders once an admin approves it.</p>}
    {m.status === 'pending' && approveAt && <>
      <p className="mt-2 text-sm text-[var(--muted)]">Your application is under review. In demo mode it is approved automatically, then you go straight to your merchant page.</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--blush)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="h-full rounded-full bg-[var(--red)] transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 text-sm font-semibold" aria-live="polite">{secondsLeft > 0 ? `Approving in ${secondsLeft}s…` : 'Approved! Opening your merchant page…'}</p>
    </>}
    {m.status === 'suspended' && <p className="mt-2 text-sm text-[var(--muted)]">Your account is suspended and selling is restricted. Contact WakaStore support.</p>}
    {m.status === 'rejected' && <><p className="mt-2 text-sm text-[var(--muted)]">Reason: {m.rejectionReason || 'Not provided'}</p>
      <p className="mt-2 text-sm">{when ? <>You can resubmit from <b>{when.toLocaleDateString('en-NG', { dateStyle: 'long' })}</b> (5 working days, weekends excluded).</> : 'You can edit and resubmit your application.'}</p>
      <button className="primary mt-4 w-full" disabled={when && !can} onClick={() => resubmitMerchant(m.id)}>Resubmit application</button></>}
  </div></div>
}
