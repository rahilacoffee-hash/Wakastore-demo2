import assert from 'node:assert/strict'
import { matchQuotation } from '../src/services/matching.js'
import * as S from '../src/services/sourcing.js'

const AT = '2026-11-13T10:00:00.000Z'
const merchant = (id, name, categories, extra = {}) => ({ id, name, status: 'approved', active: true, categories, ...extra })
const prod = (id, merchantId, name, category, price, stock, unit) => ({ id, merchantId, name, category, price, stock, unit, available: true })
const IRON = 'Iron Rods & Reinforcement Materials Merchant', SAND = 'Sand Merchant', ROOF = 'Roofing Materials & Accessories Merchant', CEM = 'Cement Merchant'

const merchants = [
  merchant('A', 'Merchant A', [IRON, SAND, ROOF]),
  merchant('B', 'Merchant B', [CEM], { acceptsSourcing: true }),            // can source cement
  merchant('C', 'Merchant C', ['Paint Merchant'], { acceptsSourcing: true }), // sourcing-capable but wrong category
  merchant('D', 'Merchant D', [CEM]),                                        // right category, no stock, does not source
  merchant('E', 'Merchant E', [CEM], { acceptsSourcing: true }),            // second cement option
  merchant('S', 'Suspended Co', [CEM], { acceptsSourcing: true, status: 'suspended' }),
]
const products = [
  prod('a1', 'A', 'Iron Rod 12mm', IRON, 5200, 500, 'piece'),
  prod('a2', 'A', 'Sharp Sand', SAND, 18000, 100, 'tonne'),
  prod('a3', 'A', 'Longspan Roofing Sheet', ROOF, 7800, 400, 'piece'),
  prod('a4', 'A', 'Cement 50kg', CEM, 9500, 0, 'bag'),          // A lists cement but is OUT of stock
  prod('d1', 'D', 'Cement 50kg', CEM, 9800, 0, 'bag'),
  prod('b1', 'B', 'Cement 20kg', CEM, 4200, 500, 'bag'),         // B only stocks 20kg, which is a different spec
  prod('c1', 'C', 'Emulsion Paint 20L', 'Paint Merchant', 31000, 50, 'bucket'),
]
const ctx = { merchants, products, at: AT }
const customer = { role: 'customer', email: 'ada@example.test' }
const mA = { role: 'merchant', merchantId: 'A' }, mB = { role: 'merchant', merchantId: 'B' }, mE = { role: 'merchant', merchantId: 'E' }
const admin = { role: 'admin', name: 'Admin' }

// Customer order: cement (not in stock anywhere) + 3 stocked lines, all assigned to Merchant A
const fresh = () => {
  const items = S.buildItems('WK-1', [
    { lineId: 'l1', name: 'Cement', specification: '50kg', quantity: 50, unit: 'bags', merchantId: 'A', unavailable: true },
    { lineId: 'l2', name: 'Iron Rod 12mm', quantity: 40, unit: 'pieces', productRef: 'a1', unitPrice: 5200, merchantId: 'A' },
    { lineId: 'l3', name: 'Sharp Sand', quantity: 10, unit: 'tonnes', productRef: 'a2', unitPrice: 18000, merchantId: 'A' },
    { lineId: 'l4', name: 'Longspan Roofing Sheet', quantity: 30, unit: 'pieces', productRef: 'a3', unitPrice: 7800, merchantId: 'A' },
  ], { at: AT })
  return S.rebuildSubOrders({ id: 'WK-1', customerEmail: 'ada@example.test', items, subOrders: [], deliveryFee: 0 }, merchants)
}
const ok = (r) => { assert.equal(r.ok, true, JSON.stringify(r)); return r }
const code = (r, c) => { assert.equal(r.ok, false); assert.equal(r.code, c, r.error) }
const item = (o, name) => o.items.find((i) => i.name === name)
const confirm = { confirmed: true, price: 11000, eta: '3 days', supplier: 'Lagos depot', notes: 'Dangote', finalPriceConfirmed: true }

