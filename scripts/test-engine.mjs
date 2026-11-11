import { seedState } from '../src/data/seed.js'
import * as E from '../src/services/engine.js'
import { matchQuotation, bestBasket, groupSelectionByMerchant, parseMaterialsList } from '../src/services/matching.js'
let s = seedState(), n = 0, bad = 0
const t = (name, cond) => { n++; if (!cond) { bad++; console.log('FAIL', name) } else console.log('ok  ', name) }
const addr = { label: 'Home', line: '12 Wuse II, Abuja' }

const lines = parseMaterialsList(`50 bags of Dangote cement\n20 lengths of 12mm iron rod\n10 bundles of roofing sheet\n15 bags of tile adhesive\n30 metres of 2.5mm cable\n8 pieces of 4in PVC pipe\n12 buckets of emulsion paint\n40 boxes of 60x60 ceramic tile\n6 pieces of flush door\n25 rolls of binding wire`)
let r = E.submitQuotation(s, { customerId: 'c-1', name: 'Test', lines: [{ name: '', quantity: 1 }] }); t('empty quotation rejected', !r.ok)
r = E.submitQuotation(s, { customerId: 'c-1', name: 'House', lines }); s = r.state
const pct = Object.fromEntries(r.match.results.map((x) => [x.merchant.id, x.percentage]))
t('pending merchant D excluded', pct['m-d'] === undefined)
t('quotation visible to admin + super notified', E.notificationsFor(s, 'u-ad').length === 1 && E.notificationsFor(s, 'u-sa').length === 1)
console.log('   match %:', pct, 'eligible:', r.match.eligible.map((x) => x.merchant.id))
const q = r.quotation, basket = bestBasket(r.match), groups = groupSelectionByMerchant(basket)
t('selection spans >= 2 merchants', groups.length >= 2)

// payments
let before = E.walletBalance(s, 'c-1')
r = E.checkout(s, { customerId: 'c-2', groups, paymentMethod: 'wallet', address: addr, quotationId: q.id }); t('insufficient wallet blocked, no order', !r.ok && r.error === 'INSUFFICIENT_BALANCE' && r.state.orders.length === 0); s = r.state
r = E.checkout(s, { customerId: 'c-1', groups, paymentMethod: 'card', simulate: 'fail', address: addr, quotationId: q.id }); s = r.state
t('failed card: no order, no stock change, failed payment logged', !r.ok && s.orders.length === 0 && s.payments[0].status === 'failed' && s.products.find((p) => p.id === 'p1').stock === 400)
r = E.fundWallet(s, { customerId: 'c-1', amount: 5000000, method: 'bank-transfer', simulate: 'fail' }); t('failed funding adds no balance', !r.ok && E.walletBalance(r.state, 'c-1') === E.walletBalance(s, 'c-1')); s = r.state
r = E.fundWallet(s, { customerId: 'c-1', amount: 5000000 }); s = r.state; before = E.walletBalance(s, 'c-1'); t('funding credits wallet', r.ok && before === 5500000)
const key = 'idem-1'
r = E.checkout(s, { customerId: 'c-1', groups, paymentMethod: 'wallet', address: addr, quotationId: q.id, idempotencyKey: key }); s = r.state
const total = s.orders[0].total
t('wallet checkout ok: one parent order', r.ok && s.orders.length === 1)
t('sub-orders = merchants', s.subOrders.length === groups.length)
t('fee = 2.5% of subtotal', s.orders[0].fee === Math.round(s.orders[0].subtotal * 0.025))
t('wallet debited exactly once', E.walletBalance(s, 'c-1') === before - total)
r = E.checkout(s, { customerId: 'c-1', groups, paymentMethod: 'wallet', address: addr, quotationId: q.id, idempotencyKey: key }); s = r.state
t('double submit: no duplicate order or debit', s.orders.length === 1 && E.walletBalance(s, 'c-1') === before - total)
t('receipt created + quotation converted', s.receipts.length === 1 && s.quotations[0].status === 'Converted to order')
t('stock reserved', s.products.find((p) => p.id === 'p6').stock === 100)
t('each merchant notified of own sub-order only', s.subOrders.every((x) => E.notificationsFor(s, s.users.find((u) => u.merchantId === x.merchantId).id).some((nn) => nn.ref === x.id)))

