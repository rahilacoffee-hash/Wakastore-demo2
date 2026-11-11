// Loads the project's real default state (+ quote seed), checks 60% matching, then renders routes per role.
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import React from 'react'
const store = {}
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] } }
globalThis.window = { location: { search: '' }, print() {}, alert() {}, confirm: () => true, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) }
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { StaticRouter } = await import('react-router-dom')
const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx')
const { defaultState } = await vite.ssrLoadModule('/src/context/AppStateContext.jsx')
const { withSeedExtras, merchantIdOf } = await vite.ssrLoadModule('/src/data/quoteSeed.js')
const { matchQuotation, parseMaterialsList } = await vite.ssrLoadModule('/src/services/matching.js')
let bad = 0, n = 0; const t = (name, c) => { n++; if (!c) { bad++; console.log('FAIL', name) } else console.log('ok  ', name) }

const base = withSeedExtras(defaultState)
const lines = parseMaterialsList(`50 bags of Dangote cement\n20 lengths of 12mm iron rod\n10 sheets of roofing sheet\n15 bags of tile adhesive\n3 rolls of 2.5mm cable\n8 pieces of 4in PVC pipe\n12 buckets of emulsion paint 20L\n40 boxes of 60x60 ceramic tile\n6 pieces of flush door\n5 rolls of binding wire`)
const m = matchQuotation(lines, base.merchants, base.products, 60)
const pct = Object.fromEntries(m.results.map((r) => [r.merchant.id, r.percentage]))
console.log('   match %:', pct, 'eligible:', m.eligible.map((r) => r.merchant.id))
t('10 lines parsed with quantities', lines.length === 10 && lines.every((l) => l.quantity > 0))
t('real merchants: m-101 80%, m-102 60%, m-106 40%', pct['m-101'] === 80 && pct['m-102'] === 60 && pct['m-106'] === 40)
t('only approved merchants take part (m-103/104/105 excluded)', !('m-103' in pct) && !('m-104' in pct) && !('m-105' in pct))
t('below-60% merchant not eligible, 2 eligible', m.eligible.length === 2 && !m.results.find((r) => r.merchant.id === 'm-106').eligible)
console.log('   needs sourcing:', m.needsSourcing.map((l) => l.name))
t('only the tile line lacks an eligible merchant (its only stockist is below 60%), so it is flagged for sourcing', m.needsSourcing.length === 1 && m.needsSourcing[0].name.includes('ceramic tile'))
t('seed merge is idempotent', withSeedExtras(base).products.length === base.products.length)

