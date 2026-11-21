import assert from 'node:assert/strict'
import { extractSpecs, parseQuery, scoreMatch, searchCatalogue, compareSpec } from '../src/services/productSearch.js'
import { matchQuotation } from '../src/services/matching.js'

const P = (id, name, category, extra = {}) => ({ id, merchantId: 'm1', name, category, price: 1000, stock: 50, unit: 'bag', available: true, ...extra })
const catalogue = [
  P('c20', 'Cement 20kg', 'Cement Merchant'),
  P('c50', 'Cement 50kg', 'Cement Merchant'),
  P('r12', 'Iron Rod 12mm', 'Iron Rods & Reinforcement Materials Merchant', { unit: 'length' }),
  P('r16', 'Iron Rod 16mm', 'Iron Rods & Reinforcement Materials Merchant', { unit: 'length' }),
  P('rs', 'Longspan Roofing Sheet 0.55mm', 'Roofing Materials & Accessories Merchant', { unit: 'sheet' }),
  P('pp', 'PVC Pipe 4in', 'Plumbing Materials Merchant', { unit: 'length' }),
  P('t24', 'Timber 2x4', 'Timber Merchant', { unit: 'length' }),
  P('t22', 'Timber 2x2', 'Timber Merchant', { unit: 'length' }),
  P('sd', 'Sharp Sand', 'Sand Merchant', { unit: 'tonne' }),
]
const names = (r) => r.results.map((x) => x.product.name)
const top = (q) => searchCatalogue(q, catalogue).results[0]

// Spec parsing
assert.deepEqual(extractSpecs('Cement 20kg').specs, [{ type: 'measure', value: 20, unit: 'kg' }])
assert.deepEqual(extractSpecs('20 kg cement').specs, [{ type: 'measure', value: 20, unit: 'kg' }])
assert.deepEqual(extractSpecs('Timber 2 × 4').specs, [{ type: 'dims', values: [2, 4], unit: '' }])
assert.deepEqual(extractSpecs('Tile 60x60cm').specs, [{ type: 'dims', values: [60, 60], unit: 'cm' }])
assert.deepEqual(extractSpecs('Granite 3/4').specs, [{ type: 'frac', value: 0.75, raw: '3/4' }])
assert.deepEqual(extractSpecs('Cement 20').specs, [{ type: 'bare', value: 20 }])

// The reported bug and the brief's table
assert.equal(top('Cement 20kg').product.id, 'c20'); assert.equal(top('Cement 20kg').kind, 'exact')
{
  const r = searchCatalogue('Cement 20', catalogue)
  assert.equal(r.results[0].product.id, 'c20', '"Cement 20" must suggest Cement 20kg')
  assert.equal(r.results[0].kind, 'suggestion', 'bare number is a suggestion, not an exact match')
  assert(!names(r).includes('Cement 50kg'), 'must NOT drift to Cement 50kg')
  assert(r.otherSpecs.some((p) => p.id === 'c50'), 'other size reported separately')
  assert.equal(r.exact.length, 0)
}
assert.deepEqual(names(searchCatalogue('cement', catalogue)).sort(), ['Cement 20kg', 'Cement 50kg'])
assert.equal(top('20kg cement').product.id, 'c20'); assert.equal(top('20kg cement').kind, 'exact')
assert.equal(top('Iron Rod 12mm').product.id, 'r12'); assert.equal(top('12mm iron rod').product.id, 'r12')
assert(!names(searchCatalogue('12mm iron rod', catalogue)).includes('Iron Rod 16mm'), '12mm never becomes 16mm')
assert.equal(top('Roofing sheet').product.id, 'rs'); assert.equal(top('roof sheets').product.id, 'rs')
assert.equal(top('Plumbing pipe').product.id, 'pp'); assert.equal(top('plumbing pipe').kind !== 'none', true)