// merchant flow
const [subA, subB] = s.subOrders.slice().sort((a, b) => a.merchantId.localeCompare(b.merchantId))
r = E.merchantRespond(s, { subId: subA.id, merchantId: subB.merchantId, action: 'accept' }); t('merchant cannot touch another merchant sub-order', !r.ok && r.error === 'FORBIDDEN')
r = E.merchantRespond(s, { subId: subA.id, merchantId: subA.merchantId, action: 'accept' }); s = r.state
t('accept -> parent Partially accepted', s.orders[0].status === 'Partially accepted')
for (const st of ['Preparing', 'Ready for dispatch', 'Dispatched', 'Delivered']) { r = E.advanceSubOrder(s, { subId: subA.id, merchantId: subA.merchantId, status: st }); s = r.state }
t('delivery updates reach customer; parent not Delivered while other sub pending', s.orders[0].status !== 'Delivered' && E.notificationsFor(s, 'c-1').some((x) => x.type === 'delivery'))
r = E.advanceSubOrder(s, { subId: subB.id, merchantId: subB.merchantId, status: 'Delivered' }); t('cannot skip steps', !r.ok)

// rejection
r = E.merchantRespond(s, { subId: subB.id, merchantId: subB.merchantId, action: 'reject', reason: '  ' }); t('reject needs reason', !r.ok && r.error === 'REASON_REQUIRED')
r = E.merchantRespond(s, { subId: subB.id, merchantId: subB.merchantId, action: 'reject', reason: 'Out of stock' }); s = r.state
console.log('   reassigned to:', r.reassigned, 'sourcing items:', r.sourcingItems)
t('rejection handled: reassigned or sourcing, never silent', r.ok && (r.reassigned.length > 0 || r.sourcingItems > 0))
t('other merchant sub-order untouched', s.subOrders.find((x) => x.id === subA.id).status === 'Delivered')

// forced sourcing: only one merchant stocks it
let s2 = seedState(); const g2 = [{ merchantId: 'm-a', items: [{ productId: 'p5', name: 'Binding Wire', unit: 'rolls', quantity: 5, unitPrice: 22000 }] }]
r = E.checkout(s2, { customerId: 'c-1', groups: g2, paymentMethod: 'card', address: addr }); s2 = r.state
r = E.merchantRespond(s2, { subId: s2.subOrders[0].id, merchantId: 'm-a', action: 'reject', reason: 'No capacity' }); s2 = r.state
t('no alternative -> sourcing case + super admin notified', s2.sourcing.length === 1 && E.notificationsFor(s2, 'u-sa').some((x) => x.type === 'sourcing'))

// refund
r = E.requestRefund(s, { customerId: 'c-1', subId: subA.id, items: [{ productId: subA.items[0].productId, quantity: 1 }], reason: 'Missing item', details: 'x' }); s = r.state
const rid = s.refunds[0].id
r = E.decideRefund(s, { actorId: 'c-1', refundId: rid, decision: 'approve' }); t('customer cannot decide refunds', !r.ok)
s = E.decideRefund(s, { actorId: 'u-ad', refundId: rid, decision: 'approve' }).state
let bal = E.walletBalance(s, 'c-1')
s = E.decideRefund(s, { actorId: 'u-ad', refundId: rid, decision: 'process' }).state
const after = E.walletBalance(s, 'c-1')
r = E.decideRefund(s, { actorId: 'u-ad', refundId: rid, decision: 'process' }); s = r.state
t('refund credits wallet exactly once', after === bal + s.refunds[0].amount && E.walletBalance(s, 'c-1') === after && !r.ok)
t('refund leaves other items valid', s.subOrders.find((x) => x.id === subA.id).items.length === subA.items.length)

// admin
r = E.reviewMerchant(s, { actorId: 'u-ad', merchantId: 'm-d', decision: 'approve' }); s = r.state; t('admin approves pending merchant + audit + notify', s.merchants.find((m) => m.id === 'm-d').status === 'approved' && s.audit.length > 0 && E.notificationsFor(s, 'u-md').length === 1)
r = E.reviewMerchant(s, { actorId: 'u-ad', merchantId: 'm-c', decision: 'reject', reason: 'Docs missing' }); s = r.state
const ra = new Date(s.merchants.find((m) => m.id === 'm-c').canResubmitAfter); t('rejected: resubmit date is a weekday >= 5 working days out', ra.getDay() % 6 !== 0 && (ra - new Date()) / 864e5 >= 4.5)
r = E.removeProduct(s, { actorId: 'u-ad', productId: 'p9', reason: '' }); t('product removal needs reason', !r.ok)
r = E.removeProduct(s, { actorId: 'u-ad', productId: 'p9', reason: 'Counterfeit listing' }); s = r.state; t('product removed + merchant notified', !s.products.some((p) => p.id === 'p9') && E.notificationsFor(s, 'u-mb').some((x) => x.type === 'moderation'))
s = E.markRead(s, 'c-1').state; t('mark all read persists in state', E.notificationsFor(s, 'c-1').every((x) => x.read))
t('state is JSON-serialisable (localStorage safe)', JSON.parse(JSON.stringify(s)).orders.length === s.orders.length)
console.log(`\n${n - bad}/${n} passed`); process.exit(bad ? 1 : 0)
