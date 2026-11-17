// AI backend tests. Starts the REAL local server on a random port and fakes only the AI provider.
// Run: node scripts/test-ai-backend.mjs   (or npm run test:ai-backend)
import assert from 'node:assert/strict'
import { createApp } from '../server/index.js'
import { containsPrice } from '../src/services/ai/priceGuard.js'

let passed = 0
const ok = (m) => { passed += 1; console.log('ok  ', m) }

// ---- fake AI provider ----
let calls = []
let aiMode = 'good' // good | leaky | empty | down | busy
function fakeProvider(url, init) {
  const body = JSON.parse(init.body)
  calls.push(body)
  if (aiMode === 'down') return Promise.resolve(new Response('boom', { status: 500 }))
  if (aiMode === 'busy') return Promise.resolve(new Response('slow down', { status: 429 }))
  let input
  if (aiMode === 'empty') input = { items: [] }
  else if (aiMode === 'leaky') {
    // A misbehaving AI that leaks prices in every possible way.
    input = {
      document_has_prices: false,
      items: [
        { name: 'Cement @ ₦8,500', quantity: 50, unit: 'bags', specs: '', notes: 'price: 8,500 each', uncertain: false, price: 8500, unitPrice: 8500, total: 425000 },
        { name: 'Iron rod', quantity: 40, unit: 'pcs', specs: '12mm', notes: '', uncertain: false, amount: '₦260,000', currency: 'NGN' },
        { name: 'N15,000', quantity: 1, unit: '', specs: '', notes: '', uncertain: false },
        { name: 'Sharp sand', quantity: 10, unit: 'drums', specs: '', notes: '', uncertain: true, uncertain_reason: 'smudged' },
      ],
    }
  } else {
    input = {
      document_has_prices: true,
      items: [
        { name: 'Cement', quantity: 50, unit: 'bags', specs: '50kg', notes: '', uncertain: false },
        { name: 'Iron rod', quantity: 40, unit: 'pieces', specs: '12mm', notes: '', uncertain: false },
        { name: 'Binding wire', quantity: null, unit: '', specs: '', notes: '', uncertain: true, uncertain_reason: 'quantity unreadable' },
      ],
    }
  }
  return Promise.resolve(new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'submit_materials', input }] }), { status: 200, headers: { 'content-type': 'application/json' } }))
}

async function start(env) {
  const server = createApp({ env, fetchImpl: fakeProvider })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}`
  const post = (body, headers = { 'content-type': 'application/json' }, raw = false) =>
    fetch(`${base}/api/extract-materials`, { method: 'POST', headers, body: raw ? body : JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }))
  return { server, base, post, close: () => new Promise((r) => server.close(r)) }
}

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]).toString('base64')
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 2)]).toString('base64')
const PDF = Buffer.from('%PDF-1.4\n' + 'x'.repeat(200)).toString('base64')
const file = (data, type, name = 'list') => ({ name, type, data })

const everything = (r) => JSON.stringify(r.json.items) + JSON.stringify(r.json.warnings.filter((w) => w.code !== 'PRICE_REMOVED' && w.code !== 'PRICE_CHECK'))
const PRICE_DIGITS = /8,?500|425,?000|260,?000|15,?000|45,?000|₦|NGN|\bprice\b|unitPrice|\btotal\b/i
const KEYS = ['id', 'name', 'quantity', 'unit', 'specs', 'notes', 'confidence', 'flags', 'needsReview', 'source']

// ================= no API key (paste still works, uploads say so honestly) =================
{
  const s = await start({})
  const health = await fetch(`${s.base}/api/health`).then((r) => r.json())
  assert.equal(health.ok, true); assert.equal(health.aiConfigured, false); ok('health: reports AI off when no key')

  const text = `Item | Qty | Unit Price | Amount