// Normalisation: case, spaces, punctuation, word order, plural, alias, prefix
for (const q of ['  CEMENT   20KG ', 'cement, 20kg.', '20 KG - Cement', 'Cement (20 kg)']) assert.equal(top(q).product.id, 'c20', q)
assert.equal(top('rebar 12mm').product.id, 'r12', 'alias: rebar -> iron rod')
assert.equal(top('iron rods 12mm').product.id, 'r12', 'plural')
assert.equal(top('roof').product.id, 'rs', 'prefix')
assert.equal(top('timber 2 x 4').product.id, 't24'); assert.equal(top('4x2 timber').product.id, 't24', 'dims order-insensitive')
assert.equal(top('2x2 timber').product.id, 't22')
assert.deepEqual(names(searchCatalogue('timber', catalogue)).sort(), ['Timber 2x2', 'Timber 2x4'])

// Ranking: exact above partial; no-match -> empty state / custom request
{
  const r = searchCatalogue('iron rod', catalogue); assert.equal(r.results.length, 2); assert(r.results.every((x) => x.kind === 'exact'))
  const mixed = searchCatalogue('cement 50kg bag', [P('x', 'Cement'), P('c50', 'Cement 50kg', 'Cement Merchant')])
  assert.equal(mixed.results[0].product.id, 'c50', 'exact spec match outranks spec-less product')
  const none = searchCatalogue('chandelier crystal', catalogue)
  assert.equal(none.results.length, 0); assert(none.isCustomRequest); assert.equal(none.hasCatalogueMatch, false)
  assert.equal(searchCatalogue('   ', catalogue).results.length, 0)
  assert.equal(searchCatalogue('cement 100kg', catalogue).results.length, 0, 'unlisted size is not substituted'); assert.equal(searchCatalogue('cement 100kg', catalogue).otherSpecs.length, 2)
}
assert.equal(compareSpec({ type: 'bare', value: 20 }, [{ type: 'measure', value: 50, unit: 'kg' }]), 'conflict')

// Quotation line matching uses the same engine (60% rule inputs)
const merchants = [{ id: 'm1', name: 'A', status: 'approved' }]
const lineMatch = (line) => matchQuotation([{ id: 'l1', quantity: 1, unit: '', ...line }], merchants, catalogue, 60).results[0]
assert.equal(lineMatch({ name: 'Cement 20kg' }).matchedCount, 1)
assert.equal(lineMatch({ name: 'Cement 20' }).matchedCount, 0, '"Cement 20" is a suggestion, not a confirmed supply match')
assert.equal(lineMatch({ name: 'Cement 50kg' }).matched[0].product.id, 'c50')
assert.equal(lineMatch({ name: '12mm iron rod' }).matched[0].product.id, 'r12')
assert.equal(lineMatch({ name: 'Iron rod 20mm' }).matchedCount, 0)
assert.equal(lineMatch({ name: 'Plumbing pipe' }).matchedCount, 0, 'category words alone never prove stock')
assert.equal(lineMatch({ name: 'Cement' }).matchedCount, 1)
assert.equal(lineMatch({ name: 'roofing sheet' }).matchedCount, 1)
assert.equal(lineMatch({ name: '20kg cement' }).matched[0].product.id, 'c20', 'word order')
assert.equal(lineMatch({ name: 'rebar 12mm' }).matched[0].product.id, 'r12', 'alias')
assert.equal(lineMatch({ name: 'Cement 20' }).unmatched[0].suggestedProduct.id, 'c20', 'the unmatched line carries the suggestion')
assert.equal(lineMatch({ name: 'Cement 50' }).unmatched[0].suggestedProduct.id, 'c50')
assert.equal(lineMatch({ name: 'Cement 30kg' }).unmatched[0].suggestedProduct, undefined, 'no suggestion for a different size')

// Catalogue sanity on the real demo data
const { seedState } = await import('../src/data/seed.js')
const { withSeedExtras } = await import('../src/data/quoteSeed.js')
const real = withSeedExtras(seedState()).products
assert(searchCatalogue('cement', real).results.length >= 1, 'real catalogue has cement')
assert(searchCatalogue('roofing sheet', real).results.length >= 1, 'real catalogue has roofing')
console.log('Product search tests passed (spec parsing, brief table, normalisation, ranking, no silent spec substitution, matcher integration).')
