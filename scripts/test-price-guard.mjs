// Price omission tests: pasted lists / documents never carry prices into a request.
// Run: node scripts/test-price-guard.mjs   (or npm run test:price-guard)
import assert from 'node:assert/strict'
import { parseMaterialLine, parseMaterialText } from '../src/services/ai/materialParser.js'
import { classifyLine, containsPrice, normalizeCells, redactTextPrices, sanitizeExtraction, sanitizeItem, stripPrices } from '../src/services/ai/priceGuard.js'
import { buildAiResult } from '../src/services/ai/aiItems.js'

let passed = 0
const ok = (m) => { passed += 1; console.log('ok  ', m) }
const L = parseMaterialLine
const eq = (line, want) => { const r = L(line); for (const [k, v] of Object.entries(want)) assert.deepEqual(r[k], v, `${JSON.stringify(line)} -> ${k}: got ${JSON.stringify(r[k])}, want ${JSON.stringify(v)}`); return r }
const NO_PRICE = /₦|\bNGN\b|\bN\s?\d|#\s?\d{3}|8,?500|6,?500|425,?000|170,?000|45,?000|260,?000|450,?000|\$/i
// What a customer or merchant can actually see: the fields of each line, never the internal flag names.
const visible = (items) => items.map((i) => `${i.name} | ${i.specs} | ${i.notes}`).join('\n')

// ---- 1. explicit price markers, every common Nigerian style ----
for (const [line, want] of [
  ['Cement — 50 bags @ ₦8,500', { name: 'Cement', quantity: 50, unit: 'bags' }],
  ['Cement - 50 bags @ 8500', { name: 'Cement', quantity: 50, unit: 'bags' }],
  ['50 bags of cement at N8,500 per bag', { name: 'Cement', quantity: 50, unit: 'bags' }],
  ['Cement 50 bags - N 8500 each', { name: 'Cement', quantity: 50, unit: 'bags' }],
  ['Iron Rod 12mm — 40 pieces — ₦6,500 each', { name: 'Iron Rod', quantity: 40, unit: 'pieces', specs: '12mm' }],
  ['Iron rod 12mm - 40 pieces #6,500', { name: 'Iron rod', quantity: 40, unit: 'pieces', specs: '12mm' }],
  ['Sharp sand 10 tonnes price: 45,000', { name: 'Sharp sand', quantity: 10, unit: 'tonnes' }],
  ['Sharp sand 10 tonnes rate 45,000', { name: 'Sharp sand', quantity: 10, unit: 'tonnes' }],
  ['Granite 3/4 - 5 tonnes NGN 60000', { name: 'Granite 3/4', quantity: 5, unit: 'tonnes' }],
  ['Cement 50kg x 20 bags = 170,000', { name: 'Cement', quantity: 20, unit: 'bags', specs: '50kg' }],
  ['Cement 50kg x 20 bags = ₦170,000', { name: 'Cement', quantity: 20, unit: 'bags', specs: '50kg' }],
  ['Roofing nails 3 inch 5 packs @ 1,200/pack', { name: 'Roofing nails', quantity: 5, unit: 'packs', specs: '3in' }],
  ['Binding wire 3 rolls ($20 each)', { name: 'Binding wire', quantity: 3, unit: 'rolls' }],
  ['Emulsion paint 20L 6 buckets rate 12,000', { name: 'Emulsion paint', quantity: 6, unit: 'buckets', specs: '20L' }],
  ['Cement 50 bags 8.5k naira', { name: 'Cement', quantity: 50, unit: 'bags' }],
  ['Cement 50 bags 8,500 naira', { name: 'Cement', quantity: 50, unit: 'bags' }],
]) {
  const r = eq(line, want)
  assert(r.flags.includes('PRICE_REMOVED'), `${line} flagged PRICE_REMOVED`)
  assert(!NO_PRICE.test(`${r.name} ${r.specs} ${r.notes}`), `${line} -> price leaked: ${JSON.stringify(r)}`)
  assert.equal(r.needsReview, false, `${line}: a clearly-marked price needs no confirmation`)
}
ok('16 price styles (@, at, N, ₦, NGN, #, naira, k, price:, rate, =, per unit, $) removed; name/qty/unit/spec intact')

