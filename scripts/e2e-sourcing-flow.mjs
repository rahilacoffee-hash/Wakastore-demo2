// Browser-like (jsdom) acceptance test for the item-level sourcing / rerouting workflow across the
// REAL customer and merchant screens. Not a substitute for real-device testing.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import assert from 'node:assert/strict'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
const g = globalThis
const def = (k, v) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true })
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent', 'File', 'FileReader', 'localStorage', 'sessionStorage', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'MutationObserver', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'SVGElement', 'Element']) def(k, dom.window[k])
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
dom.window.scrollTo = () => {}; dom.window.HTMLElement.prototype.scrollIntoView = () => {}
g.IS_REACT_ACT_ENVIRONMENT = true
g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
const errors = []
const origErr = console.error
console.error = (...a) => { const m = String(a[0]); if (!/not wrapped in act/.test(m)) errors.push(m.slice(0, 220)); origErr.apply(console, a) }

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const React = (await import('react')).default
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { MemoryRouter } = await import('react-router-dom')
const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx')
const { defaultState } = await vite.ssrLoadModule('/src/context/AppStateContext.jsx')
const KEY = 'waka-demo-v2'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const btn = (re) => $$('button, a').find((e) => re.test(e.textContent))
const text = () => document.body.textContent
async function click(el, what = '') { assert(el, `element to click not found ${what}`); await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })) }) }
async function type(el, value) {
  assert(el, 'input not found')
  const proto = el.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new dom.window.Event('input', { bubbles: true })) })
}
async function waitFor(fn, ms = 4000, what = 'condition') { const t = Date.now(); while (Date.now() - t < ms) { if (await act(async () => fn())) return; await act(async () => { await sleep(60) }) } throw new Error('Timed out: ' + what + '\n' + text().slice(0, 500)) }
const saved = () => JSON.parse(localStorage.getItem(KEY))
let passed = 0
const ok = (m) => { passed++; console.log('ok  ', m) }

// ---------- fixture: two merchants, one order with four materials, cement in stock nowhere ----------
const IRON = 'Iron Rods & Reinforcement Materials Merchant', SAND = 'Sand Merchant', ROOF = 'Roofing Materials & Accessories Merchant', CEM = 'Cement Merchant'
const mer = (id, name, categories, extra = {}) => ({ id, name, status: 'approved', active: true, categories, address: 'Abuja', contact: '0800', description: '', approvedAt: '2026-01-01', ...extra })
const prod = (id, merchantId, merchant, name, category, price, stock, unit) => ({ id, merchantId, merchant, name, category, price, stock, unit, available: true, image: '/hero.webp', description: '' })
const fixture = {
  ...defaultState,
  merchants: [mer('mA', 'Merchant A', [IRON, SAND, ROOF]), mer('mB', 'Merchant B', [CEM], { acceptsSourcing: true })],
  merchantUsers: [{ email: 'a@m.test', merchantId: 'mA' }, { email: 'b@m.test', merchantId: 'mB' }],
  products: [
    prod('pA1', 'mA', 'Merchant A', 'Iron Rod 12mm', IRON, 5200, 500, 'pieces'),
    prod('pA2', 'mA', 'Merchant A', 'Sharp Sand', SAND, 18000, 100, 'tonnes'),
    prod('pA3', 'mA', 'Merchant A', 'Longspan Roofing Sheet', ROOF, 7800, 400, 'pieces'),
    prod('pA4', 'mA', 'Merchant A', 'Cement 50kg', CEM, 9500, 0, 'bags'),
    prod('pB1', 'mB', 'Merchant B', 'Cement 50kg', CEM, 9800, 0, 'bags'),
  ],
  wallet: { balance: 5000000, history: [] },
  cart: [], orders: [], sourcing: [], notifications: [], auditLogs: [],
  quotations: [{ id: 'QT-9001', name: 'Bungalow', date: '13 Nov 2026', status: 'Matched', items: [
    { id: 'l1', name: 'Cement', specs: '', quantity: 50, unit: 'bags', notes: '' },
    { id: 'l2', name: 'Iron Rod 12mm', specs: '', quantity: 40, unit: 'pieces', notes: '' },
    { id: 'l3', name: 'Sharp Sand', specs: '', quantity: 10, unit: 'tonnes', notes: '' },
    { id: 'l4', name: 'Longspan Roofing Sheet', specs: '', quantity: 30, unit: 'pieces', notes: '' },
  ] }],
  session: { role: 'customer', name: 'Ada Okafor', email: 'ada@example.test' },
}
localStorage.setItem(KEY, JSON.stringify(fixture))

