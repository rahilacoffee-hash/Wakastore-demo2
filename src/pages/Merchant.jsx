import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import * as E from '../services/engine'
import { Badge, Btn, CATS, Card, Empty, H1, Input, Select, UNITS, fmt, mName, when } from '../components/ui'

export function MerchantGate() {
  const { state, user, mutate } = useStore(), m = state.merchants.find((x) => x.id === user.merchantId)
  if (m.status === 'approved') return <Outlet />
  const can = m.status === 'rejected' && m.canResubmitAfter && new Date() >= new Date(m.canResubmitAfter)
  return <div className="mx-auto max-w-md"><Card className="space-y-3 text-center"><h1 className="font-[Manrope] text-xl font-extrabold">{m.name}</h1><Badge s={m.status} />
    {m.status === 'pending' && <p className="text-sm text-[#55515A]">Your application is under review. You can start selling once an Admin approves it.</p>}
    {m.status === 'suspended' && <p className="text-sm text-[#55515A]">Your account is suspended and selling is restricted. {m.statusReason && <>Reason: {m.statusReason}</>}</p>}
    {m.status === 'rejected' && <><p className="text-sm text-[#55515A]">Reason: {m.statusReason}</p><p className="text-sm">You can edit and resubmit from <b>{m.canResubmitAfter ? when(m.canResubmitAfter) : '—'}</b> (5 working days, weekends excluded).</p>
      <Btn disabled={!can} onClick={() => mutate((d) => { const x = d.merchants.find((y) => y.id === m.id); x.status = 'pending'; x.statusReason = '' }, 'Application resubmitted')}>Resubmit application</Btn></>}</Card></div>
}

export function MerchantOverview() {
  const { state, user } = useStore(), id = user.merchantId, subs = E.subOrdersForMerchant(state, id).filter((s) => s.status !== 'Reassigned')
  const prods = state.products.filter((p) => p.merchantId === id), gross = subs.filter((s) => ['Delivered', 'Completed'].includes(s.status)).reduce((n, s) => n + s.subtotal, 0)
  const stats = [['Awaiting acceptance', subs.filter((s) => s.status === 'Awaiting acceptance').length], ['In progress', subs.filter((s) => ['Accepted', 'Preparing', 'Ready for dispatch', 'Dispatched'].includes(s.status)).length], ['Completed', subs.filter((s) => ['Delivered', 'Completed'].includes(s.status)).length], ['Low stock (<20)', prods.filter((p) => p.stock < 20).length], ['Products', prods.length]]
  return <div><H1 sub={mName(state, id)}>Overview</H1><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{stats.map(([l, v]) => <Card key={l}><div className="font-[Manrope] text-3xl font-extrabold">{v}</div><div className="text-xs text-[#85818A]">{l}</div></Card>)}</div>
    <Card className="mt-4"><div className="text-sm text-[#85818A]">Delivered order value (demo settlement basis)</div><div className="font-[Manrope] text-2xl font-extrabold">{fmt(gross)}</div><p className="text-xs text-[#85818A]">Simulated figures. No bank transfers happen.</p></Card></div>
}