// 1. Unavailable products remain in the customer's order
let o = fresh()
assert.equal(o.items.length, 4)
let cement = item(o, 'Cement')
assert.equal(cement.quantity, 50); assert.equal(cement.unit, 'bags'); assert.equal(cement.specification, '50kg')
const noSpec = S.buildItems('Y', [{ name: 'Cement', quantity: 50, unit: 'bags', merchantId: 'A', unavailable: true }])[0]
assert.equal(noSpec.name, 'Cement'); assert.equal(noSpec.specification, ''); assert.equal(noSpec.sourcingStatus, 'SOURCING_REQUESTED', 'no extra specification must not make it disappear')
assert.equal(cement.availability, 'NOT_IN_STOCK'); assert.equal(cement.sourcingStatus, 'SOURCING_REQUESTED'); assert.equal(cement.unitPrice, null)
assert.equal(S.buildItems('X', [{ name: 'Cement', quantity: 5 }])[0].sourcingStatus, 'AWAITING_MERCHANT', 'no merchant -> awaiting, still in the order')
assert.equal(o.subOrders.find((s) => s.merchantId === 'A').items.length, 4, 'merchant sees every item assigned to them, including the unavailable one')
assert.equal(S.orderTotals(o).unpricedCount, 1)

// Initial assignee of an unavailable line comes from the (already 60%-filtered) ranked list
assert.equal(S.pickInitialAssignee({ name: 'Cement' }, [merchants[0], merchants[1]], products).id, 'B', 'category fit wins over rank')
assert.equal(S.pickInitialAssignee({ name: 'Zorblax' }, [merchants[0], merchants[1]], products).id, 'A', 'no category fit -> best-ranked eligible merchant')
assert.equal(S.pickInitialAssignee({ name: 'Cement' }, [], products), null, 'nobody eligible -> nobody assigned')

// 2. Merchant sourcing confirmation (explicit, with price, timeframe, notes, timestamp)
code(S.confirmSourcing(o, cement.itemId, mA, { ...confirm, confirmed: false }), 'CHECKBOX_NOT_CONFIRMED')
code(S.confirmSourcing(o, cement.itemId, mA, { ...confirm, confirmed: undefined }), 'CHECKBOX_NOT_CONFIRMED')
code(S.confirmSourcing(o, cement.itemId, mA, { ...confirm, price: 0 }), 'PRICE_REQUIRED')
code(S.confirmSourcing(o, cement.itemId, mA, { ...confirm, price: 'abc' }), 'PRICE_REQUIRED')
code(S.confirmSourcing(o, cement.itemId, mA, { ...confirm, eta: '  ' }), 'ETA_REQUIRED')
code(S.confirmSourcing(o, cement.itemId, mA, { ...confirm, finalPriceConfirmed: false }), 'FINAL_PRICE_NOT_CONFIRMED')
let confirmed = ok(S.confirmSourcing(o, cement.itemId, mA, confirm, { at: AT })).order
cement = item(confirmed, 'Cement')
assert.equal(cement.sourcingStatus, 'SOURCING_CONFIRMED'); assert.equal(cement.currentMerchantId, 'A', 'stays with the original merchant')
assert.deepEqual([cement.sourcing.price, cement.sourcing.eta, cement.sourcing.supplier, cement.sourcing.notes, cement.sourcing.confirmedAt, cement.sourcing.confirmedBy], [11000, '3 days', 'Lagos depot', 'Dangote', AT, 'A'])
assert.equal(cement.lineTotal, 550000)
code(S.confirmSourcing(confirmed, cement.itemId, mA, confirm), 'INVALID_STATE')

// 3. Merchant sourcing rejection needs explicit confirmation
code(S.declineSourcing(o, cement.itemId, mA, {}, ctx), 'CONFIRMATION_REQUIRED')
code(S.declineSourcing(o, cement.itemId, mA, { confirmed: false }, ctx), 'CONFIRMATION_REQUIRED')
assert.equal(item(o, 'Cement').currentMerchantId, 'A', 'nothing moved without confirmation')

// 4 + 5. Single-item rerouting; every other item stays with Merchant A
const before = Object.fromEntries(o.items.filter((i) => i.name !== 'Cement').map((i) => [i.name, JSON.stringify(i)]))
const dec = ok(S.declineSourcing(o, cement.itemId, mA, { confirmed: true, reason: 'No supplier' }, ctx))
const o2 = dec.order
assert.equal(dec.rerouted, true); assert.equal(dec.to.merchantId, 'B')
assert.equal(item(o2, 'Cement').currentMerchantId, 'B'); assert.equal(item(o2, 'Cement').originalMerchantId, 'A')
for (const [n, json] of Object.entries(before)) assert.equal(JSON.stringify(item(o2, n)), json, `${n} must be untouched`)
for (const n of ['Iron Rod 12mm', 'Sharp Sand', 'Longspan Roofing Sheet']) assert.equal(item(o2, n).currentMerchantId, 'A')
assert.equal(item(o2, 'Cement').sourcingStatus, 'REROUTED', 'B has NOT confirmed anything yet')
assert.equal(item(o2, 'Cement').unitPrice, null, 'no price is invented for a rerouted item')
assert.equal(item(o2, 'Cement').sourcing, null)