// ---- 2. unmarked price columns ----
let r = eq('Cement 50 bags 8500', { name: 'Cement', quantity: 50, unit: 'bags' })
assert(r.flags.includes('PRICE_CHECK') && r.needsReview, 'bare price number removed AND line flagged for the customer to check')
r = eq('Cement - 50 bags - 8,500 - 425,000', { name: 'Cement', quantity: 50, unit: 'bags' })
assert(r.needsReview)
r = eq('Roofing nails 3500', { name: 'Roofing nails', quantity: 3500 })
assert(r.flags.includes('POSSIBLE_PRICE') && r.needsReview, 'ambiguous bare number is NEVER deleted, always flagged')
ok('unmarked price numbers: removed when clearly a price column, only flagged (never deleted) when ambiguous')

// ---- 3. spreadsheet rows (Excel / Sheets / pipes) ----
r = eq('Cement\t50\tbags\t8500\t425000', { name: 'Cement', quantity: 50, unit: 'bags' })
assert.equal(r.needsReview, false, 'qty+unit anchor makes the price columns certain')
eq('1 | Cement | 50 | bags | 8,500 | 425,000', { name: 'Cement', quantity: 50, unit: 'bags' })
eq('2\tIron rod 12mm\t40\tpieces\t6500\t260000', { name: 'Iron rod', quantity: 40, unit: 'pieces', specs: '12mm' })
r = eq('Cement | 50 | 8500 | 425000', { name: 'Cement', quantity: 50 }); assert(r.needsReview, 'no unit column: price columns dropped but line flagged')
assert.deepEqual(normalizeCells('Cement | 50 | bags').text, 'Cement 50 bags')
ok('table rows: serial no., rate and amount columns dropped; item, qty, unit kept')

// ---- 4. whole documents ----
const invoice = `QUOTATION
Item | Qty | Unit Price | Amount
1 | Cement 50kg | 50 | bags | 8,500 | 425,000
2 | Iron rod 12mm | 40 | pieces | 6,500 | 260,000
3 | Sharp sand | 10 | tonnes | 45,000 | 450,000
Subtotal: ₦1,135,000
VAT (7.5%): ₦85,125
Delivery fee: ₦20,000
Grand Total: ₦1,240,125
Bank: GTBank   Account No: 0123456789
Payment terms: 50% upfront`
const doc = parseMaterialText(invoice)
assert.deepEqual(doc.items.map((i) => [i.name, i.quantity, i.unit]), [['Cement', 50, 'bags'], ['Iron rod', 40, 'pieces'], ['Sharp sand', 10, 'tonnes']], JSON.stringify(doc.items.map((i) => i.name)))
assert.equal(doc.warnings[0].code, 'PRICE_REMOVED'); assert(!NO_PRICE.test(visible(doc.items)), visible(doc.items))
ok('a full supplier quotation pasted in: only the 3 materials survive; totals, VAT, fee, bank details and header dropped')

const whatsapp = `Good morning, I need:\n50 bags cement - ₦8,500 each\n40 pcs 12mm iron rod @6,500\n10 tonnes sharp sand`
const wa = parseMaterialText(whatsapp)
assert(wa.items.some((i) => /cement/i.test(i.name) && i.quantity === 50) && wa.items.some((i) => /iron rod/i.test(i.name) && i.quantity === 40 && i.specs === '12mm') && wa.items.some((i) => /sand/i.test(i.name) && i.quantity === 10))
assert(!NO_PRICE.test(visible(wa.items)), 'chatty WhatsApp list with prices')
ok('chatty WhatsApp-style list with prices handled')

assert.equal(parseMaterialText('₦8,500\n₦425,000').items.length, 0); ok('lines that are only a price are dropped (no phantom materials)')