Cement — 50 bags @ ₦8,500
Iron Rod 12mm - 40 pieces N6,500 each
Sharp sand 10 tonnes price: 45,000
Total: ₦1,200,000
VAT 7.5%
Delivery fee: 20,000`
  const r = await s.post({ kind: 'text', text })
  assert.equal(r.status, 200); assert.equal(r.json.mode, 'parser')
  assert.equal(r.json.items.length, 3, 'header, total, VAT and fee lines are not materials')
  assert.equal(r.json.warnings[0].code, 'PRICE_REMOVED', 'customer is told prices were removed, first')
  assert(!PRICE_DIGITS.test(everything(r)), 'no price survives in text without AI: ' + everything(r))
  assert(r.json.items.every((i) => Object.keys(i).every((k) => KEYS.includes(k))), 'only allowed fields')
  assert.equal(r.json.items[0].quantity, 50); assert.equal(r.json.items[0].unit, 'bags')
  ok('paste (no AI): prices, totals, VAT, fees and price-column header removed; quantities intact')

  const f = await s.post({ kind: 'files', files: [file(JPEG, 'image/jpeg')] })
  assert.equal(f.status, 503); assert.equal(f.json.code, 'AI_NOT_CONFIGURED'); ok('upload without key: honest 503, never a fake list')

  assert.equal((await s.post({ kind: 'text', text: '   ' })).status, 400); ok('empty text rejected')
  await s.close()
}

// ================= with API key =================
const KEYED = { ANTHROPIC_API_KEY: 'test-key-not-real' }
{
  const s = await start(KEYED)
  assert.equal((await fetch(`${s.base}/api/health`).then((r) => r.json())).aiConfigured, true); ok('health: reports AI on')

  // ---- paste: prices never reach the AI ----
  aiMode = 'good'; calls = []
  const pasted = 'Cement 50kg - 50 bags @ ₦8,500 = ₦425,000\nIron rod 12mm - 40 pieces N6,500 each\nSharp sand 10 tonnes price: 45,000\nTotal: ₦1,200,000'
  let r = await s.post({ kind: 'text', text: pasted })
  assert.equal(r.status, 200); assert.equal(r.json.mode, 'ai')
  const sent = JSON.stringify(calls[0].messages)
  assert(!/8,?500|425,?000|6,?500|45,?000|1,?200,?000|₦|Total/i.test(sent), 'prices must not be sent to the AI. Sent: ' + sent)
  assert(/Cement/.test(sent) && /50 bags/.test(sent), 'quantities and names ARE sent')
  assert.equal(calls[0].tool_choice.name, 'submit_materials'); assert(!JSON.stringify(calls[0].tools).match(/price/i) || /Never include prices|never/i.test(JSON.stringify(calls[0].tools)), 'schema has no price field')
  assert(!Object.keys(calls[0].tools[0].input_schema.properties.items.items.properties).some((k) => /pric|cost|amount|rate|total/i.test(k)), 'tool schema has no price property')
  assert.equal(r.json.warnings[0].code, 'PRICE_REMOVED'); ok('paste (AI): prices stripped before the AI sees the text; schema has no price field; customer told')

  // ---- paste: AI misbehaves and leaks prices ----
  aiMode = 'leaky'
  r = await s.post({ kind: 'text', text: 'Cement 50 bags\nIron rod 12mm 40 pieces\nSharp sand 10 drums' })
  assert.equal(r.status, 200); assert.equal(r.json.mode, 'ai')
  assert(!PRICE_DIGITS.test(everything(r)), 'leaked prices swept from AI answer: ' + everything(r))
  assert(r.json.items.every((i) => Object.keys(i).every((k) => KEYS.includes(k))), 'price keys (price, unitPrice, total, amount, currency) dropped')
  assert(!r.json.items.some((i) => /^N?15,?000$/.test(i.name)), 'a line that was only a price is gone')
  assert.equal(r.json.items.length, 3); assert.equal(r.json.warnings[0].code, 'PRICE_REMOVED')
  const sand = r.json.items.find((i) => /sand/i.test(i.name))
  assert.equal(sand.unit, ''); assert.match(sand.notes, /Unit written: drums/); assert(sand.needsReview, 'uncertain line flagged')
  const rod = r.json.items.find((i) => /iron/i.test(i.name)); assert.equal(rod.unit, 'pieces', 'pcs -> pieces')
  ok('AI leaks prices (names, notes, keys, price-only line): all removed; unknown unit kept in notes; uncertain flagged')

  // ---- upload: same guarantees ----
  aiMode = 'leaky'; calls = []
  r = await s.post({ kind: 'files', files: [file(JPEG, 'image/jpeg', 'quote.jpg'), file(PDF, 'application/pdf', 'quote.pdf')] })
  assert.equal(r.status, 200); assert.equal(r.json.mode, 'ai')
  assert(!PRICE_DIGITS.test(everything(r)), 'upload: leaked prices swept: ' + everything(r))
  assert(r.json.items.every((i) => Object.keys(i).every((k) => KEYS.includes(k))))
  assert.equal(r.json.warnings[0].code, 'PRICE_REMOVED')
  const blocks = calls[0].messages[0].content
  assert.equal(blocks.filter((b) => b.type === 'image').length, 1); assert.equal(blocks.filter((b) => b.type === 'document').length, 1); ok('upload (AI): image + PDF sent as proper blocks; leaked prices swept; customer told')

  aiMode = 'good'
  r = await s.post({ kind: 'files', files: [file(PNG, 'image/png')] })
  assert.equal(r.status, 200); assert.equal(r.json.warnings[0].code, 'PRICE_REMOVED', 'AI said the document had prices: customer is told even if nothing needed stripping')
  const wire = r.json.items.find((i) => /binding/i.test(i.name))
  assert.equal(wire.quantity, null); assert(wire.needsReview); assert(r.json.warnings.some((w) => w.code === 'MISSING_QUANTITY'))
  ok('upload (AI): document had prices -> customer told; unreadable quantity stays null and flagged')

  // ---- file validation ----
  s.server.resetRateLimit()
  assert.equal((await s.post({ kind: 'files', files: [file(JPEG, 'image/png')] })).json.code, 'FILE_TYPE_MISMATCH'); ok('declared type must match the real file')
  assert.equal((await s.post({ kind: 'files', files: [file(Buffer.from('hello world, not an image').toString('base64'), 'image/jpeg')] })).json.code, 'UNSUPPORTED_FILE'); ok('garbage bytes rejected')
  assert.equal((await s.post({ kind: 'files', files: [] })).json.code, 'NO_FILES'); ok('no files rejected')
  assert.equal((await s.post({ kind: 'files', files: Array(7).fill(file(JPEG, 'image/jpeg')) })).json.code, 'TOO_MANY_FILES'); ok('more than 6 files rejected')
  s.server.resetRateLimit()
  const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(10 * 1048576 + 10)]).toString('base64')
  const tooBig = await s.post({ kind: 'files', files: [file(big, 'image/jpeg')] })
  assert.equal(tooBig.status, 413); ok('oversize payload rejected with 413 (never reaches the AI)')
  assert.equal((await s.post({ kind: 'text', text: 'x'.repeat(20001) })).status, 413); ok('overlong text rejected')
  assert.equal((await s.post('{not json', { 'content-type': 'application/json' }, true)).json.code, 'BAD_JSON'); ok('bad JSON rejected')
  assert.equal((await s.post('hi', { 'content-type': 'text/plain' }, true)).status, 415); ok('wrong content-type rejected')
  assert.equal((await fetch(`${s.base}/api/extract-materials`)).status, 405); ok('GET rejected (405)')

  // ---- AI failures ----
  s.server.resetRateLimit()
  aiMode = 'down'
  r = await s.post({ kind: 'text', text: 'Cement 50 bags @ ₦8,500\nIron rod 12mm 40 pieces' })
  assert.equal(r.status, 200); assert.equal(r.json.mode, 'parser'); assert(r.json.warnings.some((w) => w.code === 'AI_FALLBACK'))
  assert.equal(r.json.warnings[0].code, 'PRICE_REMOVED'); assert(!PRICE_DIGITS.test(everything(r)))
  ok('AI down: paste falls back to the list reader, still price-free, customer told')
  r = await s.post({ kind: 'files', files: [file(JPEG, 'image/jpeg')] })
  assert.equal(r.status, 502); assert.equal(r.json.code, 'AI_FAILED'); ok('AI down: upload gets an honest error, never a fake list')
  aiMode = 'busy'
  r = await s.post({ kind: 'files', files: [file(JPEG, 'image/jpeg')] })
  assert.equal(r.status, 503); assert.equal(r.json.code, 'AI_BUSY'); ok('AI rate-limited: friendly "busy" message')
  aiMode = 'empty'
  r = await s.post({ kind: 'text', text: 'Cement 50 bags\nSand 10 tonnes' })
  assert.equal(r.json.mode, 'parser'); assert.equal(r.json.items.length, 2); ok('AI finds nothing in text: list reader is the backup')

  // ---- rate limit ----
  s.server.resetRateLimit()
  aiMode = 'good'
  let last
  for (let i = 0; i < 13; i++) last = await s.post({ kind: 'text', text: 'Cement 50 bags' })
  assert.equal(last.status, 429); ok('rate limit: 13th request in a minute gets 429')
  await s.close()
}

// ================= oversized body (separate server so the rate limit is fresh) =================
{
  const s = await start(KEYED)
  s.server.resetRateLimit()
  const huge = JSON.stringify({ kind: 'text', text: 'a'.repeat(5_000_000) })
  const r = await fetch(`${s.base}/api/extract-materials`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: huge }).then(async (x) => ({ status: x.status, json: await x.json() })).catch((e) => ({ status: 'reset', json: { code: String(e.cause?.code || e.message) } }))
  assert(r.status === 413 || r.status === 'reset', `huge body refused (got ${r.status})`)
  ok('request body over ~4.4 MB refused before parsing')
  await s.close()
}

// the guard itself must never flag clean material lines
for (const clean of ['Cement 50kg - 50 bags', 'Iron rod 12mm - 40 pieces', 'Blocks 9 inch - 1,500 pieces', 'PVC pipe 4in - 20 lengths']) assert(!containsPrice(clean), clean)
ok('clean material lines are never mistaken for prices')

console.log(`\nAI backend tests passed (${passed} checks).`)