// 10. One coordinated order, two merchants
let o3 = S.rebuildSubOrders(o2, merchants)
assert.equal(o3.subOrders.length, 2); assert.equal(o3.merchants, 2)
assert.deepEqual(o3.subOrders.find((s) => s.merchantId === 'A').items.map((i) => i.name).sort(), ['Iron Rod 12mm', 'Longspan Roofing Sheet', 'Sharp Sand'])
assert.deepEqual(o3.subOrders.find((s) => s.merchantId === 'B').items.map((i) => i.name), ['Cement'])
assert.equal(o3.id, 'WK-1'); assert.equal(o3.items.length, 4, 'still ONE order with all four items')

// 6. Alternative merchant eligibility
const c = S.findRerouteCandidates({ ...item(o, 'Cement'), declinedBy: ['A'], currentMerchantId: null }, ctx)
assert.deepEqual(c.map((x) => x.merchantId), ['B', 'E'], 'only relevant-category merchants that can source: not A (declined), C (wrong category), D (cannot source), Suspended')
assert(c.every((x) => x.capability === 'SOURCING'), 'B stocks 20kg only, which is not the item (no spec substitution)')
const c20 = S.findRerouteCandidates({ ...item(o, 'Cement'), specification: '20kg', declinedBy: ['A'], currentMerchantId: null }, ctx)
assert.equal(c20[0].merchantId, 'B'); assert.equal(c20[0].capability, 'IN_STOCK'); assert.equal(c20[0].price, 4200)
const c50 = S.findRerouteCandidates({ ...item(o, 'Cement'), specification: '50kg', quantity: 50, declinedBy: ['A'], currentMerchantId: null }, ctx)
assert(!c50.some((x) => x.capability === 'IN_STOCK'), 'a 50kg request is never fulfilled from 20kg stock')
assert.deepEqual(S.relevantCategories({ name: 'Cement', specification: '' }, products).includes(CEM), true)
assert.deepEqual(S.relevantCategories({ name: 'Zorblax widget', specification: '' }, products), [], 'never invents a category for an unknown material')

// A request WITHOUT a specification can be met from a compatible in-stock product, but the product is named and the price needs approval
{
  const plain = S.buildItems('WK-2', [{ name: 'Cement', quantity: 50, unit: 'bags', merchantId: 'A', unavailable: true }])
  const po = S.rebuildSubOrders({ id: 'WK-2', items: plain, subOrders: [] }, merchants)
  const r = ok(S.declineSourcing(po, plain[0].itemId, mA, { confirmed: true }, ctx))
  const it = r.order.items[0]
  assert.equal(it.currentMerchantId, 'B'); assert.equal(it.sourcingStatus, 'AVAILABLE'); assert.equal(it.matchedProductName, 'Cement 20kg')
  assert.equal(it.priceApproval.status, 'PENDING', 'a new price always needs the customer'); assert.equal(S.orderTotals(r.order).confirmedSubtotal, 0)
  assert(it.history.some((h) => h.type === 'REROUTED' && /Cement 20kg/.test(h.note)))
}
// 9. Price changes require customer approval; totals never silently increase
let b1 = ok(S.confirmSourcing(o3, cement.itemId, mB, confirm, { at: AT })).order
let ci = item(b1, 'Cement')
assert.equal(ci.priceApproval.status, 'PENDING'); assert.equal(ci.priceApproval.previousPrice, null)
let t = S.orderTotals(b1)
assert.equal(t.confirmedSubtotal, 40 * 5200 + 10 * 18000 + 30 * 7800, 'pending price NOT in the payable total')
assert.equal(t.pendingApprovalAmount, 550000); assert.equal(t.pendingApprovalCount, 1)
code(S.decidePrice(b1, ci.itemId, mB, 'approve'), 'FORBIDDEN')
code(S.decidePrice(b1, ci.itemId, { role: 'customer', email: 'someone@else.test' }, 'approve'), 'FORBIDDEN')
code(S.advanceFulfilment(b1, ci.itemId, mB, 'PREPARING'), 'NOT_FULFILLABLE')
let appr = ok(S.decidePrice(b1, ci.itemId, customer, 'approve', { at: AT })).order
assert.equal(S.orderTotals(appr).confirmedSubtotal, 40 * 5200 + 10 * 18000 + 30 * 7800 + 550000)
assert.equal(S.orderTotals(appr).pendingApprovalCount, 0)
assert(item(appr, 'Cement').history.some((h) => h.type === 'PRICE_CHANGE' && h.to === 11000), 'price change recorded')
const rej = ok(S.decidePrice(b1, ci.itemId, customer, 'reject')).order
assert.equal(item(rej, 'Cement').sourcingStatus, 'UNRESOLVED'); assert.equal(S.orderTotals(rej).unresolvedCount, 1)
assert.equal(S.orderTotals(rej).confirmedSubtotal, 40 * 5200 + 10 * 18000 + 30 * 7800, 'declined price is never charged')