const quote = { id: 'QT-1003', name: 'Test bungalow', date: '10 Nov 2026', status: 'Matched', items: lines.map((l, i) => ({ ...l, id: l.id || `line-${i}` })), matchedMerchants: [] }
const ses = (role, email, extra = {}) => ({ role, email, name: email, ...extra })
const withState = (s) => { store['waka-demo-v2'] = JSON.stringify(s) }
const draw = (path) => renderToString(React.createElement(StaticRouter, { location: path }, React.createElement(App))).replace(/<!-- -->/g, '')
const cases = []
const S = { ...base, quotations: [quote, ...base.quotations] }
const check = (label, path, session, test) => { n++; withState({ ...S, session }); try { const h = draw(path), ok = test(h); if (!ok) bad++; console.log(ok ? 'ok   ' : 'FAIL ', label, path, h.length) } catch (e) { bad++; console.log('CRASH', label, path, e.message.split('\n')[0]) } }
const cust = ses('customer', 'customer1@waka.test')
check('quote create page', '/client/quotations/new', cust, (h) => h.includes('Build your materials list'))
check('quote create (paste mode)', '/client/quotations/new?mode=paste', cust, (h) => h.includes('Paste your list') || h.includes('Paste materials list'))
check('quotations list shows state quote + old quotes', '/client/quotations', cust, (h) => h.includes('QT-1003') && h.includes('QT-1042'))
check('quote detail shows 80/60/40', '/client/quotations/QT-1003', cust, (h) => h.includes('80%') && h.includes('60%') && h.includes('40%') && h.includes('Below 60%') && h.includes('Best basket'))
check('old quote still opens', '/client/quotations/QT-1042', cust, (h) => h.includes('QT-1042'))
check('unknown quote handled', '/client/quotations/QT-9999', cust, (h) => h.includes('Quotation not found'))
for (const p of ['/client/overview', '/client/marketplace', '/client/cart', '/client/checkout', '/client/orders', '/client/wallet']) check('existing page', p, cust, (h) => h.length > 800)
const mA = ses('merchant', 'merchant@waka.test'), mP = ses('merchant', 'pending@waka.test'), mR = ses('merchant', 'rejected@waka.test'), mPH = ses('merchant', 'powerhouse@waka.test')
check('approved merchant dashboard', '/merchant/overview', mA, (h) => !h.includes('APPLICATION') && h.length > 800)
check('merchant products follow signed-in merchant (PowerHouse sees its own)', '/merchant/products', mPH, (h) => h.includes('Flush Door') && !h.includes('Galvanized Steel Rod'))
check('merchant A products', '/merchant/products', mA, (h) => h.includes('Galvanized Steel Rod'))
check('pending merchant gated', '/merchant/overview', mP, (h) => h.includes('APPLICATION PENDING'))
check('pending merchant gated on orders', '/merchant/orders', mP, (h) => h.includes('APPLICATION PENDING'))
check('rejected merchant gated + resubmit date + locked', '/merchant/products', mR, (h) => h.includes('APPLICATION REJECTED') && h.includes('Resubmit') && h.includes('13 November 2026'))
const sus = { ...S, merchants: S.merchants.map((x) => x.id === 'm-101' ? { ...x, status: 'suspended' } : x) }
n++; withState({ ...sus, session: mA }); { const h = draw('/merchant/overview'); const ok = h.includes('APPLICATION SUSPENDED'); if (!ok) bad++; console.log(ok ? 'ok   ' : 'FAIL ', 'suspended merchant gated') }
const fresh = { ...S, merchants: [...S.merchants, { id: 'm-new', name: 'Fresh Bricks Ltd', status: 'pending', categories: ['Blocks Merchant'], address: 'Kubwa', contact: '080' }], merchantUsers: [...S.merchantUsers, { id: 'mu-n', merchantId: 'm-new', name: 'Fresh', email: 'fresh@test.com', password: 'secret1' }] }
n++; withState({ ...fresh, session: ses('merchant', 'fresh@test.com', { merchantId: 'm-new' }) }); { const h = draw('/merchant/overview'); const ok = h.includes('Fresh Bricks Ltd') && h.includes('APPLICATION PENDING'); if (!ok) bad++; console.log(ok ? 'ok   ' : 'FAIL ', 'self-registered merchant lands on its own pending screen') }
n++; withState({ ...fresh, session: ses('admin', 'admin@waka.test') }); { const h = draw('/admin/merchants'); const ok = h.includes('Fresh Bricks Ltd'); if (!ok) bad++; console.log(ok ? 'ok   ' : 'FAIL ', 'admin sees new merchant application') }
check('admin overview', '/admin/overview', ses('admin', 'admin@waka.test'), (h) => h.length > 800)
check('super admin sourcing', '/admin/sourcing', ses('super-admin', 'superadmin@waka.test'), (h) => h.length > 800)
// logged-out
for (const p of ['/welcome', '/auth/customer', '/auth/merchant', '/login']) check('logged-out screen', p, null, (h) => h.length > 1500)
check('welcome shows role choices after onboarding flag', '/welcome', null, (h) => h.includes('Welcome to') || h.includes('Build better'))
check('customer route when logged out redirects', '/client/overview', null, (h) => h.length < 200)
check('merchant route when logged out redirects', '/merchant/orders', null, (h) => h.length < 200)
check('customer cannot open admin', '/admin/overview', cust, (h) => h.length < 200)
check('merchant cannot open customer pages', '/client/overview', mA, (h) => h.length < 200)
console.log(`${n - bad}/${n} passed`); await vite.close(); process.exit(bad ? 1 : 0)
