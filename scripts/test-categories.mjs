import assert from 'node:assert/strict'
import { categories, MERCHANT_CATEGORY_NAMES } from '../src/constants/categories.js'
import { MARKET_CATEGORIES, MARKET_CATEGORY_NAMES } from '../src/constants/marketCategories.js'
import { seedState } from '../src/data/seed.js'
import { migrateCategory, migrateCategories } from '../src/utils/migrateCategories.js'

const official = new Set(MERCHANT_CATEGORY_NAMES)

// 1. Shopper side is exactly the merchant side (same 30, same order)
assert.equal(categories.length, 30)
assert.deepEqual(MARKET_CATEGORY_NAMES, MERCHANT_CATEGORY_NAMES, 'Shopper categories must equal the 30 merchant categories')
assert(MARKET_CATEGORIES.every((c) => c.short && c.icon), 'Every shopper category needs a short label and an icon')
assert(!MARKET_CATEGORIES.some((c) => /water tank|water pump/i.test(c.name)))

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

console.log('WakaStore category tests passed (shopper = merchant = 30; seed data + legacy migration clean).')
