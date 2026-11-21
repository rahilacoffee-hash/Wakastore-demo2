// Server-renders every customer route of the ROUTED app (AppStateContext) as a signed-in customer.
// Catches runtime crashes and checks key content. Not a substitute for real-device testing.
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import React from 'react'
const store = {}
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] } }
globalThis.window = { addEventListener() {}, removeEventListener() {}, location: { search: '' }, print() {}, alert() {}, confirm: () => true, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) }
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { StaticRouter } = await import('react-router-dom')
const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx')
const { MARKET_CATEGORIES } = await vite.ssrLoadModule('/src/constants/marketCategories.js')
const { defaultState } = await vite.ssrLoadModule('/src/context/AppStateContext.jsx')
const state = { ...defaultState, session: { role: 'customer', name: 'Ada Okafor', email: 'ada@example.test' } }
store['waka-demo-v2'] = JSON.stringify(state)
const first = state.products[0]
const checks = [
  ['/client/overview', ['Shop by category', 'Featured merchants', 'Build better, source smarter.', 'Get a quotation']],
  ['/client/explore', ['Explore', 'Open filters']],
  ['/client/explore?category=Tiles%20Merchant', ['Explore']],
  ['/client/marketplace', []],
  ['/client/categories', MARKET_CATEGORIES.map((c) => c.name.replace('&', '&amp;'))],
  [`/client/store/${state.merchants.find((m) => m.status === 'approved').id}`, ['Verified merchant']],
  ['/client/store/does-not-exist', ['Store not available']],
  [`/client/product/${first.id}`, ['Specifications', 'Add to cart', 'Buy now']],
  ['/client/product/does-not-exist', ['Product not found']],
  ['/client/account', ['Addresses', 'Saved products', 'Log out']],
  ['/client/notifications', ['Notifications']],
  ['/client/quotations', []], ['/client/quotations/new', []], ['/client/cart', []], ['/client/orders', []], ['/client/wallet', []],
]
let bad = 0
for (const [path, needles] of checks) {
  try {
    const html = renderToString(React.createElement(StaticRouter, { location: path }, React.createElement(App)))
    const missing = needles.filter((n) => !html.includes(n))
    if (missing.length) { bad++; console.log('FAIL ', path, 'missing:', missing.join(' | ')) } else console.log('ok   ', path, html.length)
  } catch (e) { bad++; console.log('CRASH', path, e.message.split('\n')[0]) }
}
console.log(bad ? `${bad} failing` : `${checks.length}/${checks.length} passed`)
await vite.close()
process.exit(bad ? 1 : 0)