// 7. No eligible merchant remaining -> UNRESOLVED / awaiting, nothing fabricated
const onlyA = { merchants: merchants.filter((m) => ['A', 'C', 'D'].includes(m.id)), products, at: AT }
const none = ok(S.declineSourcing(o, cement.itemId, mA, { confirmed: true }, onlyA))
assert.equal(none.rerouted, false); assert.equal(item(none.order, 'Cement').sourcingStatus, 'UNRESOLVED'); assert.equal(item(none.order, 'Cement').currentMerchantId, null)
assert(item(none.order, 'Cement').history.some((h) => h.type === 'NO_ELIGIBLE_MERCHANT'))
assert.equal(item(none.order, 'Iron Rod 12mm').currentMerchantId, 'A', 'other items unaffected')
assert.equal(S.rebuildSubOrders(none.order, merchants).subOrders.length, 1)
assert.equal(S.orderTotals(none.order).unresolvedCount, 1)

// 8. Duplicate rerouting prevention
code(S.rerouteItem(o2, cement.itemId, ctx), 'NOT_PENDING_REASSIGNMENT')
code(S.rerouteItem(o, cement.itemId, ctx), 'NOT_PENDING_REASSIGNMENT')
const second = ok(S.declineSourcing(o2, cement.itemId, mB, { confirmed: true }, ctx))
assert.equal(second.to.merchantId, 'E', 'next merchant, never A (declined) or B (declined)')
assert.deepEqual(item(second.order, 'Cement').declinedBy, ['A', 'B'])
const third = ok(S.declineSourcing(second.order, cement.itemId, mE, { confirmed: true }, ctx))
assert.equal(third.rerouted, false, 'everyone eligible has declined'); assert.equal(item(third.order, 'Cement').sourcingStatus, 'UNRESOLVED')
code(S.adminAssign(third.order, cement.itemId, 'A', admin, ctx), 'ALREADY_DECLINED')
code(S.adminAssign(third.order, cement.itemId, 'S', admin, ctx), 'MERCHANT_NOT_ELIGIBLE')
code(S.adminAssign(third.order, cement.itemId, 'D', customer, ctx), 'FORBIDDEN')
code(S.adminAssign(third.order, cement.itemId, 'D', mA, ctx), 'FORBIDDEN')
const manual = ok(S.adminAssign(third.order, cement.itemId, 'D', admin, ctx)).order
assert.equal(item(manual, 'Cement').currentMerchantId, 'D'); assert.equal(item(manual, 'Cement').sourcingStatus, 'SOURCING_REQUESTED', 'D must still confirm; nothing is claimed as sourced')

// 13. Rerouting history preserved
const h = item(second.order, 'Cement').history.map((x) => x.type)
assert.deepEqual(h.slice(0, 1), ['ASSIGNED'])
for (const type of ['SOURCING_DECLINED', 'REASSIGNMENT_PENDING', 'REROUTED']) assert(h.includes(type), type)
assert.equal(item(second.order, 'Cement').history.find((x) => x.type === 'ASSIGNED').to, 'A', 'original assignment preserved')
const rr = item(o2, 'Cement').history.find((x) => x.type === 'REROUTED'); assert.equal(rr.from, 'A'); assert.equal(rr.to, 'B')

