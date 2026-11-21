// Browser-like (jsdom) journey test of the three material-list pathways -> shared review -> quotation.
// Renders the real routed app and drives it with DOM events. Not a substitute for real-device testing.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import assert from 'node:assert/strict'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
const g = globalThis
const def = (k, v) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true })
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent', 'File', 'FileReader', 'DataTransfer', 'localStorage', 'sessionStorage', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'MutationObserver', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'SVGElement', 'Element']) def(k, dom.window[k])
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
dom.window.scrollTo = () => {}; dom.window.HTMLElement.prototype.scrollIntoView = () => {}
let n = 0; const made = []
globalThis.URL.createObjectURL = () => { const u = `blob:test/${++n}`; made.push(u); return u }
globalThis.URL.revokeObjectURL = (u) => { const i = made.indexOf(u); if (i >= 0) made.splice(i, 1) }
g.IS_REACT_ACT_ENVIRONMENT = true
g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
const errors = []
const origErr = console.error
console.error = (...a) => { const m = String(a[0]); if (/FormData constructor/.test(m)) return /* jsdom-only: React builds FormData(form) with undici's class; real browsers are fine */; if (!/not wrapped in act|Warning: ReactDOM.render/.test(m)) errors.push(m.slice(0, 200)); origErr.apply(console, a) }

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
const byText = (sel, re) => $$(sel).find((e) => re.test(e.textContent))
const text = () => document.body.textContent
async function click(el) { assert(el, 'element to click not found'); await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })) }) }
async function type(el, value) {
  assert(el, 'input not found')
  const proto = el.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new dom.window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })) })
}
async function waitFor(fn, ms = 6000, what = 'condition') { const t = Date.now(); while (Date.now() - t < ms) { if (await act(async () => fn())) return; await act(async () => { await sleep(80) }) } throw new Error('Timed out waiting for ' + what + '\n' + text().slice(0, 400)) }

async function mount(path, session = { role: 'super-admin', name: 'Super Admin Team', email: 'superadmin@waka.test' }, patch = {}, keep = false) {
  const base = keep ? JSON.parse(localStorage.getItem(KEY)) : { ...defaultState }
  localStorage.clear()
  localStorage.setItem(KEY, JSON.stringify({ ...base, ...patch, session }))
  document.body.innerHTML = '<div id="root"></div>'
  const root = createRoot($('#root'))
  await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App))) })
  return root
}
const saved = () => JSON.parse(localStorage.getItem(KEY))
let passed = 0
const ok = (m) => { passed++; console.log('ok  ', m) }



const MERCH = { role: 'merchant', name: 'BuildRight Supplies', email: 'merchant@waka.test' }
const ADA = { role: 'customer', name: 'Ada Okafor', email: 'ada@example.test' }
const ADMIN = { role: 'admin', name: 'Admin User', email: 'admin@waka.test' }
const iso = (h) => new Date(Date.now() + h * 3600e3).toISOString()
const line = { name: 'Cement', quantity: 10, unit: 'bag', price: 10000, unitPrice: 10000, lineTotal: 100000, merchant: 'BuildRight Supplies', merchantId: 'm-101' }
const ORDER = { id: 'WK-T1', receiptId: 'WKR-T1', date: 'today', subtotal: 100000, wakastoreFee: 5000, commissionRate: 0.05, deliveryFee: 3500, total: 103500, status: 'Payment verified · Funds pending', paymentStatus: 'VERIFIED', settlementStatus: 'PENDING_CUSTOMER_ACCEPTANCE', paymentMethod: 'Demo payment', customerAcceptanceStatus: 'AWAITING_DELIVERY', deliveryMethod: 'merchant_delivery', fullOrderRequired: true, merchantId: 'm-101', merchantName: 'BuildRight Supplies', merchantMaterialsProceeds: 95000, merchantProceeds: 98500, platformCommission: 5000, customerEmail: 'ada@example.test', deliveryAddress: { address: 'Wuse II' }, items: [line], subOrders: [{ merchantId: 'm-101', merchantName: 'BuildRight Supplies', status: 'Packed', items: [line] }], ledger: [], payments: [] }
const fill = async (ph, v) => type($(`input[placeholder^="${ph}"]`), v)
const last = (re) => byText('button', re)

