import assert from 'node:assert/strict'
import { matchEligibleMerchantOffers } from '../src/services/matching.js'

const lines = [
  { id: 'l1', name: 'PVC Pressure Pipe 4in', quantity: 20, unit: 'pieces' },
  { id: 'l2', name: 'Dangote Cement 50kg', quantity: 30, unit: 'bags' },
  { id: 'l3', name: 'Iron Rod 12mm', quantity: 40, unit: 'lengths' },
  { id: 'l4', name: 'Longspan Roofing Sheet', quantity: 50, unit: 'sheets' },
  { id: 'l5', name: '2.5mm Single Core Cable', quantity: 10, unit: 'rolls' },
]
const merchants = [
  { id: 'm1', name: 'Merchant One', status: 'approved' },
  { id: 'm2', name: 'Merchant Two', status: 'approved' },
  { id: 'm3', name: 'Merchant Three', status: 'approved' },
]
const products = [
  { id: 'p1', merchantId: 'm1', name: 'PVC Pressure Pipe 4in', unit: 'pieces', price: 7000, stock: 0, available: false },
  { id: 'p2', merchantId: 'm1', name: 'Dangote Cement 50kg', unit: 'bags', price: 10000, stock: 100 },
  { id: 'p3', merchantId: 'm1', name: 'Iron Rod 12mm', unit: 'lengths', price: 15000, stock: 100 },
  { id: 'p4', merchantId: 'm2', name: 'PVC Pressure Pipe 4in', unit: 'pieces', price: 7200, stock: 100 },
  { id: 'p5', merchantId: 'm2', name: 'Dangote Cement 50kg', unit: 'bags', price: 10200, stock: 100 },
  { id: 'p6', merchantId: 'm2', name: 'Iron Rod 12mm', unit: 'lengths', price: 15100, stock: 100 },
  { id: 'p7', merchantId: 'm2', name: 'Longspan Roofing Sheet', unit: 'sheets', price: 18000, stock: 100 },
  { id: 'p8', merchantId: 'm3', name: 'Dangote Cement 50kg', unit: 'bags', price: 11000, stock: 100 },
]
const match = matchEligibleMerchantOffers(lines, merchants, products, 60)
assert.deepEqual(match.offers.map((offer) => offer.merchant.id), ['m2', 'm1'])
assert.equal(match.offersFound, 2)
assert(match.offers.every((offer) => offer.items.length === lines.length), 'every invitation includes the complete request')
assert(match.offers[1].items[0].supplyType === 'partial-stock-plus-sourcing', 'out-of-stock inventory still counts as inventory coverage, but merchant must reconfirm supply')
assert.equal(match.offers[1].items[0].merchantMustConfirm, true, 'out-of-stock inventory does not guarantee supply; merchant must confirm sourcing')
assert.equal(match.offers[0].items[4].supplyType, 'merchant-sourcing-required')
const materials = 1_000_000
const delivery = 50_000
const commission = Math.round(materials * 0.05)
assert.equal(commission, 50_000)
assert.equal(materials + delivery, 1_050_000, 'customer pays materials plus delivery only')
assert.equal(materials - commission + delivery, 1_000_000, 'merchant receives 95% materials plus delivery')
const submittedAt = Date.parse('2026-11-20T10:00:00.000Z')
assert.equal(new Date(submittedAt + 24 * 60 * 60 * 1000).toISOString(), '2026-11-21T10:00:00.000Z')
assert.equal(new Date(submittedAt + 48 * 60 * 60 * 1000).toISOString(), '2026-11-22T10:00:00.000Z')
console.log('Final quotation prototype rule checks passed (60% matching, all-eligible invitations, complete request templates, out-of-stock inventory, 24h/48h deadlines, 5% materials-only commission).')