const NEXT = { Accepted: ['Preparing', 'Start preparing'], Preparing: ['Ready for dispatch', 'Mark ready for dispatch'], 'Ready for dispatch': ['Dispatched', 'Dispatch'], Dispatched: ['Delivered', 'Mark delivered'] }
export function MerchantOrders() {
  const { state, user, run, flash } = useStore(), merchantId = user.merchantId
  const subs = E.subOrdersForMerchant(state, merchantId).slice().reverse()
  return <div><H1 sub="You only see sub-orders assigned to you">Orders</H1>{!subs.length ? <Empty>No assigned orders yet.</Empty> : <div className="space-y-3">{subs.map((s) => { const o = state.orders.find((x) => x.id === s.orderId), c = state.users.find((u) => u.id === o.customerId), nx = NEXT[s.status]
    return <Card key={s.id}><div className="flex items-start justify-between gap-2"><div><b>{o.ref}</b><div className="text-xs text-[#85818A]">{when(o.createdAt)} · {c.name} · {c.phone}</div><div className="text-xs text-[#85818A]">Deliver to {o.address.line}</div></div><Badge s={s.status} /></div>
      {s.reassignedFrom && <p className="text-xs text-[#85818A]">Reassigned to you</p>}{s.rejectionReason && <p className="text-xs text-[#B90013]">Rejected: {s.rejectionReason}</p>}
      <div className="mt-2 text-sm">{s.items.map((i) => <div key={i.productId} className="flex justify-between py-0.5"><span>{i.quantity} {i.unit} · {i.name}</span><span>{fmt(i.lineTotal)}</span></div>)}<div className="mt-1 flex justify-between font-bold"><span>Order value</span><span>{fmt(s.subtotal)}</span></div></div>
      <div className="mt-3 flex flex-wrap gap-2">{s.status === 'Awaiting acceptance' && <><Btn onClick={() => run(E.merchantRespond, { subId: s.id, merchantId, action: 'accept' }, 'Order accepted')}>Accept</Btn>
        <ReasonReject onSubmit={(reason) => { const r = run(E.merchantRespond, { subId: s.id, merchantId, action: 'reject', reason }); if (r.ok) flash(r.reassigned.length ? 'Rejected. Items were reassigned to another merchant.' : r.sourcingItems ? 'Rejected. No eligible merchant, so a sourcing case was sent to Super Admin.' : 'Rejected.') }} /></>}
        {nx && <Btn onClick={() => run(E.advanceSubOrder, { subId: s.id, merchantId, status: nx[0] }, nx[0])}>{nx[1]}</Btn>}</div></Card> })}</div>}</div>
}
import { ReasonButton } from '../components/ui'
const ReasonReject = ({ onSubmit }) => <ReasonButton label="Reject" ph="Rejection reason (required)" onSubmit={onSubmit} />

export function MerchantProducts() {
  const { state, user, mutate, flash } = useStore(), id = user.merchantId, prods = state.products.filter((p) => p.merchantId === id)
  const [f, setF] = useState({ name: '', category: CATS[0], unit: 'bags', price: '', stock: '' })
  const upd = (pid, k, v) => mutate((d) => { d.products.find((p) => p.id === pid)[k] = v })
  const add = () => { if (!f.name.trim() || !(+f.price > 0) || !(+f.stock >= 0) || f.stock === '') return flash('Enter a name, a price above zero and a stock level.', true); mutate((d) => { d.products.push({ id: `p-${++d.seq}`, merchantId: id, name: f.name.trim(), category: f.category, unit: f.unit, price: +f.price, stock: +f.stock, available: true, aliases: [] }) }, 'Product added. It is now in the marketplace and in matching.'); setF({ ...f, name: '', price: '', stock: '' }) }
  return <div className="space-y-4"><H1 sub="Changes update the marketplace and quotation matching instantly">Products & inventory</H1>
    <Card className="grid gap-2 md:grid-cols-6"><Input className="md:col-span-2" placeholder="Product name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Product name" /><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} aria-label="Category">{CATS.map((c) => <option key={c}>{c}</option>)}</Select><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} aria-label="Unit">{UNITS.map((u) => <option key={u}>{u}</option>)}</Select><Input type="number" placeholder="Price ₦" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} aria-label="Price" /><Input type="number" placeholder="Stock" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} aria-label="Stock" /><Btn onClick={add} className="md:col-span-6">Add product</Btn></Card>
    {!prods.length ? <Empty>No products yet.</Empty> : <div className="space-y-2">{prods.map((p) => <Card key={p.id} className="grid items-center gap-2 md:grid-cols-[2fr_1fr_1fr_auto_auto]"><div><b className="text-sm">{p.name}</b><div className="text-xs text-[#85818A]">{p.category} · per {p.unit.replace(/s$/, '')}</div></div>
      <label className="text-xs text-[#85818A]">Price<Input type="number" defaultValue={p.price} onBlur={(e) => +e.target.value > 0 && upd(p.id, 'price', +e.target.value)} /></label><label className="text-xs text-[#85818A]">Stock<Input type="number" defaultValue={p.stock} key={p.stock} onBlur={(e) => +e.target.value >= 0 && upd(p.id, 'stock', +e.target.value)} /></label>
      <Btn v="ghost" onClick={() => upd(p.id, 'available', !p.available)}>{p.available ? 'Available' : 'Hidden'}</Btn><Btn v="ghost" onClick={() => window.confirm(`Delete ${p.name}?`) && mutate((d) => { d.products = d.products.filter((x) => x.id !== p.id) }, 'Product deleted')}>Delete</Btn></Card>)}</div>}</div>
}