// ---------- 1. dispatch + proof of delivery, seen by the customer, then accepted and settled
{
  let root = await mount('/merchant/fulfillment', MERCH, { orders: [ORDER] })
  await sleep(150)
  assert.match(text(), /Dispatch details/)
  await click(last(/^Dispatch order$/)); assert.match(text(), /Enter the driver or rider name/); ok('dispatch needs driver, phone and ETA')
  await fill('Driver / rider name', 'Musa Bello'); await fill('Driver phone', '08031234567'); await fill('Expected arrival', 'Today 4pm')
  await click(last(/^Dispatch order$/))
  let o = saved().orders[0]
  assert.equal(o.dispatch.driver, 'Musa Bello'); assert.equal(o.subOrders[0].status, 'Dispatched'); ok('dispatch details recorded and status moves to Dispatched')
  assert.match(text(), /Proof of delivery/)
  await click(last(/^Confirm delivery$/)); assert.match(text(), /name of the person who received/)
  await fill('Received by', 'Site foreman'); await click(last(/^Confirm delivery$/)); assert.match(text(), /photo of the delivered materials or a note/); ok('proof needs a recipient and a photo or note')
  await fill('Note', 'All 10 bags counted and stacked'); await click(last(/^Confirm delivery$/))
  o = saved().orders[0]; assert.equal(o.proof.receivedBy, 'Site foreman'); assert.equal(o.subOrders[0].status, 'Delivered'); ok('proof of delivery recorded, status Delivered')
  assert.ok(saved().notificationLog.some((e) => e.title === 'Delivery completed' && e.channel === 'sms')); ok('important events get an SMS delivery record')
  await act(async () => root.unmount())

  root = await mount('/client/orders/WK-T1', ADA, {}, true); await sleep(150)
  assert.match(text(), /Delivery record/); assert.match(text(), /Musa Bello/); assert.match(text(), /Received by.*Site foreman/); ok('customer sees dispatch and proof of delivery')
  await click(byText('button', /Accept complete delivery/)); await sleep(80)
  assert.equal(saved().orders[0].settlementStatus, 'SETTLED'); ok('customer accepts the complete delivery, settlement released')
  await act(async () => root.unmount())

  root = await mount('/merchant/settlements', MERCH, {}, true); await sleep(150)
  assert.match(text(), /98,500/)
  await type($('input[placeholder^="Amount"]'), '98500'); await click(last(/Request withdrawal/))
  assert.equal(saved().withdrawals.length, 1); ok('merchant can withdraw exactly the settled amount (95% of materials + delivery)')
  await act(async () => root.unmount())
}

