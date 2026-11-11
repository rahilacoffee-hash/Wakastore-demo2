import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import * as I from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { markRead, notificationsFor } from '../services/engine'
import { MERCHANT_CATEGORY_NAMES } from '../constants/categories'

export const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG')
export const when = (s) => new Date(s).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
export const CATS = MERCHANT_CATEGORY_NAMES
export const UNITS = ['bags', 'pieces', 'lengths', 'metres', 'rolls', 'boxes', 'tonnes', 'litres', 'buckets', 'bundles']
export const mName = (s, id) => s.merchants.find((m) => m.id === id)?.name || '—'
export const sellable = (s) => s.products.filter((p) => p.available && p.stock > 0 && s.merchants.find((m) => m.id === p.merchantId)?.status === 'approved')

const TONES = { green: 'bg-emerald-50 text-emerald-700', red: 'bg-[#FFF0F1] text-[#B90013]', amber: 'bg-amber-50 text-amber-700', grey: 'bg-[#F3F1F1] text-[#55515A]' }
const tone = (s = '') => /reject|fail|cancel|suspend|declin/i.test(s) ? 'red' : /deliver|complet|success|approved|refunded|resolved|active|converted/i.test(s) ? 'green' : /pending|awaiting|submitted|open|sourcing|review|needs/i.test(s) ? 'amber' : 'grey'
export const Badge = ({ s }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone(s)]}`}>{s}</span>

const BTN = { primary: 'bg-[#ED0018] text-white hover:bg-[#D60016]', dark: 'bg-[#171717] text-white hover:bg-black', ghost: 'border border-[#DCD9DC] bg-white text-[#171717] hover:bg-[#F3F1F1]' }
export const Btn = ({ v = 'primary', className = '', ...p }) => <button type="button" {...p} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${BTN[v]} ${className}`} />
export const Card = ({ className = '', ...p }) => <div {...p} className={`rounded-2xl border border-[#F5D5D9] bg-white p-4 ${className}`} />
export const Input = ({ className = '', ...p }) => <input {...p} className={`min-h-10 w-full rounded-xl border border-[#DCD9DC] bg-white px-3 text-sm outline-none focus:border-[#ED0018] ${className}`} />
export const Select = ({ className = '', ...p }) => <select {...p} className={`min-h-10 rounded-xl border border-[#DCD9DC] bg-white px-3 text-sm outline-none focus:border-[#ED0018] ${className}`} />
export const H1 = ({ children, sub }) => <div className="mb-5"><h1 className="font-[Manrope] text-2xl font-extrabold tracking-tight">{children}</h1>{sub && <p className="mt-1 text-sm text-[#55515A]">{sub}</p>}</div>
export const Demo = ({ children = 'DEMO DATA — simulated, no real money moves' }) => <span className="inline-block rounded-md bg-[#171717] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">{children}</span>
export const Empty = ({ children }) => <div className="rounded-2xl border border-dashed border-[#DCD9DC] bg-white p-8 text-center text-sm text-[#85818A]">{children}</div>

export function ReasonButton({ label, ph = 'Reason (required)', onSubmit, v = 'ghost' }) {
  const [open, setOpen] = useState(false), [t, setT] = useState('')
  if (!open) return <Btn v={v} onClick={() => setOpen(true)}>{label}</Btn>
  return <span className="inline-flex flex-wrap items-center gap-1"><Input autoFocus value={t} onChange={(e) => setT(e.target.value)} placeholder={ph} className="w-44" aria-label={ph} />
    <Btn disabled={!t.trim()} onClick={() => { onSubmit(t.trim()); setOpen(false); setT('') }}>Confirm</Btn><Btn v="ghost" aria-label="Cancel" onClick={() => setOpen(false)}>✕</Btn></span>
}

