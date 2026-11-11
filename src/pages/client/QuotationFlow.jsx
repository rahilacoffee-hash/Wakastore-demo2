import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, FileText, Plus, Trash2 } from 'lucide-react'
import { useAppState } from '../../context/AppStateContext'
import { bestBasket, groupSelectionByMerchant, matchQuotation, parseMaterialsList } from '../../services/matching'
import { formatNaira } from '../../utils/formatters'

const UNITS = ['bags', 'pieces', 'lengths', 'metres', 'rolls', 'boxes', 'sheets', 'tonnes', 'litres', 'buckets', 'bundles']
const field = 'w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--red)]'
const card = 'rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4'
const newRow = () => ({ id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', quantity: 1, unit: 'bags', specs: '', notes: '' })

/* Create: paste / manual / upload -> review -> submit */
export function NewQuotationFlow() {
  const { createQuotationFull } = useAppState(), navigate = useNavigate(), [sp] = useSearchParams()
  const [name, setName] = useState(''), [text, setText] = useState(''), [rows, setRows] = useState(sp.get('mode') === 'paste' || sp.get('mode') === 'upload' ? [] : [newRow()]), [file, setFile] = useState(''), [err, setErr] = useState('')
  const patch = (id, k, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  const extract = () => { setRows([...rows.filter((r) => r.name.trim()), ...parseMaterialsList(text).map((r, i) => ({ ...r, id: `${r.id}-${Date.now()}-${i}`, unit: r.unit || 'pieces' }))]); setText('') }
  const submit = () => {
    const list = rows.filter((r) => r.name.trim())
    if (!list.length) return setErr('Add at least one material.')
    if (list.some((r) => !(Number(r.quantity) > 0))) return setErr('Every quantity must be greater than zero.')
    navigate(`/client/quotations/${createQuotationFull({ name, items: list })}`)
  }
  return <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6"><span className="eyebrow">STEP 1 OF 3 · MATERIALS LIST</span><h1 className="mt-1 text-2xl font-bold">Build your materials list</h1>
    <p className="mt-2 text-sm text-[var(--muted)]">Paste a list, add items one by one, or upload a file. Then review, submit and compare merchants.</p>
    <input className={`${field} mt-4`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Quotation name (e.g. 3-bedroom bungalow)" aria-label="Quotation name" />
    <div className={`${card} mt-4 space-y-3`}><textarea className={field} rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Paste materials list" placeholder={'Paste your list, one per line:\n50 bags of Dangote cement\n20 lengths of 12mm iron rod'} />
      <div className="flex flex-wrap gap-2"><button className="primary" disabled={!text.trim()} onClick={extract}>Convert to lines</button>
        <label className="secondary cursor-pointer">Upload PDF / image<input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f.name); setText('10 bags of Dangote cement\n20 lengths of 12mm iron rod\n6 pieces of flush door') } }} /></label></div>
      {file && <p className="rounded-xl bg-[var(--soft)] p-3 text-xs text-[var(--muted)]"><FileText size={13} className="mr-1 inline" /><b>{file}</b> selected. DEMO extraction only: no real OCR ran. Sample lines were placed above; review them, then convert.</p>}</div>
    <div className="mt-4 space-y-3">{rows.map((r) => <div key={r.id} className={`${card} grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]`}>
      <input className={field} value={r.name} onChange={(e) => patch(r.id, 'name', e.target.value)} placeholder="Material name" aria-label="Material name" />
      <input className={field} type="number" min="1" value={r.quantity} onChange={(e) => patch(r.id, 'quantity', e.target.value)} aria-label="Quantity" />
      <select className={field} value={r.unit} onChange={(e) => patch(r.id, 'unit', e.target.value)} aria-label="Unit">{[...new Set([r.unit, ...UNITS])].filter(Boolean).map((u) => <option key={u}>{u}</option>)}</select>
      <button className="secondary" aria-label="Remove item" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}><Trash2 size={16} /></button>
      <input className={`${field} sm:col-span-2`} value={r.specs} onChange={(e) => patch(r.id, 'specs', e.target.value)} placeholder="Specifications (optional)" /><input className={`${field} sm:col-span-2`} value={r.notes} onChange={(e) => patch(r.id, 'notes', e.target.value)} placeholder="Notes (optional)" /></div>)}</div>
    <button className="secondary mt-4" onClick={() => setRows([...rows, newRow()])}><Plus size={16} /> Add item</button>
    {err && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--red)]">{err}</p>}
    <button className="primary mt-5 w-full" onClick={submit}>Find matching merchants <ArrowRight size={16} /></button>
    <p className="mt-3 text-center text-xs text-[var(--muted)]">PDF/image processing is simulated.</p></div>
}

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
  const go = () => { quoteToCart(q.id, groups.flatMap((g) => g.items.map((i) => ({ productId: i.productId, quantity: i.quantity })))); navigate('/client/checkout') }

  return <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
    <div><Link to="/client/quotations" className="text-sm font-semibold text-[var(--red)]">← Quotations</Link><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div><span className="eyebrow">{q.id} · {items.length} LINES · NEEDS 60% OF LINES</span><h1 className="mt-1 text-2xl font-bold">{q.name}</h1></div><span className="status amber">{q.status}</span></div></div>
    {converted && <div className={card}>Converted to an order. <Link className="font-semibold text-[var(--red)]" to={`/client/orders/${q.orderId}`}>Open order</Link></div>}
    <div className="grid gap-3 md:grid-cols-3">{m.results.map((r) => <div key={r.merchant.id} className={`${card} ${r.eligible ? '' : 'opacity-60'}`}><div className="flex items-start justify-between gap-2"><b>{r.merchant.name}</b><span className={`status ${r.eligible ? 'processing' : ''}`}>{r.eligible ? 'Eligible' : 'Below 60%'}</span></div>
      <div className="mt-2 text-3xl font-extrabold">{r.percentage}%</div><div className="text-xs text-[var(--muted)]">{r.matchedCount} of {r.totalLines} lines · {r.merchant.address}</div>
      {r.eligible && <div className="mt-2 text-sm">Est. subtotal {formatNaira(r.subtotal)}</div>}{r.unmatched.length > 0 && <div className="mt-2 text-xs text-[var(--red)]">Missing: {r.unmatched.map((u) => u.line.name).join(', ')}</div>}</div>)}</div>
    {m.quotationNeedsSourcing && <div className={`${card} border-[var(--red)]`}>No merchant reached 60%. This quotation was sent to Super Admin for manual sourcing.</div>}
    {!converted && !m.quotationNeedsSourcing && <>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Choose a merchant per item</h2><div className="flex flex-wrap gap-2"><label className="text-xs font-semibold">Sort by <select className="ml-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="name">Name A–Z</option><option value="unit">Unit</option><option value="price">Lowest unit price</option></select></label><button className="secondary" onClick={() => setPick(null)}>Best basket</button></div></div>
      <div className="space-y-3">{sortedLines.map(({ line, options }) => <div key={line.id} className={card}><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--soft)]">{options[0]?.product?.image ? <img src={options[0].product.image} alt="" className="h-full w-full object-cover"/> : <FileText size={18}/>}</div><div><b>{line.name}</b><p className="text-xs text-[var(--muted)]">{line.quantity} {line.unit} · {line.specs || 'No extra specifications'}</p></div></div>
        {!options.length ? <p className="mt-1 text-sm text-[var(--red)]">No eligible merchant has this. It won't be in this order.</p> : <div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((o) => <label key={o.merchantId} className={`cursor-pointer rounded-xl border p-3 text-sm ${sel[line.id] === o.merchantId ? 'border-[var(--red)] bg-[var(--blush)]' : 'border-[var(--line)]'}`}><input type="radio" className="mr-2" name={line.id} checked={sel[line.id] === o.merchantId} onChange={() => setPick({ ...sel, [line.id]: o.merchantId })} /><div className="flex items-center gap-2">{o.product.image && <img src={o.product.image} alt="" className="h-10 w-10 rounded-lg object-cover"/>}<span><b>{o.merchantName}</b><span className="block text-xs text-[var(--muted)]">{o.product.name} · Ref: {o.product.id}</span></span></div><div className="mt-2 font-bold">{formatNaira(o.unitPrice)}/{o.product.unit}</div><div className="text-xs text-[var(--muted)]">{o.partial ? <span className="text-[var(--red)]">Only {o.availableQty} available (short by {o.shortfall})</span> : 'Full quantity available'} · {formatNaira(o.lineTotal)}</div></label>)}</div>}</div>)}</div>
      {groups.length > 0 && <div className={`${card} space-y-3`}><h2 className="text-lg font-bold">Your selection</h2>{groups.map((g) => <div key={g.merchantId} className="rounded-xl bg-[var(--soft)] p-3 text-sm"><b>{g.merchantName}</b>{g.items.map((i) => <div key={i.productId} className="flex justify-between gap-2 py-0.5"><span>{i.quantity} {i.unit} · {i.name}</span><span>{formatNaira(i.lineTotal)}</span></div>)}</div>)}
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div><div className="flex justify-between text-sm"><span>WakaStore fee (2.5%)</span><span>{formatNaira(fee)}</span></div><div className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{formatNaira(subtotal + fee)}</span></div>
        <button className="primary w-full" onClick={go}>Continue to checkout <ArrowRight size={16} /></button><p className="text-center text-xs text-[var(--muted)]">Your selected product references, quantities and prices will be carried into checkout. Add your delivery address before confirming payment.</p></div>}</>}
  </div>
}