// ---- 5. never touches clean lines ----
for (const clean of ['Cement — 50 bags', 'Sharp Sand — 10 tonnes', 'Iron Rod 12mm — 40 pieces', '200 pieces of 12mm iron rods', '20 lengths of 2 × 2 timber', 'Cement 50kg x 20 bags', '3. Emulsion paint 20L - 6 buckets', '1,500 pcs 9 inch blocks', 'PVC pipe 4in - 20 lgth', 'Binding wire x 3', 'Plywood N12mm 20 sheets', 'Pipe N 50 bags', '#1 Cement 50 bags', 'Cement 20 bags @ 50 bags', 'total 50 bags', 'Fire door 2100 x 900 - 4 pieces', 'Blocks 9 inch - 1,500 pieces']) {
  assert(!containsPrice(clean), `false positive: ${clean}`)
  const p = L(clean)
  assert(!p.flags.includes('PRICE_REMOVED') && !p.flags.includes('PRICE_CHECK'), `false positive flag: ${clean} ${JSON.stringify(p.flags)}`)
}
ok('17 clean lines (sizes, "N12mm", list numbers, 1,500 pcs, 2100 x 900) never touched')
assert.equal(L('Xtra strong adhesive 5 buckets').name, 'Xtra strong adhesive'); ok('names starting with X keep their first letter')

// ---- 6. live editing guard (no tidy while typing) ----
assert.deepEqual(stripPrices('Cement ₦8,500', { tidy: false }), { text: 'Cement  ', removed: ['₦8,500'], changed: true })
assert.equal(stripPrices('Cement 50kg', { tidy: false }).changed, false)
ok('typing a price while editing is stripped without disturbing spaces')

// ---- 7. AI / network results are swept ----
const swept = sanitizeExtraction({ items: [
  { id: 'a', name: 'Cement @ ₦8,500', quantity: 50, unit: 'bags', specs: '', notes: 'price 8,500', price: 8500, unitPrice: 8500, total: 425000, flags: [], needsReview: false, confidence: 0.9 },
  { id: 'b', name: '₦12,000', quantity: 1, unit: '', specs: '', notes: '', flags: [] },
  { id: 'c', name: 'Sand', quantity: 5, unit: 'tonnes', specs: '', notes: '', flags: [], amount: 1 },
], warnings: [] })
assert.equal(swept.items.length, 2); assert.equal(swept.items[0].name, 'Cement'); assert.equal(swept.items[0].notes, '')
for (const i of swept.items) for (const k of Object.keys(i)) assert(!/pric|total|amount|cost|rate/i.test(k), `price key ${k} dropped`)
assert(swept.items[0].flags.includes('PRICE_REMOVED')); assert.equal(swept.warnings[0].code, 'PRICE_REMOVED'); assert.equal(swept.priceRemoved, true)
assert.equal(sanitizeItem(null).item, null)
ok('sanitizeExtraction: price text and price-named keys removed, price-only line dropped, customer warned')

const built = buildAiResult({ document_has_prices: true, items: [{ name: 'Cement', quantity: '50', unit: 'bag', specs: '', notes: '', uncertain: false, unit_price: 8500 }, { name: 'Wire', quantity: 0, unit: 'rolls', specs: '', notes: '', uncertain: false }, { name: '', quantity: 2, unit: '', specs: '', notes: '' }] })
assert.equal(built.items.length, 2); assert.equal(built.items[0].quantity, 50); assert.equal(built.items[0].unit, 'bags'); assert.equal(built.items[1].quantity, null); assert(built.items[1].flags.includes('INVALID_QUANTITY'))
assert.equal(built.warnings[0].code, 'PRICE_REMOVED'); assert(built.warnings.some((w) => w.code === 'LINE_SKIPPED'))
ok('AI results use the same flags as the parser (string qty coerced, 0 -> invalid, nameless line dropped)')

assert.equal(classifyLine('Grand Total: 1,240,125'), 'total'); assert.equal(classifyLine('S/N | Description | Qty | Rate | Amount'), 'header'); assert.equal(classifyLine('Cement 50 bags'), null)
assert.equal(redactTextPrices('Cement 50 bags @ ₦8,500\nTotal: 425,000\nSand 10 tonnes').text, 'Cement 50 bags\nSand 10 tonnes')
ok('line classifier + pre-AI redaction')

console.log(`\nPrice guard tests passed (${passed} groups).`)