// Responsive table: real table on md+, stacked cards on mobile (never a squeezed desktop table).
export function Table({ cols, rows, empty = 'Nothing here yet.' }) {
  if (!rows.length) return <Empty>{empty}</Empty>
  return <>
    <div className="hidden overflow-x-auto rounded-2xl border border-[#F5D5D9] bg-white md:block"><table className="w-full text-left text-sm">
      <thead className="bg-[#FFF7F8] text-xs uppercase tracking-wide text-[#85818A]"><tr>{cols.map((c) => <th key={c.h} className="px-4 py-3 font-semibold">{c.h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={r.id || i} className="border-t border-[#F3F1F1] align-top">{cols.map((c) => <td key={c.h} className="px-4 py-3">{c.r(r)}</td>)}</tr>)}</tbody></table></div>
    <div className="space-y-3 md:hidden">{rows.map((r, i) => <Card key={r.id || i} className="space-y-2 text-sm">{cols.map((c) => <div key={c.h} className="flex items-start justify-between gap-3"><span className="text-xs font-semibold uppercase text-[#85818A]">{c.h}</span><span className="text-right">{c.r(r)}</span></div>)}</Card>)}</div>
  </>
}

export function Denied() {
  const { logout } = useStore()
  return <div className="grid min-h-[60vh] place-items-center p-6"><Card className="max-w-sm space-y-3 text-center"><I.ShieldAlert className="mx-auto text-[#ED0018]" /><h2 className="font-[Manrope] text-lg font-bold">Access denied</h2><p className="text-sm text-[#55515A]">Your role cannot open this page.</p><Btn onClick={logout}>Switch demo role</Btn></Card></div>
}
export function Guard({ roles, children }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/welcome" replace />
  return roles.includes(user.role) ? children : <Denied />
}

export function NotificationsPage() {
  const { state, user, run } = useStore(), nav = useNavigate()
  const list = notificationsFor(state, user.id)
  const read = (n) => { run((s) => markRead(s, user.id, n.id)); if (n.route) nav(n.route) }
  return <div><H1 sub={`${list.filter((n) => !n.read).length} unread`}>Notifications</H1>
    <Btn v="ghost" className="mb-3" onClick={() => run((s) => markRead(s, user.id))}>Mark all as read</Btn>
    {!list.length ? <Empty>No notifications yet. Actions across roles will show up here.</Empty> : <div className="space-y-2">{list.map((n) => <button key={n.id} onClick={() => read(n)} className={`block w-full rounded-2xl border p-4 text-left ${n.read ? 'border-[#F3F1F1] bg-white' : 'border-[#F5D5D9] bg-[#FFF0F1]'}`}><div className="flex justify-between gap-2 text-sm font-semibold">{n.title}<span className="text-xs font-normal text-[#85818A]">{when(n.createdAt)}</span></div><div className="text-sm text-[#55515A]">{n.message}</div></button>)}</div>}</div>
}

const NAVS = {
  client: () => [['/client/home', 'Home', I.Home], ['/client/marketplace', 'Explore', I.Compass], ['/client/quotations', 'Quotes', I.ClipboardList], ['/client/orders', 'Orders', I.Package], ['/client/wallet', 'Wallet', I.Wallet]],
  merchant: () => [['/merchant/overview', 'Overview', I.LayoutDashboard], ['/merchant/orders', 'Orders', I.Package], ['/merchant/products', 'Products', I.Boxes], ['/merchant/notifications', 'Alerts', I.Bell]],
  admin: (u) => [['overview', 'Overview', I.LayoutDashboard], ['merchants', 'Merchants', I.Store], ['customers', 'Customers', I.Users], ['products', 'Products', I.Boxes], ['quotations', 'Quotations', I.ClipboardList], ['orders', 'Orders', I.Package], ['payments', 'Payments', I.CreditCard], ['refunds', 'Refunds', I.RotateCcw],
    ...(u.role === 'super-admin' ? [['sourcing', 'Sourcing', I.Search], ['admins', 'Admins', I.UserCog], ['settings', 'Settings', I.Settings]] : []), ['audit', 'Audit log', I.ScrollText], ['notifications', 'Alerts', I.Bell]].map(([p, l, ic]) => [`/admin/${p}`, l, ic])
}

export function Shell({ base }) {
  const { user, state, logout, run, cart } = useStore(), nav = useNavigate(), [open, setOpen] = useState(false)
  const items = NAVS[base](user), notes = notificationsFor(state, user.id), unread = notes.filter((n) => !n.read).length
  const go = (n) => { run((s) => markRead(s, user.id, n.id)); setOpen(false); if (n.route) nav(n.route) }
  const link = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-[#FFF0F1] text-[#ED0018]' : 'text-[#55515A] hover:bg-[#F3F1F1]'}`
  return <div className="min-h-screen bg-[#FFF7F8] text-[#171717] print:bg-white">
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#F5D5D9] bg-white px-4 py-2.5 print:hidden">
      <Link to={items[0][0]}><img src="/logo.webp" alt="WakaStore" className="h-7 w-auto" /></Link>
      <span className="hidden rounded-md bg-[#F3F1F1] px-2 py-1 text-xs font-bold uppercase text-[#55515A] sm:inline">{user.role}</span>
      <div className="ml-auto flex items-center gap-1">
        {base === 'client' && <Link to="/client/cart" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-[#F3F1F1]"><I.ShoppingCart size={20} />{cart.length > 0 && <b className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ED0018] px-1 text-[10px] text-white">{cart.length}</b>}</Link>}
        <button aria-label="Notifications" onClick={() => setOpen(!open)} className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-[#F3F1F1]"><I.Bell size={20} />{unread > 0 && <b className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ED0018] px-1 text-[10px] text-white">{unread}</b>}</button>
        <button aria-label="Log out" onClick={logout} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[#F3F1F1]"><I.LogOut size={20} /></button>
      </div>
      {open && <div className="absolute right-3 top-14 max-h-[70vh] w-[min(92vw,380px)] overflow-auto rounded-2xl border border-[#F5D5D9] bg-white p-2 shadow-xl">
        {!notes.length ? <p className="p-4 text-sm text-[#85818A]">No notifications.</p> : notes.slice(0, 8).map((n) => <button key={n.id} onClick={() => go(n)} className={`block w-full rounded-xl p-3 text-left text-sm ${n.read ? '' : 'bg-[#FFF0F1]'}`}><b>{n.title}</b><div className="text-[#55515A]">{n.message}</div></button>)}
        <Link to={`/${base === 'client' ? 'client' : base}/notifications`} onClick={() => setOpen(false)} className="block p-3 text-center text-sm font-semibold text-[#ED0018]">View all</Link></div>}
    </header>
    <div className="mx-auto flex max-w-[1280px]">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 space-y-1 overflow-y-auto p-4 md:block print:hidden">{items.map(([to, l, Ic]) => <NavLink key={to} to={to} className={link}><Ic size={18} />{l}</NavLink>)}</aside>
      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10">
        {base === 'admin' && <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:hidden print:hidden">{items.map(([to, l]) => <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-[#ED0018] text-white' : 'bg-white text-[#55515A]'}`}>{l}</NavLink>)}</div>}
        <Outlet /></main>
    </div>
    {base !== 'admin' && <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-[#F5D5D9] bg-white md:hidden print:hidden" style={{ gridTemplateColumns: `repeat(${items.length},1fr)`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(([to, l, Ic]) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-[#ED0018]' : 'text-[#85818A]'}`}><Ic size={20} />{l}</NavLink>)}</nav>}
  </div>
}
