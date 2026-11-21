import assert from 'node:assert/strict'
import { categories, MERCHANT_CATEGORY_NAMES } from '../src/constants/categories.js'
import { MARKET_CATEGORIES, MARKET_CATEGORY_NAMES, marketCategoryOf } from '../src/constants/marketCategories.js'
import { seedState } from '../src/data/seed.js'
import { migrateCategory, migrateCategories } from '../src/utils/migrateCategories.js'
import { CATEGORY_MERCHANTS, CATEGORY_PRODUCTS } from '../src/data/categoryProducts.js'
import { withSeedExtras } from '../src/data/quoteSeed.js'

const official = new Set(MERCHANT_CATEGORY_NAMES)

// 1. Two taxonomies: 30 merchant categories and 12 customer-facing categories, with a complete mapping
const CUSTOMER_12 = ['Building Materials', 'Electrical & Lighting', 'Plumbing & Sanitary', 'AC & HVAC', 'Wood & Furniture Materials', 'Doors, Windows & Hardware', 'Paints & Wall Finishes', 'Tiles & Flooring', 'Ceiling, POP & Partition', 'Roofing & Waterproofing', 'Steel, Aluminium & Metal', 'General Hardware & Consumables']
assert.equal(categories.length, 30)
assert.equal(new Set(MERCHANT_CATEGORY_NAMES).size, 30, 'No duplicate merchant categories')
assert.deepEqual(MARKET_CATEGORY_NAMES, CUSTOMER_12, 'Customer-facing categories must be exactly the 12 approved names, in order')
assert(MARKET_CATEGORIES.every((c) => c.short && c.icon), 'Every customer category needs a short label and an icon')
assert(!MARKET_CATEGORIES.some((c) => /water tank|water pump/i.test(c.name)))
for (const c of categories) assert(CUSTOMER_12.includes(c.customerCategory), `"${c.name}" must map to one of the 12 customer categories`)
assert.equal(marketCategoryOf({ category: 'Cement Merchant' }), 'Building Materials')
assert.equal(marketCategoryOf({ category: 'Iron Rods & Reinforcement Materials Merchant' }), 'Steel, Aluminium & Metal')
assert.equal(marketCategoryOf({ category: 'Tiles & Flooring' }), 'Tiles & Flooring', 'Customer names pass through')
assert.equal(marketCategoryOf({ category: 'Building Materials', name: 'Tile Adhesive 25kg' }), 'Building Materials', 'Legacy names still resolve')

// 2. Seeded products + merchants only use official categories
const seed = seedState()
for (const p of seed.products) assert(official.has(p.category), `Seed product "${p.name}" uses unknown category "${p.category}"`)
for (const m of seed.merchants) for (const c of m.categories) assert(official.has(c), `Seed merchant "${m.name}" uses unknown category "${c}"`)

// 3. Old saved data is migrated onto the 30
assert.equal(migrateCategory('Building Materials', 'Dangote Cement 50kg'), 'Cement Merchant')
assert.equal(migrateCategory('Building Materials', 'Tile Adhesive 25kg'), 'Tile Adhesive & Grout Merchant')
assert.equal(migrateCategory('Tiles & Flooring', 'Royal White Granite Tile'), 'Marble & Granite Merchant')
assert.equal(migrateCategory('Paint Merchant'), 'Paint Merchant', 'Valid names must pass through untouched')
const migrated = migrateCategories({
  products: [{ name: 'Binding Wire', category: 'Steel, Aluminium & Metal' }, { name: 'X', category: 'AC & HVAC' }],
  merchants: [{ name: 'Old Co', categories: ['Building Materials', 'Cement Merchant'] }],
})
assert(migrated.products.every((p) => official.has(p.category)))
assert.deepEqual(migrated.merchants[0].categories, ['Cement Merchant'], 'Duplicates must collapse after migration')


// 4. Every one of the 30 categories has sellable products (>= 2) from an approved merchant that lists it
const byId = Object.fromEntries(CATEGORY_MERCHANTS.map((m) => [m.id, m]))
assert.equal(new Set(CATEGORY_PRODUCTS.map((p) => p.id)).size, CATEGORY_PRODUCTS.length, 'Product ids must be unique')
assert.equal(new Set(CATEGORY_PRODUCTS.map((p) => p.name)).size, CATEGORY_PRODUCTS.length, 'Product names must be unique (product pages look up by name)')
for (const m of CATEGORY_MERCHANTS) {
  assert.equal(m.status, 'approved', `${m.name} must be approved so shoppers can see its products`)
  for (const c of m.categories) assert(official.has(c), `${m.name} lists unknown category "${c}"`)
}
for (const p of CATEGORY_PRODUCTS) {
  assert(official.has(p.category), `${p.name} uses unknown category "${p.category}"`)
  assert(byId[p.merchantId]?.categories.includes(p.category), `${p.name} is sold by a merchant that does not list "${p.category}"`)
  assert(p.price > 0 && p.stock > 0 && p.available === true && p.unit && p.image.startsWith('data:image/svg+xml'), `${p.name} is missing price/stock/unit/image`)
}
for (const name of MERCHANT_CATEGORY_NAMES) {
  const n = CATEGORY_PRODUCTS.filter((p) => p.category === name).length
  assert(n >= 2, `Category "${name}" has only ${n} product(s)`)
}

// 5. The merge into saved state is additive and idempotent
const base = { products: [{ id: 'p-101', name: 'Dangote Cement 50kg', category: 'Cement Merchant', image: 'x' }], merchants: [{ id: 'm-101', status: 'approved' }] }
const once = withSeedExtras(base)
const twice = withSeedExtras(once)
assert(CATEGORY_PRODUCTS.every((p) => once.products.some((x) => x.id === p.id)), 'Merge must add every category product')
assert(CATEGORY_MERCHANTS.every((m) => once.merchants.some((x) => x.id === m.id)), 'Merge must add every category merchant')
assert.equal(twice.products.length, once.products.length, 'Merging twice must not duplicate products')
assert.equal(twice.merchants.length, once.merchants.length, 'Merging twice must not duplicate merchants')

console.log('WakaStore category tests passed (12 customer + 30 merchant categories, full mapping; 2+ sellable products per merchant category; legacy migration clean).')