// 14 + role isolation: merchants only see/modify their own items
const viewA = S.itemsForMerchant(o3, 'A'), viewB = S.itemsForMerchant(o3, 'B')
assert.deepEqual(viewA.current.map((i) => i.name).sort(), ['Iron Rod 12mm', 'Longspan Roofing Sheet', 'Sharp Sand'])
assert.deepEqual(viewA.former.map((i) => i.name), ['Cement']); assert.equal(viewA.former[0].status, 'No longer assigned to you')
assert.equal(viewA.former[0].unitPrice, undefined, 'A cannot see the new merchant price')
assert.deepEqual(viewB.current.map((i) => i.name), ['Cement']); assert.equal(viewB.former.length, 0)
code(S.confirmSourcing(o3, cement.itemId, mA, confirm), 'NOT_ASSIGNED')            // A no longer owns cement
code(S.declineSourcing(o3, cement.itemId, mA, { confirmed: true }, ctx), 'NOT_ASSIGNED')
code(S.confirmSourcing(o3, cement.itemId, customer, confirm), 'FORBIDDEN')
code(S.confirmSourcing(o3, cement.itemId, admin, confirm), 'FORBIDDEN')
code(S.confirmSourcing(o3, cement.itemId, { role: 'merchant' }, confirm), 'FORBIDDEN')
code(S.advanceFulfilment(o3, item(o3, 'Sharp Sand').itemId, mB, 'PREPARING'), 'NOT_ASSIGNED')

// 12. Item-level fulfilment tracking
const sand = item(o3, 'Sharp Sand').itemId, rod = item(o3, 'Iron Rod 12mm').itemId
code(S.advanceFulfilment(o3, sand, mA, 'READY'), 'INVALID_TRANSITION')
code(S.advanceFulfilment(o3, sand, mA, 'ACCEPTED'), 'INVALID_STATUS')
code(S.advanceFulfilment(o3, sand, mA, 'TELEPORTED'), 'INVALID_STATUS')
let f = o3
for (const st of ['PREPARING', 'READY', 'DISPATCHED', 'DELIVERED']) f = ok(S.advanceFulfilment(f, sand, mA, st)).order
assert.equal(item(f, 'Sharp Sand').fulfilment, 'DELIVERED'); assert.equal(item(f, 'Iron Rod 12mm').fulfilment, 'PENDING', 'other items track independently')
assert.equal(item(f, 'Cement').fulfilment, 'PENDING')

// 11 + 14. Merchant-specific wallet allocation (95/5), disputes hold the affected item only
assert.deepEqual(S.split(1000000), { gross: 1000000, merchantShare: 950000, commission: 50000 })
let w = appr // cement approved with B, other items with A
for (const st of ['PREPARING', 'READY', 'DISPATCHED', 'DELIVERED']) { w = ok(S.advanceFulfilment(w, sand, mA, st)).order; w = ok(S.advanceFulfilment(w, cement.itemId, mB, st)).order }
const alloc0 = Object.fromEntries(S.merchantAllocations(w).map((a) => [a.merchantId, a]))
assert.equal(alloc0.A.pending.gross, 40 * 5200 + 10 * 18000 + 30 * 7800); assert.equal(alloc0.B.pending.gross, 550000)
assert.equal(alloc0.A.settled.gross, 0, 'nothing settles before acceptance')
code(S.acceptItem(w, sand, mA), 'FORBIDDEN')
code(S.acceptItem(w, rod, customer), 'INVALID_STATE')
w = ok(S.acceptItem(w, sand, customer, { at: AT })).order
w = ok(S.acceptItem(w, cement.itemId, customer, { at: AT })).order
const alloc = Object.fromEntries(S.merchantAllocations(w).map((a) => [a.merchantId, a]))
assert.deepEqual(alloc.A.settled, { gross: 180000, merchantShare: 171000, commission: 9000 })
assert.deepEqual(alloc.B.settled, { gross: 550000, merchantShare: 522500, commission: 27500 })
assert.equal(w.ledger.filter((l) => l.merchantId === 'B').every((l) => l.itemId === cement.itemId), true, 'B is paid only for B\'s item')
assert.equal(w.ledger.filter((l) => l.merchantId === 'A').every((l) => l.itemId === sand), true, 'A is never paid for B\'s item')
assert(w.ledger.every((l) => l.simulated === true))
assert.equal(alloc.A.settled.gross + alloc.B.settled.gross, 730000)
// dispute holds only the affected item and merchant
let d = appr
for (const st of ['PREPARING', 'READY', 'DISPATCHED', 'DELIVERED']) { d = ok(S.advanceFulfilment(d, cement.itemId, mB, st)).order; d = ok(S.advanceFulfilment(d, sand, mA, st)).order }
code(S.openDispute(d, cement.itemId, mB, 'x'), 'FORBIDDEN'); code(S.openDispute(d, cement.itemId, customer, '  '), 'REASON_REQUIRED')
d = ok(S.openDispute(d, cement.itemId, customer, 'Bags damaged', { at: AT })).order
code(S.acceptItem(d, cement.itemId, customer), 'ON_HOLD')
const dalloc = Object.fromEntries(S.merchantAllocations(d).map((a) => [a.merchantId, a]))
assert.equal(dalloc.B.held.gross, 550000); assert.equal(dalloc.B.pending.gross, 0); assert.equal(dalloc.A.held.gross, 0, 'A\'s items are not held')
d = ok(S.acceptItem(d, sand, customer)).order // A's item still settles
assert.equal(S.merchantAllocations(d).find((a) => a.merchantId === 'A').settled.merchantShare, 171000)
code(S.resolveDispute(d, cement.itemId, mB, 'release'), 'FORBIDDEN'); code(S.resolveDispute(d, cement.itemId, customer, 'release'), 'FORBIDDEN')
const released = ok(S.resolveDispute(d, cement.itemId, admin, 'release')).order
assert.equal(ok(S.acceptItem(released, cement.itemId, customer)).settlement.merchantShare, 522500)
const refunded = ok(S.resolveDispute(d, cement.itemId, admin, 'refund')).order
assert.equal(S.merchantAllocations(refunded).find((a) => a.merchantId === 'B').refunded, 550000)
assert.equal(S.merchantAllocations(refunded).find((a) => a.merchantId === 'B').held.gross, 0)