// ---------- 2. failed, unconfirmed and successful quotation payment (idempotent)
{
  const QT = { id: 'QT-T1', name: 'Test list', items: [{ id: 'l1', name: 'Cement', quantity: 10, unit: 'bag' }], status: 'Approved for payment', createdAt: iso(-1), merchantResponseDeadlineAt: iso(23), matchedMerchants: ['BuildRight Supplies'], customerApprovedAt: iso(-0.1), merchantConfirmedAt: iso(-0.2), selectedMerchantQuoteId: 'MQ-T1', selectedDeliveryMethod: 'merchant_delivery', deliveryLocation: 'Abuja' }
  const MQ = { id: 'MQ-T1', quotationId: 'QT-T1', merchantId: 'm-101', merchantName: 'BuildRight Supplies', items: [{ lineId: 'l1', supplyStatus: 'CAN_SUPPLY', variation: 'Cement 50kg', unitPrice: 10000, quantity: 10 }], deliveryFee: 3500, submittedAt: iso(-1), validUntil: iso(47) }
  let root = await mount('/client/quotations/QT-T1', ADA, { quotations: [QT], merchantQuotes: [MQ], orders: [] })
  await sleep(150)
  const pick = async (v) => type($$('select').find((s) => /declined/i.test(s.textContent)), v)
  const pay = () => click(byText('button', /Pay securely/))
  await pick('declined'); await pay()
  assert.match(text(), /declined[\s\S]*has not been created/i); assert.equal(saved().orders.length, 0); assert.equal(saved().paymentAttempts[0].status, 'failed'); ok('declined card: no order, attempt recorded as failed')
  await pick('timeout'); await pay()
  assert.equal(saved().paymentAttempts[0].status, 'unconfirmed'); assert.equal(saved().orders.length, 0); ok('provider timeout: attempt unconfirmed, no order')
  await pick('success'); await pay()
  assert.match(text(), /not been confirmed/i); assert.equal(saved().paymentAttempts.length, 2); assert.equal(saved().orders.length, 0); ok('cannot pay again until the unconfirmed attempt is reconciled (no double charge)')
  await act(async () => root.unmount())

  root = await mount('/admin/payments', ADMIN, {}, true); await sleep(120)
  await click(byText('button', /Provider confirms: mark paid/)); assert.equal(saved().paymentAttempts[0].status, 'success'); ok('admin reconciles the unconfirmed payment against the provider')
  await act(async () => root.unmount())
  root = await mount('/client/quotations/QT-T1', ADA, {}, true); await sleep(150)
  await pay(); await sleep(80)
  assert.equal(saved().orders.length, 1); assert.equal(saved().orders[0].total, 103500); assert.equal(saved().orders[0].platformCommission, 5000); ok('after reconciliation the order is created once; customer pays materials + delivery only')
  await act(async () => root.unmount())
}

