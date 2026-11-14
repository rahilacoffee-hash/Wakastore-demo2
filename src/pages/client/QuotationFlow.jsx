import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, FileText, Plus, Trash2 } from 'lucide-react'
import { useAppState } from '../../context/AppStateContext'
import { pickInitialAssignee } from '../../services/sourcing'
import { bestBasket, groupSelectionByMerchant, matchQuotation, parseMaterialsList } from '../../services/matching'
import { formatNaira } from '../../utils/formatters'

const UNITS = ['bags', 'pieces', 'lengths', 'metres', 'rolls', 'boxes', 'sheets', 'tonnes', 'litres', 'buckets', 'bundles']
const field = 'w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--red)]'
const card = 'rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4'
const newRow = () => ({ id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', quantity: 1, unit: '', specs: '', notes: '' })

/* Create: paste / manual / upload -> review -> submit */
export { default as NewQuotationFlow } from './materials/MaterialListBuilder'

/* Detail: 60% matching -> compare -> pick merchant per item -> existing checkout */
export function QuotationDetail() {
  const { id } = useParams(), { state, feeRate, quoteToCart } = useAppState(), navigate = useNavigate(), [pick, setPick] = useState(null), [sortBy, setSortBy] = useState('name')
  const q = state.quotations.find((x) => x.id === id)
  const items = useMemo(() => (q ? q.items.map((l, i) => ({ ...l, id: l.id || `line-${i + 1}`, quantity: Number(l.quantity) || 1 })) : []), [q])
  const m = useMemo(() => q && matchQuotation(items, state.merchants, state.products, 60), [q, items, state.merchants, state.products])
  if (!q) return <div className="mx-auto max-w-md px-4 py-10 text-center"><p className="text-[var(--muted)]">Quotation not found.</p><Link className="primary mt-4" to="/client/quotations">Back to quotations</Link></div>

  const basket = bestBasket(m), sel = pick || Object.fromEntries(Object.entries(basket).map(([k, v]) => [k, v.merchantId]))
  const sortedLines = [...m.perLine].sort((a, b) => {
    if (sortBy === 'unit') return String(a.line.unit || '').localeCompare(String(b.line.unit || '')) || a.line.name.localeCompare(b.line.name)
    if (sortBy === 'price') { const ap = Math.min(...a.options.map(o => o.unitPrice), Infinity); const bp = Math.min(...b.options.map(o => o.unitPrice), Infinity); return ap - bp || a.line.name.localeCompare(b.line.name) }
    return a.line.name.localeCompare(b.line.name)
  })
  const chosen = Object.fromEntries(m.perLine.map((x) => { const o = x.options.find((o) => o.merchantId === sel[x.line.id]); return o ? [x.line.id, o] : null }).filter(Boolean))
  const groups = groupSelectionByMerchant(chosen), subtotal = groups.reduce((n, g) => n + g.subtotal, 0), fee = Math.round(subtotal * feeRate)
  const converted = q.status === 'Converted to order'
  // Requested materials nobody has in stock STAY in the order: the best-ranked eligible merchant is asked to
  // confirm whether they can source them (and at what price). Nothing is dropped silently.
  const eligibleMerchants = m.eligible.map((r) => r.merchant)
  const unavailableLines = m.perLine.filter((x) => !x.options.length).map((x) => x.line)
  const assigneeOf = (line) => pickInitialAssignee(line, eligibleMerchants, state.products)
  const go = () => {
    quoteToCart(
      q.id,
      groups.flatMap((g) => g.items.map((i) => ({ productId: i.productId, quantity: i.quantity, lineId: i.lineId }))),
      unavailableLines.map((l) => ({ lineId: l.id, name: l.name, specs: l.specs || '', quantity: l.quantity, unit: l.unit, assigneeId: assigneeOf(l)?.id || null })),
    )
    navigate('/client/checkout')
  }

  return <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
    <div><Link to="/client/quotations" className="text-sm font-semibold text-[var(--red)]">← Quotations</Link><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div><span className="eyebrow">{q.id} · {items.length} LINES · NEEDS 60% OF LINES</span><h1 className="mt-1 text-2xl font-bold">{q.name}</h1></div><span className="status amber">{q.status}</span></div></div>
    {converted && <div className={card}>Converted to an order. <Link className="font-semibold text-[var(--red)]" to={`/client/orders/${q.orderId}`}>Open order</Link></div>}
    <div className="grid gap-3 md:grid-cols-3">{m.results.map((r) => <div key={r.merchant.id} className={`${card} ${r.eligible ? '' : 'opacity-60'}`}><div className="flex items-start justify-between gap-2"><b>{r.merchant.name}</b><span className={`status ${r.eligible ? 'processing' : ''}`}>{r.eligible ? 'Eligible' : 'Below 60%'}</span></div>
      <div className="mt-2 text-3xl font-extrabold">{r.percentage}%</div><div className="text-xs text-[var(--muted)]">{r.matchedCount} of {r.totalLines} lines · {r.merchant.address}</div>
      {r.eligible && <div className="mt-2 text-sm">Est. subtotal {formatNaira(r.subtotal)}</div>}{r.unmatched.length > 0 && <div className="mt-2 text-xs text-[var(--red)]">Missing: {r.unmatched.map((u) => (u.soldPerUnit ? `${u.line.name} (sold per ${u.soldPerUnit}, you asked for ${u.line.unit})` : u.line.name)).join(', ')}</div>}</div>)}</div>
    {m.quotationNeedsSourcing && <div className={`${card} border-[var(--red)]`}>No merchant reached 60%. This quotation was sent to Super Admin for manual sourcing.</div>}
    {!converted && !m.quotationNeedsSourcing && <>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Choose a merchant per item</h2><div className="flex flex-wrap gap-2"><label className="text-xs font-semibold">Sort by <select className="ml-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="name">Name A–Z</option><option value="unit">Unit</option><option value="price">Lowest unit price</option></select></label><button className="secondary" onClick={() => setPick(null)}>Best basket</button></div></div>
      <div className="space-y-3">{sortedLines.map(({ line, options }) => <div key={line.id} className={card}><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--soft)]">{options[0]?.product?.image ? <img src={options[0].product.image} alt="" className="h-full w-full object-cover"/> : <FileText size={18}/>}</div><div><b>{line.name}</b><p className="text-xs text-[var(--muted)]">{line.quantity} {line.unit} · {line.specs || 'No extra specifications'}</p></div></div>
        {!options.length ? <p className="mt-1 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"><b>Not currently in stock.</b> It stays in your order. {assigneeOf(line) ? <>{assigneeOf(line).name} will confirm whether they can source it and send you the price to approve before anything is charged.</> : 'No merchant is assigned yet; it will wait as “Awaiting merchant”.'}</p> : <div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((o) => <label key={o.merchantId} className={`cursor-pointer rounded-xl border p-3 text-sm ${sel[line.id] === o.merchantId ? 'border-[var(--red)] bg-[var(--blush)]' : 'border-[var(--line)]'}`}><input type="radio" className="mr-2" name={line.id} checked={sel[line.id] === o.merchantId} onChange={() => setPick({ ...sel, [line.id]: o.merchantId })} /><div className="flex items-center gap-2">{o.product.image && <img src={o.product.image} alt="" className="h-10 w-10 rounded-lg object-cover"/>}<span><b>{o.merchantName}</b><span className="block text-xs text-[var(--muted)]">{o.product.name} · Ref: {o.product.id}</span></span></div><div className="mt-2 font-bold">{formatNaira(o.unitPrice)}/{o.product.unit}</div><div className="text-xs text-[var(--muted)]">{o.partial ? <span className="text-[var(--red)]">Only {o.availableQty} available (short by {o.shortfall})</span> : 'Full quantity available'} · {formatNaira(o.lineTotal)}</div></label>)}</div>}</div>)}</div>
      {unavailableLines.length > 0 && <div className={`${card} border-amber-300 bg-amber-50 text-sm text-amber-950`}><b>{unavailableLines.length} material{unavailableLines.length === 1 ? '' : 's'} not in stock, kept in your order:</b>{unavailableLines.map((l) => <div key={l.id} className="py-0.5">{l.quantity} {l.unit} · {l.name}{l.specs ? ` ${l.specs}` : ''} <span className="text-xs">(price to be confirmed by {assigneeOf(l)?.name || 'a merchant'}; you approve it first)</span></div>)}</div>}
      {groups.length > 0 && <div className={`${card} space-y-3`}><h2 className="text-lg font-bold">Your selection</h2>{groups.map((g) => <div key={g.merchantId} className="rounded-xl bg-[var(--soft)] p-3 text-sm"><b>{g.merchantName}</b>{g.items.map((i) => <div key={i.productId} className="flex justify-between gap-2 py-0.5"><span>{i.quantity} {i.unit} · {i.name}</span><span>{formatNaira(i.lineTotal)}</span></div>)}</div>)}
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div><div className="flex justify-between text-sm"><span>WakaStore fee (2.5%)</span><span>{formatNaira(fee)}</span></div><div className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{formatNaira(subtotal + fee)}</span></div>
        <button className="primary w-full" onClick={go}>Continue to checkout <ArrowRight size={16} /></button><p className="text-center text-xs text-[var(--muted)]">Your selected product references, quantities and prices will be carried into checkout. Add your delivery address before confirming payment.</p></div>}</>}
  </div>
}
