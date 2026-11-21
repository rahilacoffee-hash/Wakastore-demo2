// Launch business rules confirmed 20 Nov 2026:
//  1. Commission is 5% of materials, deducted from the MERCHANT. It is never added to the customer's total.
//  2. One merchant per order at launch: a merchant who cannot source an item does NOT push it to another merchant.
import assert from 'node:assert/strict'
import * as S from '../src/services/sourcing.js'

const AT = '2026-11-20T10:00:00.000Z'
const CEM = 'Cement Merchant'
const merchants = [
  { id: 'A', name: 'Merchant A', status: 'approved', active: true, categories: [CEM], acceptsSourcing: true },
  { id: 'B', name: 'Merchant B', status: 'approved', active: true, categories: [CEM], acceptsSourcing: true },
]
const products = [{ id: 'b1', merchantId: 'B', name: 'Cement 50kg', category: CEM, price: 9500, stock: 400, unit: 'bag', available: true }]
const mkOrder = () => {
  const items = S.buildItems('WK-2', [
    { lineId: 'l1', name: 'Cement', specification: '50kg', quantity: 10, unit: 'bags', merchantId: 'A', unavailable: true },
    { lineId: 'l2', name: 'Iron Rod 12mm', quantity: 20, unit: 'pieces', productRef: 'x', unitPrice: 5000, merchantId: 'A' },
  ], { at: AT })
  return S.rebuildSubOrders({ id: 'WK-2', customerEmail: 'a@b.test', items, subOrders: [], deliveryFee: 3000 }, merchants)
}
const mA = { role: 'merchant', merchantId: 'A' }
const decline = { confirmed: true, reason: 'Cannot source' }

// 1. commission
const t = S.orderTotals(mkOrder())
assert.equal(t.confirmedSubtotal, 100000)
assert.equal(t.fee, 5000, 'commission is 5% of materials')
assert.equal(t.total, 103000, 'customer pays materials + delivery only; commission is not added')

// 2a. single merchant: no reroute to B even though B stocks it
const single = S.declineSourcing(mkOrder(), mkOrder().items[0].itemId, mA, decline, { merchants, products, at: AT, multiMerchant: false })
assert.equal(single.ok, true)
assert.equal(single.rerouted, false)
assert.equal(single.order.items[0].sourcingStatus, S.SOURCING.UNRESOLVED)
assert.equal(single.order.items[0].currentMerchantId, null)

// 2b. multi-merchant (later phase) still reroutes when enabled
const multi = S.declineSourcing(mkOrder(), mkOrder().items[0].itemId, mA, decline, { merchants, products, at: AT, multiMerchant: true })
assert.equal(multi.rerouted, true)
assert.equal(multi.order.items[0].currentMerchantId, 'B')

console.log('Launch rules passed (5% commission from merchant, customer total excludes it, single-merchant orders do not reroute).')