// Immutability: no action mutates its input
const snap = JSON.stringify(o); S.declineSourcing(o, cement.itemId, mA, { confirmed: true }, ctx); S.confirmSourcing(o, cement.itemId, mA, confirm); assert.equal(JSON.stringify(o), snap)

// Legacy orders upgrade cleanly (idempotent)
const legacy = { id: 'WK-9', items: [{ name: 'Cement', quantity: 3, price: 10800 }], subOrders: [{ merchantId: 'A', status: 'Shipped', items: [{ name: 'Cement' }] }] }
const up = S.upgradeOrder(legacy); assert.equal(up.items[0].currentMerchantId, 'A'); assert.equal(up.items[0].fulfilment, 'DISPATCHED'); assert.equal(S.upgradeOrder(up), up)

// The 60% rule is untouched: sourcing/rerouting never changes initial matching
const lines = [{ id: 'l1', name: 'Cement', quantity: 50, unit: 'bags' }, { id: 'l2', name: 'Iron Rod 12mm', quantity: 40, unit: 'pieces' }, { id: 'l3', name: 'Sharp Sand', quantity: 10, unit: 'tonnes' }, { id: 'l4', name: 'Longspan Roofing Sheet', quantity: 30, unit: 'pieces' }]
const m1 = matchQuotation(lines, merchants, products, 60)
const mA1 = m1.results.find((r) => r.merchant.id === 'A'), mB1 = m1.results.find((r) => r.merchant.id === 'B')
assert.equal(mA1.percentage, 75); assert.equal(mA1.eligible, true, 'A covers 3 of 4 lines')
assert.equal(mB1.eligible, false, 'B is below 60% for the whole order...')
assert(S.findRerouteCandidates({ ...item(o, 'Cement'), declinedBy: ['A'], currentMerchantId: null }, ctx).some((x) => x.merchantId === 'B'), '...yet may still take ONE rerouted item')
assert.deepEqual(m1.eligible.map((r) => r.merchant.id), ['A'], 'initial eligible set unchanged; B did not become eligible')
assert.equal(JSON.stringify(matchQuotation(lines, merchants, products, 60)), JSON.stringify(m1), 'matching is pure and unaffected by order actions')

console.log('Sourcing tests passed (unavailable items stay, explicit confirmation, item-level rerouting, eligibility, no-merchant, duplicates, approvals, multi-merchant orders, 95/5 allocation, fulfilment, history, roles, 60% rule intact).')
