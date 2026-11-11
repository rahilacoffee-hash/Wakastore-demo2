import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as I from 'lucide-react'
import { useStore } from '../context/StoreContext'
import * as E from '../services/engine'
import { bestBasket, groupSelectionByMerchant, matchQuotation, parseMaterialsList } from '../services/matching'
import { Badge, Btn, CATS, Card, Demo, Denied, Empty, H1, Input, Select, UNITS, fmt, mName, sellable, when } from '../components/ui'

/* ---------------- Home ---------------- */
export function Home() {
  const { state, user } = useStore(), nav = useNavigate(), [q, setQ] = useState('')
  const feat = sellable(state).slice(0, 8), merchants = state.merchants.filter((m) => m.status === 'approved')
  return <div className="space-y-10">
    <section className="relative -mx-4 -mt-5 overflow-hidden bg-[#171717] md:mx-0 md:mt-0 md:rounded-3xl">
      <img src="/hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-right opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#171717] via-[#171717]/80 to-transparent" />
      <div className="relative max-w-xl px-5 py-12 text-white md:px-10 md:py-20">
        <p className="mb-3 text-sm font-semibold text-[#FFDADD]">Hello, {user.name.split(' ')[0]}</p>
        <h1 className="font-[Manrope] text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Build better, source smarter. <span className="text-[#ED0018]">One place.</span></h1>
        <p className="mt-4 text-[#F3F1F1]">Discover quality building materials, compare trusted merchants and get everything your project needs in one place.</p>
        <form onSubmit={(e) => { e.preventDefault(); nav(`/client/marketplace?q=${encodeURIComponent(q)}`) }} className="mt-6 flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cement, rods, tiles…" aria-label="Search materials" className="!min-h-12" /><Btn className="!min-h-12" aria-label="Search"><I.Search size={18} /></Btn></form>
        <div className="mt-4 flex flex-wrap gap-3"><Link to="/client/marketplace"><Btn>Explore Materials</Btn></Link><Link to="/client/quotations/new"><Btn v="ghost">Submit Materials List</Btn></Link></div>
      </div></section>
    <section><h2 className="mb-3 font-[Manrope] text-lg font-bold">Popular categories</h2><div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">{CATS.map((c) => <Link key={c} to={`/client/marketplace?cat=${encodeURIComponent(c)}`} className="whitespace-nowrap rounded-full border border-[#F5D5D9] bg-white px-4 py-2 text-sm font-semibold hover:border-[#ED0018]">{c}</Link>)}</div></section>
    <section><h2 className="mb-3 font-[Manrope] text-lg font-bold">Featured materials</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{feat.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>
    <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
      <div className="rounded-3xl bg-[#ED0018] p-6 text-white md:p-8"><I.ClipboardList /><h2 className="mt-3 font-[Manrope] text-2xl font-extrabold">Got a full materials list?</h2><p className="mt-2 text-[#FFDADD]">Paste it once. We find merchants that can supply at least 60% of your lines, you pick the best price per item, and pay once.</p><Link to="/client/quotations/new"><Btn v="ghost" className="mt-4">Start a quotation</Btn></Link></div>
      <Card><h2 className="font-[Manrope] text-lg font-bold">Trusted merchants</h2><div className="mt-3 space-y-3">{merchants.map((m) => <div key={m.id} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FCEBED] font-bold text-[#ED0018]">{m.name[0]}</span><div><b className="text-sm">{m.name}</b><div className="text-xs text-[#85818A]">{m.address}</div></div></div>)}</div></Card></section>
    <section><h2 className="mb-3 font-[Manrope] text-lg font-bold">How WakaStore works</h2><div className="grid gap-3 md:grid-cols-4">{[['Submit', 'Paste or build your materials list.', I.FileText], ['Match', 'Merchants with ≥60% of your lines qualify.', I.Search], ['Compare', 'Choose a merchant for every item.', I.Scale], ['Pay once', 'One checkout, separate merchant deliveries.', I.Truck]].map(([t, d, Ic], i) => <Card key={t}><Ic className="text-[#ED0018]" /><b className="mt-2 block font-[Manrope]">{i + 1}. {t}</b><p className="text-sm text-[#55515A]">{d}</p></Card>)}</div></section>
    <footer className="border-t border-[#F5D5D9] pt-6 text-xs text-[#85818A]">WakaStore prototype · all payments, wallet balances and settlements are simulated. Policies are draft and need legal review.</footer>
  </div>
}

/* ---------------- Marketplace ---------------- */
function ProductCard({ p }) {
  const { state, cart, setCart, flash } = useStore()
  const add = () => { const c = cart.find((x) => x.productId === p.id); if ((c?.quantity || 0) + 1 > p.stock) return flash('No more stock', true); setCart(c ? cart.map((x) => x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x) : [...cart, { productId: p.id, quantity: 1 }]); flash('Added to cart') }
  return <Card className="flex flex-col gap-2 !p-3"><div className="grid h-24 place-items-center rounded-xl bg-[#FCEBED] text-[#ED0018]"><I.Package size={32} /></div>
    <b className="text-sm leading-tight">{p.name}</b><span className="text-xs text-[#85818A]">{mName(state, p.merchantId)} · {p.category}</span>
    <div className="mt-auto flex items-end justify-between"><div><b className="font-[Manrope]">{fmt(p.price)}</b><div className="text-[11px] text-[#85818A]">per {p.unit.replace(/s$/, '')} · {p.stock} in stock</div></div><Btn onClick={add} aria-label={`Add ${p.name}`} className="!min-h-9 !px-3"><I.Plus size={16} /></Btn></div></Card>
}
export function Marketplace() {
  const { state } = useStore(), sp = new URLSearchParams(window.location.search)
  const [q, setQ] = useState(sp.get('q') || ''), [cat, setCat] = useState(sp.get('cat') || ''), [sort, setSort] = useState('relevance'), [mid, setMid] = useState('')
  let list = sellable(state).filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!cat || p.category === cat) && (!mid || p.merchantId === mid))
  if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price); if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price)
  return <div><H1 sub={`${list.length} products from approved merchants`}>Explore materials</H1>
    <div className="mb-4 grid gap-2 md:grid-cols-4"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
      <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All {CATS.length} categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</Select>
      <Select value={mid} onChange={(e) => setMid(e.target.value)} aria-label="Merchant"><option value="">All merchants</option>{state.merchants.filter((m) => m.status === 'approved').map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="relevance">Sort: relevance</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></Select></div>
    {list.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <Empty>No products match. Try another search, or <Link className="font-semibold text-[#ED0018]" to="/client/quotations/new">submit a materials list</Link>.</Empty>}</div>
}

/* ---------------- Checkout panel (cart + quotation) ---------------- */
function CheckoutPanel({ groups, quotationId, onSuccess }) {
  const { state, user, run } = useStore(), nav = useNavigate()
  const [method, setMethod] = useState('wallet'), [fail, setFail] = useState(false), [addr, setAddr] = useState('12 Wuse II, Abuja'), [busy, setBusy] = useState(false)
  const key = useRef(crypto.randomUUID()), t = E.calcTotals(state, groups), bal = E.walletBalance(state, user.id)
  const pay = () => {
    if (busy) return; setBusy(true)
    setTimeout(() => {
      const r = run(E.checkout, { customerId: user.id, groups, paymentMethod: method, simulate: fail ? 'fail' : 'success', idempotencyKey: key.current, address: { line: addr.trim() }, quotationId }, 'Payment successful (demo)')
      setBusy(false)
      if (r.ok) { onSuccess?.(); nav(`/client/receipt/${r.receiptId}`) } else key.current = crypto.randomUUID()
    }, 800)
  }
  return <Card className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-[Manrope] text-lg font-bold">Checkout</h2><Demo>SIMULATED PAYMENT</Demo></div>
    {groups.map((g) => <div key={g.merchantId} className="rounded-xl bg-[#FFF7F8] p-3 text-sm"><b>{mName(state, g.merchantId)}</b>{g.items.map((i) => <div key={i.productId} className="flex justify-between gap-2 py-0.5"><span>{i.quantity} {i.unit} · {i.name}</span><span>{fmt(i.quantity * i.unitPrice)}</span></div>)}</div>)}
    <div className="space-y-1 border-t border-[#F3F1F1] pt-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{fmt(t.subtotal)}</span></div><div className="flex justify-between"><span>WakaStore checkout fee ({(state.settings.feeRate * 100).toFixed(1)}% demo)</span><span>{fmt(t.fee)}</span></div><div className="flex justify-between font-[Manrope] text-lg font-extrabold"><span>Total</span><span>{fmt(t.total)}</span></div></div>
    <label className="block text-sm font-semibold">Delivery address<Input value={addr} onChange={(e) => setAddr(e.target.value)} className="mt-1" /></label>
    <div className="grid gap-2 sm:grid-cols-3">{[['wallet', `WakaWallet (${fmt(bal)})`], ['card', 'Card'], ['bank', 'Bank transfer']].map(([k, l]) => <label key={k} className={`cursor-pointer rounded-xl border p-3 text-sm font-semibold ${method === k ? 'border-[#ED0018] bg-[#FFF0F1]' : 'border-[#DCD9DC]'}`}><input type="radio" name="pm" className="mr-2" checked={method === k} onChange={() => setMethod(k)} />{l}</label>)}</div>
    {method === 'wallet' && bal < t.total && <p className="text-sm font-semibold text-[#B90013]">Balance too low. <Link to="/client/wallet" className="underline">Fund wallet</Link></p>}
    {method === 'bank' && <p className="rounded-xl bg-[#F3F1F1] p-3 text-xs text-[#55515A]">DEMO transfer details: WakaStore Demo Ltd · 0000000000 · Demo Bank. No real transfer is needed; press the button to simulate confirmation.</p>}
    <label className="flex items-center gap-2 text-xs text-[#55515A]"><input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />Simulate a failed payment</label>
    <Btn onClick={pay} disabled={busy || !groups.length || !addr.trim()} className="w-full">{busy ? 'Processing…' : `Pay ${fmt(t.total)} (demo)`}</Btn></Card>
}

export function Cart() {
  const { state, cart, setCart } = useStore()
  const lines = cart.map((c) => ({ c, p: state.products.find((p) => p.id === c.productId) })).filter((x) => x.p)
  const groups = useMemo(() => Object.values(lines.reduce((a, { c, p }) => { (a[p.merchantId] ||= { merchantId: p.merchantId, items: [] }).items.push({ productId: p.id, name: p.name, unit: p.unit, quantity: c.quantity, unitPrice: p.price }); return a }, {})), [cart, state.products])
  const set = (id, q) => setCart(cart.map((c) => c.productId === id ? { ...c, quantity: q } : c).filter((c) => c.quantity > 0))
  if (!lines.length) return <div><H1>Cart</H1><Empty>Your cart is empty. <Link to="/client/marketplace" className="font-semibold text-[#ED0018]">Explore materials</Link></Empty></div>
  return <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><div><H1 sub="Grouped by merchant">Cart</H1>{groups.map((g) => <Card key={g.merchantId} className="mb-3"><b>{mName(state, g.merchantId)}</b>{g.items.map((i) => { const p = state.products.find((x) => x.id === i.productId); return <div key={i.productId} className="mt-3 flex items-center justify-between gap-2 text-sm"><div><b>{i.name}</b><div className="text-xs text-[#85818A]">{fmt(i.unitPrice)} / {i.unit.replace(/s$/, '')}</div></div><div className="flex items-center gap-1"><Btn v="ghost" className="!min-h-8 !px-2" aria-label="Decrease" onClick={() => set(i.productId, i.quantity - 1)}>−</Btn><span className="w-8 text-center">{i.quantity}</span><Btn v="ghost" className="!min-h-8 !px-2" aria-label="Increase" disabled={i.quantity >= p.stock} onClick={() => set(i.productId, i.quantity + 1)}>+</Btn><Btn v="ghost" className="!min-h-8 !px-2" aria-label="Remove" onClick={() => set(i.productId, 0)}><I.Trash2 size={14} /></Btn></div></div> })}</Card>)}</div>
    <CheckoutPanel groups={groups} onSuccess={() => setCart([])} /></div>
}

/* ---------------- Quotations ---------------- */
export function Quotations() {
  const { state, user } = useStore(), list = state.quotations.filter((q) => q.customerId === user.id)
  return <div><div className="flex items-start justify-between"><H1 sub="Submit a materials list and compare merchants">Quotations</H1><Link to="/client/quotations/new"><Btn>New quotation</Btn></Link></div>
    {!list.length ? <Empty>No quotations yet.</Empty> : <div className="space-y-3">{list.map((q) => <Link key={q.id} to={`/client/quotations/${q.id}`} className="block"><Card className="flex items-center justify-between gap-3"><div><b>{q.name}</b><div className="text-xs text-[#85818A]">{q.id} · {q.items.length} lines · {when(q.createdAt)}</div></div><Badge s={q.status} /></Card></Link>)}</div>}</div>
}
export function NewQuotation() {
  const { user, run } = useStore(), nav = useNavigate()
  const [name, setName] = useState(''), [text, setText] = useState(''), [rows, setRows] = useState([]), [file, setFile] = useState('')
  const blank = () => ({ id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: '', quantity: 1, unit: 'bags', category: '', brand: '', specs: '', notes: '' })
  const extract = () => setRows([...rows, ...parseMaterialsList(text).map((r) => ({ ...r, id: `${r.id}-${Date.now()}`, unit: r.unit || 'pieces' }))])
  const patch = (id, k, v) => setRows(rows.map((r) => r.id === id ? { ...r, [k]: v } : r))
  const submit = () => { const r = run(E.submitQuotation, { customerId: user.id, name, lines: rows }, 'Quotation submitted'); if (r.ok) nav(`/client/quotations/${r.quotation.id}`) }
  return <div className="max-w-3xl space-y-4"><H1 sub="Step 1: add materials · Step 2: review · Step 3: submit">New quotation</H1>
    <Card className="space-y-3"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Quotation name (e.g. 3-bedroom bungalow)" aria-label="Quotation name" />
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={'Paste your list, one per line:\n50 bags of Dangote cement\n20 lengths of 12mm iron rod'} className="w-full rounded-xl border border-[#DCD9DC] p-3 text-sm outline-none focus:border-[#ED0018]" aria-label="Paste materials list" />
      <div className="flex flex-wrap items-center gap-2"><Btn onClick={extract} disabled={!text.trim()}>Convert to lines</Btn><Btn v="ghost" onClick={() => setRows([...rows, blank()])}><I.Plus size={16} />Add item</Btn>
        <label className="cursor-pointer rounded-xl border border-[#DCD9DC] px-4 py-2 text-sm font-semibold">Upload PDF/image<input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f.name); setText((t) => t || '10 bags of Dangote cement\n20 lengths of 12mm iron rod\n6 pieces of flush door') } }} /></label></div>
      {file && <p className="rounded-xl bg-[#F3F1F1] p-3 text-xs text-[#55515A]"><b>{file}</b> selected. DEMO extraction only: no real OCR ran. Sample lines were placed above, so review them before converting.</p>}</Card>
    {rows.length > 0 && <div className="space-y-3">{rows.map((r) => <Card key={r.id} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
      <Input value={r.name} onChange={(e) => patch(r.id, 'name', e.target.value)} placeholder="Material name" aria-label="Material name" /><Input type="number" min="1" value={r.quantity} onChange={(e) => patch(r.id, 'quantity', e.target.value)} aria-label="Quantity" />
      <Select value={r.unit} onChange={(e) => patch(r.id, 'unit', e.target.value)} aria-label="Unit">{[...new Set([r.unit, ...UNITS])].filter(Boolean).map((u) => <option key={u}>{u}</option>)}</Select>
      <Btn v="ghost" aria-label="Remove item" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}><I.Trash2 size={16} /></Btn>
      <Input className="sm:col-span-2" value={r.specs} onChange={(e) => patch(r.id, 'specs', e.target.value)} placeholder="Specifications (optional)" /><Input className="sm:col-span-2" value={r.notes} onChange={(e) => patch(r.id, 'notes', e.target.value)} placeholder="Notes (optional)" /></Card>)}
      <Btn onClick={submit} className="w-full">Submit quotation ({rows.length} lines)</Btn></div>}</div>
}
export function QuotationDetail() {
  const { id } = useParams(), { state, user } = useStore(), [pick, setPick] = useState(null)
  const q = state.quotations.find((x) => x.id === id && x.customerId === user.id)
  const m = useMemo(() => q && matchQuotation(q.items, state.merchants, state.products, state.settings.threshold), [q, state.products, state.merchants, state.settings])
  if (!q) return <Denied />
  const basket = bestBasket(m), sel = pick || Object.fromEntries(Object.entries(basket).map(([k, v]) => [k, v.merchantId]))
  const chosen = Object.fromEntries(m.perLine.map((x) => { const o = x.options.find((o) => o.merchantId === sel[x.line.id]); return o ? [x.line.id, o] : null }).filter(Boolean))
  const groups = groupSelectionByMerchant(chosen), converted = q.status === 'Converted to order'
  return <div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-2"><H1 sub={`${q.id} · ${q.items.length} lines · matching threshold ${m.threshold}% of product lines`}>{q.name}</H1><Badge s={q.status} /></div>
    {converted && <Card>Converted to an order. <Link className="font-semibold text-[#ED0018]" to={`/client/orders/${q.orderId}`}>Open order</Link></Card>}
    <div className="grid gap-3 md:grid-cols-3">{m.results.map((r) => <Card key={r.merchant.id} className={r.eligible ? '' : 'opacity-60'}><div className="flex items-start justify-between"><b>{r.merchant.name}</b><Badge s={r.eligible ? 'Eligible' : 'Below 60%'} /></div><div className="mt-2 font-[Manrope] text-3xl font-extrabold">{r.percentage}%</div><div className="text-xs text-[#85818A]">{r.matchedCount} of {r.totalLines} lines · {r.merchant.address}</div>{r.eligible && <div className="mt-2 text-sm">Est. subtotal {fmt(r.subtotal)}</div>}{r.unmatched.length > 0 && <div className="mt-2 text-xs text-[#B90013]">Missing: {r.unmatched.map((u) => u.line.name).join(', ')}</div>}</Card>)}</div>
    {m.quotationNeedsSourcing && <Card className="border-[#ED0018]">No merchant reached the threshold. This quotation was sent to Super Admin for manual sourcing.</Card>}
    {!converted && !m.quotationNeedsSourcing && <><div className="flex items-center justify-between"><h2 className="font-[Manrope] text-lg font-bold">Choose a merchant per item</h2><Btn v="ghost" onClick={() => setPick(null)}>Best basket</Btn></div>
      <div className="space-y-3">{m.perLine.map(({ line, options }) => <Card key={line.id}><b>{line.quantity} {line.unit} · {line.name}</b>{!options.length ? <p className="mt-1 text-sm text-[#B90013]">No eligible merchant has this. It won't be included in this order.</p> : <div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((o) => <label key={o.merchantId} className={`cursor-pointer rounded-xl border p-3 text-sm ${sel[line.id] === o.merchantId ? 'border-[#ED0018] bg-[#FFF0F1]' : 'border-[#DCD9DC]'}`}><input type="radio" className="mr-2" name={line.id} checked={sel[line.id] === o.merchantId} onChange={() => setPick({ ...sel, [line.id]: o.merchantId })} /><b>{o.merchantName}</b> · {fmt(o.unitPrice)}/{o.product.unit.replace(/s$/, '')}<div className="text-xs text-[#85818A]">{o.partial ? <span className="text-[#B90013]">Only {o.availableQty} available (short by {o.shortfall})</span> : 'Full quantity available'} · {fmt(o.lineTotal)}</div></label>)}</div>}</Card>)}</div>
      {groups.length > 0 && <CheckoutPanel groups={groups} quotationId={q.id} />}</>}</div>
}

/* ---------------- Orders ---------------- */
export function Orders() {
  const { state, user } = useStore(), list = state.orders.filter((o) => o.customerId === user.id)
  return <div><H1>Orders</H1>{!list.length ? <Empty>No orders yet.</Empty> : <div className="space-y-3">{list.map((o) => <Link key={o.id} to={`/client/orders/${o.id}`} className="block"><Card className="flex items-center justify-between gap-3"><div><b>{o.ref}</b><div className="text-xs text-[#85818A]">{when(o.createdAt)} · {state.subOrders.filter((s) => s.orderId === o.id && s.status !== 'Rejected').length} merchant group(s)</div></div><div className="text-right"><div className="font-bold">{fmt(o.total)}</div><Badge s={o.status} /></div></Card></Link>)}</div>}</div>
}
function RefundForm({ sub, onDone }) {
  const { user, run } = useStore(), [pid, setPid] = useState(sub.items[0].productId), [qty, setQty] = useState(1), [reason, setReason] = useState('Item not delivered'), [d, setD] = useState('')
  return <div className="mt-3 space-y-2 rounded-xl bg-[#FFF7F8] p-3"><Select value={pid} onChange={(e) => setPid(e.target.value)} className="w-full" aria-label="Item">{sub.items.map((i) => <option key={i.productId} value={i.productId}>{i.name} (ordered {i.quantity})</option>)}</Select>
    <div className="grid grid-cols-2 gap-2"><Input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="Quantity affected" /><Select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">{['Item not delivered', 'Missing quantity', 'Wrong product', 'Damaged product', 'Other'].map((r) => <option key={r}>{r}</option>)}</Select></div>
    <Input value={d} onChange={(e) => setD(e.target.value)} placeholder="Describe the issue" /><Btn onClick={() => { const r = run(E.requestRefund, { customerId: user.id, subId: sub.id, items: [{ productId: pid, quantity: qty }], reason, details: d }, 'Refund request submitted'); if (r.ok) onDone() }}>Submit refund request</Btn></div>
}
export function OrderDetail() {
  const { id } = useParams(), { state, user, run } = useStore(), [rf, setRf] = useState(null)
  const o = state.orders.find((x) => x.id === id && x.customerId === user.id); if (!o) return <Denied />
  const subs = state.subOrders.filter((s) => s.orderId === o.id), rec = state.receipts.find((r) => r.orderId === o.id), refunds = state.refunds.filter((r) => r.orderId === o.id)
  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-2"><H1 sub={`${when(o.createdAt)} · ${o.address.line}`}>{o.ref}</H1><Badge s={o.status} /></div>
    <Card className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>Paid {fmt(o.total)} (items {fmt(o.subtotal)} + fee {fmt(o.fee)}) · ref {o.paymentRef}</span>{rec && <Link to={`/client/receipt/${rec.id}`}><Btn v="ghost">View receipt</Btn></Link>}</Card>
    {subs.map((s) => <Card key={s.id} className={s.status === 'Rejected' ? 'opacity-60' : ''}><div className="flex items-start justify-between"><b>{mName(state, s.merchantId)}</b><Badge s={s.status} /></div>{s.reassignedFrom && <p className="text-xs text-[#85818A]">Reassigned from another merchant</p>}{s.tracking && <p className="text-xs text-[#85818A]">Tracking: {s.tracking} (demo)</p>}
      {s.items.map((i) => <div key={i.productId} className="flex justify-between py-1 text-sm"><span>{i.quantity} {i.unit} · {i.name}</span><span>{fmt(i.lineTotal)}</span></div>)}
      <div className="mt-2 flex flex-wrap gap-2">{s.status === 'Delivered' && <Btn onClick={() => run(E.confirmReceipt, { subId: s.id, customerId: user.id }, 'Receipt confirmed')}>Confirm receipt</Btn>}
        {['Dispatched', 'Delivered', 'Completed'].includes(s.status) && <Btn v="ghost" onClick={() => setRf(rf === s.id ? null : s.id)}>Report a problem / refund</Btn>}</div>{rf === s.id && <RefundForm sub={s} onDone={() => setRf(null)} />}</Card>)}
    {refunds.length > 0 && <Card><b>Refunds</b>{refunds.map((r) => <div key={r.id} className="flex justify-between py-1 text-sm"><span>{r.id} · {r.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')} · {fmt(r.amount)}</span><Badge s={r.status} /></div>)}</Card>}
    <Card><b>Timeline</b>{[...o.timeline].reverse().map((t, i) => <div key={i} className="flex gap-3 border-l-2 border-[#F5D5D9] py-1.5 pl-3 text-sm"><span className="w-36 shrink-0 text-xs text-[#85818A]">{when(t.at)}</span><span>{t.event} <span className="text-[#85818A]">· {t.by}</span></span></div>)}</Card></div>
}
export function Receipt() {
  const { id } = useParams(), { state, user } = useStore(), nav = useNavigate()
  const r = state.receipts.find((x) => x.id === id), o = r && state.orders.find((x) => x.id === r.orderId), p = r && state.payments.find((x) => x.id === r.paymentId)
  if (!r || (user.role === 'customer' && o.customerId !== user.id)) return <Denied />
  const cust = state.users.find((u) => u.id === o.customerId), subs = state.subOrders.filter((s) => s.orderId === o.id && s.status !== 'Rejected')
  return <div className="mx-auto max-w-2xl bg-white p-6 print:p-0"><div className="mb-4 flex gap-2 print:hidden"><Btn v="ghost" onClick={() => nav(-1)}>Back</Btn><Btn onClick={() => window.print()}><I.Printer size={16} />Print / Save as PDF</Btn></div>
    <div className="rounded-2xl border border-[#F5D5D9] p-6 print:border-0"><div className="flex items-start justify-between"><img src="/logo.webp" alt="WakaStore" className="h-9" /><div className="text-right text-sm"><b>Receipt {r.number}</b><div>{when(r.createdAt)}</div></div></div>
      <div className="mt-4 grid gap-1 text-sm sm:grid-cols-2"><div><b>Order</b> {o.ref}</div><div><b>Payment ref</b> {p.ref}</div><div><b>Method</b> {p.method}</div><div><b>Status</b> {p.status}</div><div><b>Customer</b> {cust.name} · {cust.email}</div><div><b>Deliver to</b> {o.address.line}</div></div>
      {subs.map((s) => <div key={s.id} className="mt-4"><b className="text-sm">{mName(state, s.merchantId)}</b>{s.items.map((i) => <div key={i.productId} className="flex justify-between gap-2 border-b border-[#F3F1F1] py-1 text-sm"><span>{i.name} · {i.quantity} {i.unit} × {fmt(i.unitPrice)}</span><span>{fmt(i.lineTotal)}</span></div>)}<div className="flex justify-between py-1 text-sm font-semibold"><span>Merchant subtotal</span><span>{fmt(s.subtotal)}</span></div></div>)}
      <div className="mt-4 space-y-1 border-t pt-3 text-sm"><div className="flex justify-between"><span>Merchandise</span><span>{fmt(o.subtotal)}</span></div><div className="flex justify-between"><span>WakaStore checkout fee</span><span>{fmt(o.fee)}</span></div>{o.refundedTotal > 0 && <div className="flex justify-between"><span>Refunded</span><span>−{fmt(o.refundedTotal)}</span></div>}<div className="flex justify-between font-[Manrope] text-lg font-extrabold"><span>Total paid</span><span>{fmt(o.total)}</span></div></div>
      <p className="mt-6 text-xs text-[#55515A]">Thank you for shopping with WakaStore. {r.disclaimer}</p></div></div>
}

/* ---------------- Wallet ---------------- */
export function WalletPage() {
  const { state, user, run } = useStore(), [amt, setAmt] = useState(100000), [method, setMethod] = useState('card'), [fail, setFail] = useState(false)
  const tx = state.wallet.filter((t) => t.customerId === user.id).slice().reverse(), ok = tx.filter((t) => t.status === 'success'), sum = (k) => ok.filter((t) => t.kind === k).reduce((n, t) => n + t.amount, 0)
  return <div className="space-y-5"><div className="flex items-start justify-between"><H1>WakaWallet</H1><Demo /></div>
    <div className="rounded-3xl bg-[#171717] p-6 text-white"><div className="text-sm text-[#DCD9DC]">Available balance (demo)</div><div className="font-[Manrope] text-4xl font-extrabold">{fmt(E.walletBalance(state, user.id))}</div><div className="mt-3 flex flex-wrap gap-4 text-xs text-[#DCD9DC]"><span>Funded {fmt(sum('funding'))}</span><span>Spent {fmt(sum('payment'))}</span><span>Refunds {fmt(sum('refund'))}</span></div></div>
    <Card className="space-y-3"><b>Add money (simulated)</b><div className="flex flex-wrap gap-2">{[50000, 100000, 500000, 2000000].map((a) => <Btn key={a} v={amt === a ? 'dark' : 'ghost'} onClick={() => setAmt(a)}>{fmt(a)}</Btn>)}</div>
      <div className="grid gap-2 sm:grid-cols-2"><Select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method"><option value="card">Card</option><option value="bank">Bank transfer</option></Select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />Simulate failure</label></div>
      <Btn onClick={() => run(E.fundWallet, { customerId: user.id, amount: amt, method, simulate: fail ? 'fail' : 'success' }, 'Wallet funded (demo)')}>Add {fmt(amt)}</Btn></Card>
    <div><h2 className="mb-2 font-[Manrope] text-lg font-bold">Transactions</h2>{tx.map((t) => <Card key={t.id} className="mb-2 flex items-center justify-between gap-3 text-sm"><div><b className="capitalize">{t.kind}</b><div className="text-xs text-[#85818A]">{t.ref} · {when(t.date)}</div></div><div className="text-right"><b className={t.type === 'credit' ? 'text-emerald-700' : ''}>{t.type === 'credit' ? '+' : '−'}{fmt(t.amount)}</b><div><Badge s={t.status} /></div></div></Card>)}</div></div>
}
