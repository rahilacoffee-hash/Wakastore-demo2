import assert from 'node:assert/strict'
import { matchQuotation, parseMaterialsList } from '../src/services/matching.js'

const merchants = [{ id: 'm1', name: 'BuildRight', status: 'approved' }, { id: 'm2', name: 'PowerHouse', status: 'approved' }]
const products = [
  { id: 'p1', merchantId: 'm1', name: 'Tile Adhesive 25kg', unit: 'bag', price: 6500, stock: 120, available: true },
  { id: 'p2', merchantId: 'm2', name: 'Tile Adhesive 25kg', unit: 'bag', price: 6200, stock: 80, available: true },
]
const pct = (line) => Object.fromEntries(matchQuotation([{ id: 'l1', quantity: 1, ...line }], merchants, products, 60).results.map((r) => [r.merchant.id, r.percentage]))

// A pasted line with no unit parses to an empty unit, and must NOT be forced to 'pieces'
assert.equal(parseMaterialsList('Tile Adhesive 25kg')[0].unit, '', 'Unit-less pasted line must stay unit-less')

// No unit = any unit: the product is found
assert.deepEqual(pct({ name: 'Tile Adhesive 25kg', unit: '' }), { m1: 100, m2: 100 })
// Matching unit works
assert.deepEqual(pct({ name: 'Tile Adhesive 25kg', unit: 'bags' }), { m1: 100, m2: 100 })
// Wrong unit is still blocked (protects totals: metres of cable != price per roll) ...
const wrong = matchQuotation([{ id: 'l1', name: 'Tile Adhesive 25kg', quantity: 1, unit: 'pieces' }], merchants, products, 60)
assert.deepEqual(wrong.results.map((r) => r.percentage), [0, 0])
// ... but the result now explains WHY, instead of a bare "Missing"
assert(wrong.results.every((r) => r.unmatched[0].soldPerUnit === 'bag'), 'Unmatched line must say which unit the merchant sells it in')
// A genuinely missing item carries no unit hint
const none = matchQuotation([{ id: 'l1', name: 'Zebra Blinds 120cm', quantity: 1, unit: '' }], merchants, products, 60)
assert(none.results.every((r) => r.unmatched[0].soldPerUnit === undefined))

console.log('WakaStore quotation unit tests passed (unit-less = any unit; wrong unit blocked with a clear reason).')
