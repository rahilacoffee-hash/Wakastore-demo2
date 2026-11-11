import assert from 'node:assert/strict'
import { matchTwoMerchantOffers } from '../src/services/matching.js'
import { categories } from '../src/constants/categories.js'

assert.equal(categories.length, 30, 'WakaStore must expose exactly 30 official merchant categories')
assert(!categories.some((c) => /water tank|water pump/i.test(c.name)), 'Water tank and pump categories must stay excluded')

const lines = [
  { id: 'l1', name: 'Dangote Cement 50kg', quantity: 10, unit: 'bags' },
  { id: 'l2', name: 'Iron Rod 12mm', quantity: 20, unit: 'lengths' },
  { id: 'l3', name: 'PVC Pressure Pipe 4in', quantity: 5, unit: 'pieces' }
]
const merchants = [
  { id: 'm1', name: 'Merchant One', status: 'approved' },
  { id: 'm2', name: 'Merchant Two', status: 'approved' },
  { id: 'm3', name: 'Merchant Three', status: 'approved' }
]
const products = [
  { id: 'p1', merchantId: 'm1', name: 'Dangote Cement 50kg', price: 10000, stock: 10, unit: 'bags' },
  { id: 'p2', merchantId: 'm1', name: 'Iron Rod 12mm', price: 15000, stock: 20, unit: 'lengths' },
  { id: 'p3', merchantId: 'm2', name: 'Dangote Cement 50kg', price: 10500, stock: 10, unit: 'bags' },
  { id: 'p4', merchantId: 'm2', name: 'Iron Rod 12mm', price: 14500, stock: 20, unit: 'lengths' },
  { id: 'p5', merchantId: 'm3', name: 'Dangote Cement 50kg', price: 11000, stock: 10, unit: 'bags' },
  { id: 'p6', merchantId: 'm3', name: 'Iron Rod 12mm', price: 14000, stock: 20, unit: 'lengths' }
]
const result = matchTwoMerchantOffers(lines, merchants, products)
assert.equal(result.offersFound, 2, 'Return no more than two qualified merchants')
assert(result.offers.every((offer) => offer.items.length === lines.length), 'Every merchant offer must preserve the full materials list')
assert(result.offers.every((offer) => offer.items[2].supplyType === 'merchant-sourcing-required'), 'Missing materials must be marked for sourcing')
assert(result.offers.every((offer) => offer.items[2].unitPrice === null), 'Do not invent prices for outsourced materials')
console.log('WakaStore MVP matching tests passed (30 categories; two complete-list offer templates).')