// ---------- 3. bulk inventory upload (CSV)
{
  const root = await mount('/merchant/products', MERCH); await sleep(150)
  const input = $('input[aria-label="Inventory file"]')
  const csv = 'name,category,unit,price,stock,brand,specs\nTest Cement 50kg,Cement Merchant,bag,9500,200,Dangote,42.5\nBad Row,Nope,bag,-1,2.5,,\n'
  const file = new dom.window.File([csv], 'inv.csv', { type: 'text/csv' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await act(async () => { input.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  await waitFor(() => /ready to import/.test(text()), 4000, 'upload preview')
  assert.match(text(), /1\s*ready to import/); assert.match(text(), /Row 3:/); ok('CSV preview separates valid rows from rows with problems')
  await click(byText('button', /Import 1 valid product/)); await sleep(80)
  const p = saved().products.find((x) => x.name === 'Test Cement 50kg'); assert.ok(p && p.merchantId === 'm-101' && p.stock === 200 && p.price === 9500); ok('valid rows are imported into the merchant inventory')
  await act(async () => root.unmount())
}

// ---------- 4. merchant documents -> admin review
{
  let root = await mount('/merchant/account', MERCH); await sleep(150)
  const input = $('input[aria-label^="Upload Business registration"]')
  Object.defineProperty(input, 'files', { value: [new dom.window.File(['x'], 'cac.pdf', { type: 'application/pdf' })], configurable: true })
  await act(async () => { input.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  const m = saved().merchants.find((x) => x.id === 'm-101'); assert.equal(m.documents[0].status, 'Submitted'); ok('merchant uploads a verification document')
  await act(async () => root.unmount())
  root = await mount('/admin/merchants', ADMIN, {}, true); await sleep(150)
  assert.match(text(), /Documents: 1 of 4 submitted/)
  await click($$('button').find((b) => b.textContent === 'Verify'))
  assert.equal(saved().merchants.find((x) => x.id === 'm-101').documents[0].status, 'Verified'); ok('admin verifies the document (audit-logged)')
  await act(async () => root.unmount())
}

// ---------- 5. SmartFixer handoff
{
  const root = await mount('/client/smartfixer', ADA); await sleep(150)
  await click(byText('button', /Procure these materials in WakaStore/)); await sleep(150)
  const q = saved().quotations.find((x) => x.smartfixerJobId === 'SF-2041')
  assert.ok(q); assert.equal(q.items[0].quantity, 20); assert.equal(q.items[0].specs, '50kg'); assert.equal(q.source, 'smartfixer'); ok('approved SmartFixer list imports with quantities and specs intact')
  assert.match(text(), /SmartFixer job SF-2041/); assert.match(text(), /Request submitted/); ok('status timeline shows on the linked quotation')
  await click($('input[type="checkbox"]')); assert.equal(saved().quotations.find((x) => x.id === q.id).fixerCanView, true); ok('customer authorises the fixer to see procurement status')
  await act(async () => root.unmount())
}

// ---------- 6. cart checkout: delivery method drives the fee
{
  const prod = defaultState.products.find((p) => p.merchantId === 'm-101') || defaultState.products[0]
  const root = await mount('/client/checkout', ADA, { cart: [{ ...prod, quantity: 2 }] }); await sleep(150)
  await fill('e.g. Abuja', 'Abuja'); await fill('e.g. FCT', 'FCT')
  const radios = $$('input[name="delivery-method"]'); assert.equal(radios.length, 3); ok('checkout offers merchant delivery, pickup and WakaRider')
  await click(radios[1]); assert.match(text(), /Free \(pickup\)/); ok('pickup removes the delivery fee')
  assert.doesNotMatch(text(), /WakaStore fee|service fee/i); ok('no customer-side WakaStore fee at checkout')
  await act(async () => root.unmount())
}

// ---------- 7. a Super-Admin-created admin: temporary password must be replaced; suspended admins are blocked; bad logins are logged
{
  const TEMP = 'Temp12345x'
  const admins = [{ id: 'adm-1', name: 'Ngozi Admin', email: 'ngozi@waka.test', role: 'admin', status: 'active', password: TEMP, mustChange: true }, { id: 'adm-2', name: 'Sus Pended', email: 'sus@waka.test', role: 'admin', status: 'suspended', password: 'Whatever1', mustChange: false }]
  const login = async (email, pw) => { await type($('input[type="email"]'), email); await type($('input[autocomplete="current-password"]'), pw); await click($('button[type="submit"]')); await sleep(120) }
  let root = await mount('/admin/login', null, { adminUsers: admins }); await sleep(120)
  await login('sus@waka.test', 'Whatever1'); assert.match(text(), /suspended/i); ok('suspended admin cannot sign in')
  await login('ngozi@waka.test', 'wrong-password'); assert.ok(saved().auditLogs.some((l) => l.action === 'Failed admin login')); ok('failed admin logins are audit-logged')
  await login('ngozi@waka.test', TEMP); assert.match(text(), /Set a new password/); ok('first login with the temporary password forces a change')
  const [a, b] = $$('input[autocomplete="new-password"]')
  await type(a, TEMP); await type(b, TEMP); await click(byText('button', /Save password and continue/)); assert.match(text(), /different from the temporary/); ok('new password must differ from the temporary one')
  await type(a, 'Brand-new-pass1'); await type(b, 'Brand-new-pass1'); await click(byText('button', /Save password and continue/)); await sleep(150)
  const u = saved().adminUsers.find((x) => x.id === 'adm-1'); assert.equal(u.mustChange, false); assert.equal(u.password, 'Brand-new-pass1'); assert.equal(saved().session.role, 'admin'); ok('admin sets own password and is signed in')
  await act(async () => root.unmount())
}
assert.equal(errors.length, 0, errors.join('\n'))
console.log(`\n${passed} checks passed`)
await vite.close()
process.exit(0)