let root
async function as(session, path) {
  if (root) await act(async () => root.unmount())
  const s = saved(); s.session = session; localStorage.setItem(KEY, JSON.stringify(s))
  document.body.innerHTML = '<div id="root"></div>'
  root = createRoot($('#root'))
  await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App))) })
}
const CUST = { role: 'customer', name: 'Ada Okafor', email: 'ada@example.test' }
const MA = { role: 'merchant', name: 'Merchant A', email: 'a@m.test', merchantId: 'mA' }
const MB = { role: 'merchant', name: 'Merchant B', email: 'b@m.test', merchantId: 'mB' }
const item = (o, name) => o.items.find((i) => i.name === name)

// The app merges its own demo merchants/products into saved state on load. Hydrate once, then park every
// demo merchant except A and B (suspended, zero stock) so this scenario is deterministic.
await as(CUST, '/client/overview')
{
  const st = saved()
  st.merchants = st.merchants.map((m) => (['mA', 'mB'].includes(m.id) ? m : { ...m, status: 'suspended' }))
  st.products = st.products.map((p) => (['mA', 'mB'].includes(p.merchantId) ? p : { ...p, stock: 0, available: false }))
  localStorage.setItem(KEY, JSON.stringify(st))
}

// ---------- 1. Customer: the unavailable material stays in the order ----------
await as(CUST, '/client/quotations/QT-9001')
assert.match(text(), /Not currently in stock/); assert.match(text(), /Merchant A will confirm whether they can source it/)
assert.doesNotMatch(text(), /It won't be in this order/); ok('quotation: unavailable cement is kept, with the assigned merchant named (no "won\'t be in this order")')
assert.match(text(), /not in stock, kept in your order/)
await click(btn(/Continue to checkout/))
await waitFor(() => /Place order/.test(text()), 3000, 'checkout')
const cart = saved().cart
assert.equal(cart.length, 4, 'cart has all four lines'); const src = cart.find((c) => c.kind === 'sourcing')
assert(src && src.name === 'Cement' && src.merchantId === 'mA' && src.quantity === 50); ok('cart keeps the unavailable line, assigned to Merchant A')
await type($('input[placeholder="Full name"]'), 'Ada Okafor'); await type($('input[placeholder="080..."]'), '08012345678')
await type($('input[placeholder="House number, street, estate"]'), '1 Test Street'); await type($('input[placeholder="e.g. Abuja"]'), 'Abuja'); await type($('input[placeholder="e.g. FCT"]'), 'FCT')
await click(btn(/Place order/))
await waitFor(() => saved().orders.length === 1, 3000, 'order created')
let order = saved().orders[0]
assert.equal(order.items.length, 4); assert.equal(order.subOrders.length, 1)
const cem0 = item(order, 'Cement')
assert.equal(cem0.sourcingStatus, 'SOURCING_REQUESTED'); assert.equal(cem0.currentMerchantId, 'mA'); assert.equal(cem0.unitPrice, null); assert.equal(cem0.quantity, 50)
const pricedSubtotal = 40 * 5200 + 10 * 18000 + 30 * 7800
assert.equal(order.subtotal, pricedSubtotal, 'only priced lines are charged'); assert.equal(order.total, pricedSubtotal + Math.round(pricedSubtotal * 0.025) + 3500)
assert.equal(saved().wallet.balance, 5000000 - order.total); ok('order placed: 4 items, cement unpriced and unpaid, others charged')
await waitFor(() => /Your materials, item by item/.test(text()), 3000, 'order page')
assert.match(text(), /Waiting for the merchant to confirm sourcing/); assert.match(text(), /Price: pending/); ok('customer sees cement as waiting for sourcing confirmation')
const ORDER_ID = order.id

// ---------- 2. Merchant A: sees every item, prominent sourcing control, explicit confirmation ----------
await as(MA, '/merchant/orders')
assert.match(text(), /Incoming orders/); assert.match(text(), /Availability: Not currently in stock/)
assert.equal($$('li[data-item]').length, 4, 'merchant sees all four items assigned to them')
assert(btn(/Cannot source this product/)); assert(!btn(/Confirm sourcing/), 'no confirm button until the box is ticked'); ok('merchant A sees the unavailable item with the sourcing controls')
const box = $$('label').find((l) => /I can source this product\./.test(l.textContent)).querySelector('input')
assert.equal(box.checked, false, 'unchecked by default')
await click(box); assert(btn(/Confirm sourcing/)); assert($('input[aria-label^="Sourcing price"]')); assert($('input[aria-label="Expected timeframe"]')); assert($('input[aria-label="Supplier"]'))
await click(btn(/Confirm sourcing/)); assert.match(text(), /Enter the sourcing price/); assert.equal(saved().orders[0].items.find((i) => i.name === 'Cement').sourcingStatus, 'SOURCING_REQUESTED'); ok('confirmation requires price, timeframe and final-price tick')
await click(box)  // untick again: unchecked is NOT a confirmation
// ---------- 3. Merchant A cannot source cement: ONLY cement is rerouted ----------
await click(btn(/Cannot source this product/)); assert.match(text(), /Only this product will be offered to another eligible merchant/)
await click(btn(/Yes, I cannot source it/))
await waitFor(() => item(saved().orders[0], 'Cement').currentMerchantId === 'mB', 3000, 'rerouted')
order = saved().orders[0]
assert.equal(item(order, 'Cement').currentMerchantId, 'mB'); assert.equal(item(order, 'Cement').originalMerchantId, 'mA'); assert.equal(item(order, 'Cement').sourcingStatus, 'REROUTED')
for (const n of ['Iron Rod 12mm', 'Sharp Sand', 'Longspan Roofing Sheet']) assert.equal(item(order, n).currentMerchantId, 'mA', `${n} stays with Merchant A`)
assert.equal(order.subOrders.length, 2); assert.equal(order.id, ORDER_ID, 'still ONE order'); ok('only cement moved to Merchant B; rods, sand and roofing stay with Merchant A')
assert(item(order, 'Cement').history.some((h) => h.type === 'SOURCING_DECLINED' && h.by === 'mA')); assert(item(order, 'Cement').history.some((h) => h.type === 'REROUTED' && h.from === 'mA' && h.to === 'mB')); ok('rerouting history preserved')
assert.equal($$('li[data-item]').length, 3, 'A now sees 3 items'); assert.match(text(), /no longer assigned to you/i); assert.doesNotMatch(text(), /Availability: Not currently in stock/); ok('merchant A sees the item only as history')

// ---------- 4. Customer sees one coordinated order with two merchants ----------
await as(CUST, `/client/orders/${ORDER_ID}`)
assert.match(text(), /One order · 2 merchants/); assert.match(text(), /Rerouted from Merchant A/); assert.match(text(), /Moved to another merchant, awaiting their confirmation/)
const li = (name) => $$('li[data-item]').find((l) => l.textContent.includes(name))
assert.match(li('Cement').textContent, /Supplier: Merchant B/); assert.match(li('Sharp Sand').textContent, /Supplier: Merchant A/); ok('customer sees per-item suppliers and the reroute')
assert(saved().notifications.some((n) => /Item reassigned/.test(n.title) && !n.recipientMerchantId)); assert(saved().notifications.some((n) => /New item assigned/.test(n.title) && n.recipientMerchantId === 'mB')); ok('both customer and Merchant B were notified')

// ---------- 5. Merchant B: sees ONLY its item, confirms sourcing ----------
await as(MB, '/merchant/orders')
assert.equal($$('li[data-item]').length, 1); assert.match(text(), /Cement/); assert.doesNotMatch(text(), /Iron Rod|Sharp Sand|Longspan/); assert.match(text(), /rerouted to you/); ok('merchant B sees only the rerouted item (not Merchant A\'s items)')
await click($$('label').find((l) => /I can source this product\./.test(l.textContent)).querySelector('input'))
await type($('input[aria-label^="Sourcing price"]'), '11000'); await type($('input[aria-label="Expected timeframe"]'), '3 days'); await type($('input[aria-label="Supplier"]'), 'Lagos depot')
await click(btn(/Confirm sourcing/)); assert.match(text(), /final price/i); assert.equal(item(saved().orders[0], 'Cement').sourcingStatus, 'REROUTED', 'not confirmed without the final-price tick')
await click($$('label').find((l) => /I confirm this is my final price/.test(l.textContent)).querySelector('input')); await click(btn(/Confirm sourcing/))
await waitFor(() => item(saved().orders[0], 'Cement').sourcingStatus === 'SOURCING_CONFIRMED', 3000, 'sourcing confirmed')
order = saved().orders[0]; const cem = item(order, 'Cement')
assert.equal(cem.unitPrice, 11000); assert.equal(cem.sourcing.eta, '3 days'); assert(cem.sourcing.confirmedAt); assert.equal(cem.currentMerchantId, 'mB'); assert.equal(cem.priceApproval.status, 'PENDING')
assert.equal(order.total, pricedSubtotal + Math.round(pricedSubtotal * 0.025) + 3500, 'order total NOT silently increased'); ok('merchant B confirms sourcing; the price awaits the customer and the order total does not change')
assert.match(text(), /Waiting for the customer to approve this price/)

// ---------- 6. Customer approves the new price ----------
const balBefore = saved().wallet.balance
await as(CUST, `/client/orders/${ORDER_ID}`)
assert.match(text(), /New price needs your approval/); assert.match(text(), /not charged until you approve/)
await click(btn(/Approve price/))
await waitFor(() => item(saved().orders[0], 'Cement').priceApproval.status === 'APPROVED', 3000, 'approved')
order = saved().orders[0]
const extra = 550000 + Math.round(550000 * 0.025)
assert.equal(saved().wallet.balance, balBefore - extra, 'charged only after approval'); assert.equal(order.subtotal, pricedSubtotal + 550000); ok('customer approves: total updated, wallet charged only now (simulated)')

// ---------- 7. Item-level fulfilment, acceptance and per-merchant 95/5 settlement ----------
const step = async (session, name, labels) => { await as(session, '/merchant/orders'); for (const label of labels) { const card = $$('li[data-item]').find((l) => l.textContent.includes(name)); await click([...card.querySelectorAll('button')].find((b) => b.textContent.includes(label)), label) } }
await step(MA, 'Sharp Sand', ['Mark as preparing']); await step(MA, 'Sharp Sand', ['Mark as ready']); await step(MA, 'Sharp Sand', ['Mark as dispatched']); await step(MA, 'Sharp Sand', ['Mark as delivered'])
for (const l of ['Mark as preparing', 'Mark as ready', 'Mark as dispatched', 'Mark as delivered']) await step(MB, 'Cement', [l])
order = saved().orders[0]
assert.equal(item(order, 'Sharp Sand').fulfilment, 'DELIVERED'); assert.equal(item(order, 'Cement').fulfilment, 'DELIVERED'); assert.equal(item(order, 'Iron Rod 12mm').fulfilment, 'PENDING', 'other items track on their own'); ok('item-level fulfilment tracked independently per item and merchant')
await as(CUST, `/client/orders/${ORDER_ID}`)
for (const name of ['Sharp Sand', 'Cement']) await click([...li(name).querySelectorAll('button')].find((b) => /I received this/.test(b.textContent)), `accept ${name}`)
order = saved().orders[0]
const settle = Object.fromEntries(order.ledger.map((l) => [l.itemId, l]))
assert.equal(order.ledger.length, 2)
assert.deepEqual([settle[item(order, 'Sharp Sand').itemId].merchantId, settle[item(order, 'Sharp Sand').itemId].merchantShare, settle[item(order, 'Sharp Sand').itemId].commission], ['mA', 171000, 9000])
assert.deepEqual([settle[item(order, 'Cement').itemId].merchantId, settle[item(order, 'Cement').itemId].merchantShare, settle[item(order, 'Cement').itemId].commission], ['mB', 522500, 27500])
assert(order.ledger.every((l) => l.simulated)); ok('95/5 settled per item to the supplying merchant only: A gets sand, B gets cement (simulation)')
assert.match(text(), /SIMULATION/); assert.match(text(), /Merchant B: settled/)

// ---------- 8. Role isolation: customers and admins cannot use merchant actions ----------
await as(CUST, '/merchant/orders'); assert.doesNotMatch(text(), /Incoming orders/); ok('customer cannot open the merchant workspace')

// ---------- 9. No eligible merchant -> UNRESOLVED -> Super Admin assigns by hand ----------
const SV = await vite.ssrLoadModule('/src/services/sourcing.js')
{
  const st = saved()
  st.merchants = st.merchants.map((m) => (m.id === 'mB' ? { ...m, acceptsSourcing: false } : m))   // B can no longer source
  const items = SV.buildItems('WK-2', [{ lineId: 'x1', name: 'Cement', quantity: 20, unit: 'bags', merchantId: 'mA', unavailable: true }, { lineId: 'x2', name: 'Iron Rod 12mm', quantity: 10, unit: 'pieces', productRef: 'pA1', unitPrice: 5200, merchantId: 'mA' }])
  st.orders = [SV.rebuildSubOrders({ id: 'WK-2', status: 'Paid', paymentMethod: 'wallet', customerEmail: 'ada@example.test', date: 'today', subtotal: 52000, wakastoreFee: 1300, deliveryFee: 3500, total: 56800, items, subOrders: [], ledger: [] }, st.merchants), ...st.orders]
  localStorage.setItem(KEY, JSON.stringify(st))
}
await as(MA, '/merchant/orders')
{
  const card = $$('[data-order="WK-2"]')[0]
  await click([...card.querySelectorAll('button')].find((b) => /Cannot source this product/.test(b.textContent)))
  await click([...card.querySelectorAll('button')].find((b) => /Yes, I cannot source it/.test(b.textContent)))
}
await waitFor(() => saved().orders.find((o) => o.id === 'WK-2').items[0].sourcingStatus === 'UNRESOLVED', 3000, 'unresolved')
{
  const o2 = saved().orders.find((o) => o.id === 'WK-2')
  assert.equal(o2.items[0].currentMerchantId, null); assert.equal(o2.items[1].currentMerchantId, 'mA', 'iron rod unaffected'); assert(o2.items[0].history.some((h) => h.type === 'NO_ELIGIBLE_MERCHANT'))
  assert(saved().sourcing.some((e) => e.orderId === 'WK-2' && e.itemId === o2.items[0].itemId)); ok('no eligible merchant: item stays in the order as UNRESOLVED and joins the manual sourcing queue')
}
await as(CUST, '/client/orders/WK-2'); assert.match(text(), /Unresolved: needs manual sourcing/); assert.match(text(), /Supplier: Not assigned yet/); ok('customer sees the unresolved item (never shown as sourced)')
await as({ role: 'admin', name: 'Admin', email: 'admin@waka.test' }, '/admin/sourcing'); assert.doesNotMatch(text(), /Manual sourcing/); ok('plain Admin cannot open Super Admin sourcing')
await as({ role: 'super-admin', name: 'Super', email: 'super@waka.test' }, '/admin/sourcing')
assert.match(text(), /Awaiting manual sourcing/)
{
  const sel = $('select[aria-label="Merchant for Cement"]'); assert(sel)
  assert(![...sel.options].some((o) => o.value === 'mA'), 'a merchant who already declined is not offered')
  await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, 'value').set.call(sel, 'mB'); sel.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  await click(btn(/Assign sourcing/))
}
await waitFor(() => saved().orders.find((o) => o.id === 'WK-2').items[0].currentMerchantId === 'mB', 3000, 'assigned')
assert.equal(saved().orders.find((o) => o.id === 'WK-2').items[0].sourcingStatus, 'SOURCING_REQUESTED', 'assigned, NOT claimed as sourced'); ok('Super Admin assigns it by hand; the merchant must still confirm')
await as(MB, '/merchant/orders'); assert.match(text(), /Availability: Not currently in stock/); ok('merchant B receives the manually assigned item')

console.log(errors.length ? `\nConsole errors: ${errors.length}\n${errors.join('\n')}` : '\nNo React console errors.')
console.log(`${passed} checks passed`)
await vite.close(); process.exit(errors.length ? 1 : 0)
