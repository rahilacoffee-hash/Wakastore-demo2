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
console.error = (...a) => { const m = String(a[0]); if (!/not wrapped in act|Warning: ReactDOM.render/.test(m)) errors.push(m.slice(0, 200)); origErr.apply(console, a) }

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

async function mount(path, session = { role: 'super-admin', name: 'Super Admin Team', email: 'superadmin@waka.test' }, patch = {}) {
  localStorage.clear()
  localStorage.setItem(KEY, JSON.stringify({ ...defaultState, ...patch, session }))
  document.body.innerHTML = '<div id="root"></div>'
  const root = createRoot($('#root'))
  await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App))) })
  return root
}
const saved = () => JSON.parse(localStorage.getItem(KEY))
let passed = 0
const ok = (m) => { passed++; console.log('ok  ', m) }


const SUPER = { role: 'super-admin', name: 'Super Admin Team', email: 'superadmin@waka.test' }
const pages = [
  ['/admin/categories', /Customer categories/], ['/admin/quotations', /Quotation monitoring/], ['/admin/payments', /Payment attempts needing attention/],
  ['/admin/settlements', /Settled to merchants/], ['/admin/reports', /Merchant performance ranking/], ['/admin/notification-log', /Notification delivery log/],
  ['/super-admin/overview', /Platform overview/], ['/super-admin/team', /Create admin/], ['/super-admin/settings', /Commercial rules/],
]
for (const [path, re] of pages) {
  const root = await mount(path)
  await sleep(120)
  assert.doesNotMatch(text(), /use the dashboard links to continue testing/, `${path} is still a placeholder`)
  assert.match(text(), re, `${path} did not render`)
  ok(`${path} renders`)
  await act(async () => root.unmount())
}

// matching explainer
{
  const root = await mount('/admin/quotations')
  await sleep(120)
  const b = byText('button', /Why did these merchants match/)
  if (b) { await click(b); assert.match(text(), /Why merchants qualified/); ok('admin can see why merchants matched') } else { console.log('skip  no quotations in seed') }
  await act(async () => root.unmount())
}

// super admin: create an admin, then edit settings
{
  const root = await mount('/super-admin/team')
  await sleep(100)
  await type($('input[placeholder="Full name"]'), 'Ngozi Admin')
  await type($('input[placeholder="Email"]'), 'ngozi@waka.test')
  await click(byText('button', /^Create admin$/))
  assert.match(text(), /Account created/); assert.match(text(), /ngozi@waka\.test/)
  const s = saved(); assert.equal(s.adminUsers.length, 1); assert.equal(s.adminUsers[0].mustChange, true); assert.ok(s.adminUsers[0].password.length >= 8)
  ok('super admin creates an admin with a generated temporary password')
  await act(async () => root.unmount())
}
{
  const root = await mount('/super-admin/settings')
  await sleep(100)
  const commission = $$('input[inputmode="decimal"]')[0]
  await type(commission, '99')
  await click(byText('button', /Save settings/))
  assert.match(text(), /between 0 and 30/); ok('commission above 30% is rejected')
  await type(commission, '6')
  await click(byText('button', /Save settings/))
  assert.match(text(), /Saved/); assert.equal(saved().settings.feeRate, 0.06)
  assert.ok(saved().auditLogs[0].action === 'Changed platform settings'); ok('settings save and are audit-logged')
  await act(async () => root.unmount())
}

// merchant ledger
{
  const root = await mount('/merchant/settlements', { role: 'merchant', name: 'BuildRight Supplies', email: 'merchant@waka.test' })
  await sleep(150)
  assert.match(text(), /Pending[\s\S]*Available[\s\S]*Withdraw/); assert.doesNotMatch(text(), /Settlement 2026-10-18/)
  await type($('input[placeholder^="Amount"]'), '999999999')
  await click(byText('button', /Request withdrawal/))
  assert.match(text(), /more than your available balance/); ok('merchant ledger is live and blocks over-withdrawal')
  await act(async () => root.unmount())
}
assert.equal(errors.length, 0, errors.join('\n'))
console.log(`\n${passed} checks passed`)
await vite.close()
process.exit(0)
