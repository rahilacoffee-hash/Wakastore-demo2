import assert from 'node:assert/strict'
import { parseMaterialLine, parseMaterialText } from '../src/services/ai/materialParser.js'
import { extractMaterials, EXTRACTION_STEPS } from '../src/services/ai/materialExtraction.js'

const L = parseMaterialLine
const eq = (line, want) => { const r = L(line); for (const [k, v] of Object.entries(want)) assert.deepEqual(r[k], v, `${line} -> ${k}: got ${JSON.stringify(r[k])}, want ${JSON.stringify(v)}`) }

// Formats from the brief and common Nigerian site-list styles
eq('Cement — 50 bags', { name: 'Cement', quantity: 50, unit: 'bags', specs: '' })
eq('Sharp Sand — 10 tonnes', { name: 'Sharp Sand', quantity: 10, unit: 'tonnes' })
eq('Iron Rod 12mm — 40 pieces', { name: 'Iron Rod', quantity: 40, unit: 'pieces', specs: '12mm' })
eq('Granite — 5 tonnes', { name: 'Granite', quantity: 5, unit: 'tonnes' })
eq('50 bags of Dangote cement.', { name: 'Dangote cement', quantity: 50, unit: 'bags' })
eq('200 pieces of 12mm iron rods', { name: 'Iron rods', quantity: 200, unit: 'pieces', specs: '12mm' })
eq('20 lengths of 2 × 2 timber', { name: 'Timber', quantity: 20, unit: 'lengths', specs: '2x2' })
eq('15 packs of roofing nails', { name: 'Roofing nails', quantity: 15, unit: 'packs' })
eq('Cement 50kg x 20 bags', { name: 'Cement', quantity: 20, unit: 'bags', specs: '50kg' })
eq('3. Emulsion paint 20L - 6 buckets', { name: 'Emulsion paint', quantity: 6, unit: 'buckets', specs: '20L' })
eq('1,500 pcs 9 inch blocks', { name: 'Blocks', quantity: 1500, unit: 'pieces', specs: '9in' })
eq('PVC pipe 4in - 20 lgth', { name: 'PVC pipe', quantity: 20, unit: 'lengths', specs: '4in' })
eq('Binding wire x 3', { name: 'Binding wire', quantity: 3 })
eq('2 sharp sand', { name: 'Sharp sand', quantity: 2 })

// Never guess: missing / unclear stays null or flagged
let r = L('Roofing nails')
assert.equal(r.quantity, null); assert(r.needsReview); assert(r.flags.includes('MISSING_QUANTITY'))
r = L('Iron rod 12mm - 4? pieces')
assert(r.flags.includes('UNCERTAIN_TEXT')); assert(r.needsReview); assert(r.confidence < 0.7)
r = L('Binding wire - [unclear] rolls')
assert(r.needsReview); assert.equal(r.quantity, null)
r = L('Sand - 0 bags')
assert.equal(r.quantity, null); assert(r.flags.includes('INVALID_QUANTITY')); assert(r.needsReview)
assert.equal(L('Cement - 50 bags').needsReview, false)
assert.equal(L('Cement 50').flags.includes('MISSING_UNIT'), true, 'quantity without unit is flagged, not guessed')

// Whole lists
const text = `Materials list:
Cement — 50 bags
Sharp Sand — 10 tonnes
Iron Rod 12mm — 40 pieces
Granite — 5 tonnes

- cement 50 bags
Roofing nails`
const out = parseMaterialText(text)
assert.equal(out.items.length, 6, 'heading skipped, blank line ignored')
assert(out.warnings.some((w) => w.code === 'HEADING_SKIPPED'))
const dup = out.items.filter((i) => i.flags.includes('DUPLICATE'))
assert.equal(dup.length, 2, 'duplicates flagged, NOT silently merged')
assert(out.warnings.some((w) => w.code === 'DUPLICATE'))
const nails = out.items.find((i) => /nails/i.test(i.name))
assert.equal(nails.quantity, null); assert(out.warnings.some((w) => w.code === 'MISSING_QUANTITY' && w.itemId === nails.id))
assert.equal(parseMaterialText('').items.length, 0)
assert(parseMaterialText('   \n\n').warnings.some((w) => w.code === 'NO_ITEMS'))
assert(parseMaterialText('----\n====').warnings.some((w) => w.code === 'NO_ITEMS'))
// AI/parsing never produces prices or stock
for (const i of out.items) for (const k of ['price', 'unitPrice', 'stock', 'available']) assert(!(k in i), `parser must not produce ${k}`)

// Service abstraction
const progress = []
const t = await extractMaterials({ kind: 'text', text: '50 bags of cement\n12mm iron rod' }, { onProgress: (p) => progress.push(p.percent) })
assert.equal(t.mode, 'demo'); assert.equal(t.items.length, 2); assert.match(t.label, /nothing was sent/i)
assert.equal(progress.at(-1), 100); assert(progress.length >= EXTRACTION_STEPS.length)
const f = await extractMaterials({ kind: 'files', files: [{ name: 'list.jpg', type: 'image/jpeg', size: 1000 }] })
assert(f.warnings.some((w) => w.code === 'DEMO_SAMPLE' && /not actually read/.test(w.message)), 'file extraction must be labelled as a demo sample')
assert(f.items.some((i) => i.needsReview), 'sample demonstrates uncertain handwriting flags')
assert(f.items.some((i) => i.flags.includes('DUPLICATE')), 'sample demonstrates duplicate detection')
const p = await extractMaterials({ kind: 'files', files: [{ name: 'l.pdf', type: 'application/pdf', size: 1 }] })
assert(p.items.length >= 5 && p.warnings[0].code === 'DEMO_SAMPLE')
await assert.rejects(extractMaterials({ kind: 'text', text: '  ' }), /Paste or type/)
await assert.rejects(extractMaterials({ kind: 'files', files: [] }), /Add at least one/)
await assert.rejects(extractMaterials({ kind: 'nope' }), /Unknown/)

console.log('Material extraction tests passed (parser formats, never-guess rules, duplicates, demo labelling, service contract).')
