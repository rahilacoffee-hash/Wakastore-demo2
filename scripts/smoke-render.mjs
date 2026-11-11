// Renders every route as each demo role (no browser needed). Catches runtime crashes the build can't.
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import React from 'react'
const store = {}
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] } }
globalThis.window = { location: { search: '' }, print() {}, alert() {}, confirm: () => true }
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { StaticRouter } = await import('react-router-dom')
const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx')
const E = await vite.ssrLoadModule('/src/services/engine.js'), { seedState } = await vite.ssrLoadModule('/src/data/seed.js')
// Build a state that has an order/refund/sourcing so detail pages have data to render.
let s = seedState(); const addr = { line: 'Abuja' }
let r = E.checkout(s, { customerId: 'c-1', paymentMethod: 'wallet', address: addr, groups: [{ merchantId: 'm-a', items: [{ productId: 'p5', name: 'Binding Wire', unit: 'rolls', quantity: 2, unitPrice: 22000 }] }, { merchantId: 'm-b', items: [{ productId: 'p6', name: 'Dangote Cement 50kg', unit: 'bags', quantity: 5, unitPrice: 10500 }] }] }); s = r.state
const sub = s.subOrders[0]; s = E.merchantRespond(s, { subId: sub.id, merchantId: 'm-a', action: 'reject', reason: 'No capacity' }).state
s = E.submitQuotation(s, { customerId: 'c-1', name: 'Q', lines: [{ id: 'l1', name: 'Dangote cement', quantity: 5, unit: 'bags' }] }).state
const order = s.orders[0], rc = s.receipts[0], q = s.quotations[0]
const routes = { customer: ['/client/home', '/client/marketplace', '/client/cart', '/client/quotations', '/client/quotations/new', `/client/quotations/${q.id}`, '/client/orders', `/client/orders/${order.id}`, `/client/receipt/${rc.id}`, '/client/wallet', '/client/notifications'].map((p) => [p, 'customer1@waka.test']),
  merchant: ['overview', 'orders', 'products', 'notifications'].flatMap((x) => ['merchant.a@waka.test', 'merchant.pending@waka.test'].map((e) => [`/merchant/${x}`, e])),
  admin: ['overview', 'merchants', 'customers', 'products', 'quotations', 'orders', 'payments', 'refunds', 'audit', 'notifications', 'sourcing', 'admins', 'settings'].flatMap((x) => ['admin@waka.test', 'super@waka.test'].map((e) => [`/admin/${x}`, e])).concat([[`/admin/receipt/${rc.id}`, 'admin@waka.test']]) }
let bad = 0, n = 0
for (const [path, email] of Object.values(routes).flat()) {
  store['waka-v3'] = JSON.stringify(s); const u = s.users.find((x) => x.email === email); store['waka-v3-session'] = u.id
  n++
  try { const html = renderToString(React.createElement(StaticRouter, { location: path }, React.createElement(App))); const denied = html.includes('Access denied'); console.log(denied ? 'DENIED' : 'ok    ', path, email.split('@')[0], html.length) }
  catch (e) { bad++; console.log('CRASH ', path, email, '->', e.message.split('\n')[0]) }
}
// guards
for (const [path, email] of [['/admin/overview', 'customer1@waka.test'], ['/merchant/orders', 'customer1@waka.test'], ['/client/home', 'admin@waka.test'], ['/admin/sourcing', 'admin@waka.test']]) {
  store['waka-v3-session'] = s.users.find((x) => x.email === email).id
  const html = renderToString(React.createElement(StaticRouter, { location: path }, React.createElement(App))); const ok = html.includes('Access denied'); n++; if (!ok) bad++; console.log(ok ? 'ok    guard blocks' : 'FAIL  guard open', path, 'as', email.split('@')[0])
}
// logged-out screens + redirect for protected pages
delete store['waka-v3-session']
for (const path of ['/', '/welcome', '/auth/customer', '/auth/merchant', '/login', '/client/home', '/admin/overview']) {
  n++
  try { const html = renderToString(React.createElement(StaticRouter, { location: path }, React.createElement(App))); const expect = ['/client/home', '/admin/overview', '/'].includes(path) ? html.length < 200 : html.length > 1500; if (!expect) { bad++; console.log('FAIL  logged-out', path, html.length) } else console.log('ok    logged-out', path) }
  catch (e) { bad++; console.log('CRASH ', path, e.message.split('\n')[0]) }
}
console.log(`${n - bad}/${n} passed`); await vite.close(); process.exit(bad ? 1 : 0)
