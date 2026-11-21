// Price omission, end to end: real UI (jsdom) -> real local AI backend (fake AI provider) -> review -> saved quotation.
// Proves that prices in a pasted list or an uploaded document never reach a quotation.
// Not a substitute for real-device testing.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import assert from 'node:assert/strict'
import { createApp } from '../server/index.js'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
const g = globalThis
const def = (k, v) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true })
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent', 'File', 'FileReader', 'DataTransfer', 'localStorage', 'sessionStorage', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'MutationObserver', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'SVGElement', 'Element']) def(k, dom.window[k])
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
dom.window.scrollTo = () => {}; dom.window.HTMLElement.prototype.scrollIntoView = () => {}
let n = 0; const made = []
globalThis.URL.createObjectURL = () => { const u = `blob:test/${++n}`; made.push(u); return u }
globalThis.URL.revokeObjectURL = (u) => { const i = made.indexOf(u); if (i >= 0) made.splice(i, 1) }
g.IS_REACT_ACT_ENVIRONMENT = true
g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
const errors = []
const origErr = console.error
console.error = (...a) => { const m = String(a[0]); if (!/not wrapped in act|Warning: ReactDOM.render/.test(m)) errors.push(m.slice(0, 200)); origErr.apply(console, a) }

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const React = (await import('react')).default
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { MemoryRouter } = await import('react-router-dom')
const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx')
const { defaultState } = await vite.ssrLoadModule('/src/context/AppStateContext.jsx')
const KEY = 'waka-demo-v2'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const byText = (sel, re) => $$(sel).find((e) => re.test(e.textContent))
const text = () => document.body.textContent
async function click(el) { assert(el, 'element to click not found'); await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })) }) }
async function type(el, value) {
  assert(el, 'input not found')
  const proto = el.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new dom.window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })) })
}
async function waitFor(fn, ms = 6000, what = 'condition') { const t = Date.now(); while (Date.now() - t < ms) { if (await act(async () => fn())) return; await act(async () => { await sleep(80) }) } throw new Error('Timed out waiting for ' + what + '\n' + text().slice(0, 400)) }

async function mount(path) {
  localStorage.clear()
  localStorage.setItem(KEY, JSON.stringify({ ...defaultState, session: { role: 'customer', name: 'Ada Okafor', email: 'ada@example.test' } }))
  document.body.innerHTML = '<div id="root"></div>'
  const root = createRoot($('#root'))
  await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App))) })
  return root
}
const saved = () => JSON.parse(localStorage.getItem(KEY))
let passed = 0
const ok = (m) => { passed++; console.log('ok  ', m) }


// ---------- fake AI provider behind the REAL backend ----------
let aiMode = 'leaky' // leaky | clean | down
let providerCalls = []
function fakeProvider(url, init) {
  providerCalls.push(JSON.parse(init.body))
  if (aiMode === 'down') return Promise.resolve(new Response('boom', { status: 500 }))
  const input = aiMode === 'clean' ? {
    document_has_prices: false,
    items: [
      { name: 'Cement', quantity: 50, unit: 'bags', specs: '', notes: '', uncertain: false },
      { name: 'Sharp sand', quantity: 10, unit: 'tonnes', specs: '', notes: '', uncertain: false },
    ],
  } : {
    document_has_prices: true,
    items: [
      { name: 'Cement @ ₦8,500', quantity: 50, unit: 'bags', specs: '50kg', notes: 'price: 8,500 each', uncertain: false, price: 8500, total: 425000 },
      { name: 'Iron rod', quantity: 40, unit: 'pieces', specs: '12mm', notes: '', uncertain: false, amount: '₦260,000' },
      { name: 'N15,000', quantity: 1, unit: '', specs: '', notes: '', uncertain: false },
      { name: 'Sharp sand', quantity: 10, unit: 'tonnes', specs: '', notes: 'N45,000 per tonne', uncertain: false },
    ],
  }
  return Promise.resolve(new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'submit_materials', input }] }), { status: 200, headers: { 'content-type': 'application/json' } }))
}
const backend = createApp({ env: { ANTHROPIC_API_KEY: 'test-key-not-real' }, fetchImpl: fakeProvider })
await new Promise((r) => backend.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${backend.address().port}`
const realFetch = globalThis.fetch
let backendOnline = true
globalThis.fetch = (url, init) => {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    if (!backendOnline) return Promise.reject(new TypeError('fetch failed'))
    return realFetch(base + url, init)
  }
  return realFetch(url, init)
}

const PRICE = /₦|\bNGN\b|\bN\s?\d|8,?500|6,?500|425,?000|260,?000|15,?000|45,?000|\bprice\b/i
const submit = () => byText('button', /Send to matching merchants/)
const fieldValues = () => $$('li[aria-label^="Material "] input').map((i) => i.value).join(' | ')
const visibleLines = () => $$('li[aria-label^="Material "]').length
async function finish(name, source) {
  await click($('input[type=checkbox]'))
  await type($('[aria-label="List name"]'), name); await type($('[aria-label="Delivery location"]'), 'Gwarinpa, Abuja')
  await waitFor(() => !submit().disabled, 3000, 'submit enabled')
  await click(submit())
  await waitFor(() => saved().quotations[0]?.name === name, 3000, 'quotation saved')
  const q = saved().quotations[0]
  assert.equal(q.source, source)
  const dump = JSON.stringify(q.items)
  assert(!PRICE.test(dump), `saved quotation must carry no price: ${dump}`)
  assert(q.items.every((i) => Object.keys(i).every((k) => !/pric|cost|amount|total|rate/i.test(k))), 'no price-like keys on saved lines')
  return q
}

// ---------- A. PASTE a priced supplier quotation (backend: AI) ----------
let root = await mount('/client/quotations/new')
await click(byText('[role=tab]', /^\s*Paste/))
await type($('#paste-list'), `QUOTATION
Item | Qty | Unit Price | Amount
Cement 50kg - 50 bags @ ₦8,500 = ₦425,000
Iron rod 12mm - 40 pieces N6,500 each
Sharp sand 10 tonnes price: 45,000
Total: ₦1,200,000
VAT 7.5%`)
providerCalls = []
await click(byText('button', /Extract materials/))
await waitFor(() => /Review your list/.test(text()), 10000, 'paste review (AI)')
assert.equal(providerCalls.length, 1); assert(!/₦|8,?500|6,?500|45,?000|1,?200,?000|VAT|Total/i.test(JSON.stringify(providerCalls[0].messages)), 'prices never sent to the AI')
ok('A1 paste: prices are removed BEFORE the text reaches the AI provider')
assert.equal(visibleLines(), 3, `leaked price-only line is gone: ${fieldValues()}`)
assert(!PRICE.test(fieldValues()), `no price in any field: ${fieldValues()}`); ok('A2 paste: review lines show no prices even though the AI leaked them')
assert.match(text(), /Prices in your list were removed/); ok('A3 paste: customer is told prices were removed')
assert.match(text(), /Read by WakaStore AI/); ok('A4 paste: labelled as read by the AI (not the demo)')
const nameBox = $('[aria-label="Material name 1"]'); assert.equal(nameBox.value, 'Cement'); assert.equal($('[aria-label="Quantity 1"]').value, '50'); assert.equal($('[aria-label="Unit 1"]').value, 'bags'); assert.equal($('[aria-label="Specification 1"]').value, '50kg'); ok('A5 paste: name, quantity, unit and spec are intact')
let q = await finish('Priced paste', 'paste'); assert.equal(q.items.length, 3); ok('A6 paste: saved quotation carries no price')
await act(async () => root.unmount())

// ---------- B. UPLOAD a priced document (backend: AI, which leaks prices) ----------
root = await mount('/client/quotations/new')
const fileInput = $('input[aria-label="Upload photos or PDF"]')
const jpeg = (name) => new dom.window.File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(300).fill(7)])], name, { type: 'image/jpeg' })
await act(async () => { Object.defineProperty(fileInput, 'files', { value: [jpeg('quote.jpg')], configurable: true }); fileInput.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
providerCalls = []
await click(byText('button', /Extract materials with AI/))
await waitFor(() => /Review your list/.test(text()), 10000, 'upload review (AI)')
assert.equal(providerCalls.length, 1); assert(providerCalls[0].messages[0].content.some((b) => b.type === 'image' && b.source.data), 'the photo itself is sent to the AI'); ok('B1 upload: the photo is really sent to the AI reader')
assert.equal(visibleLines(), 3); assert(!PRICE.test(fieldValues()), `no price in any field: ${fieldValues()}`); ok('B2 upload: AI leaked prices in names, notes, extra keys and a price-only line; none reach review')
assert.match(text(), /Prices in your list were removed/); assert.match(text(), /Read by WakaStore AI from your file/); ok('B3 upload: customer told; labelled as AI-read (not the demo sample)')
assert(!/not actually read/.test(text()), 'real AI result is not labelled as a demo sample'); ok('B4 upload: not mislabelled as a demo sample')
q = await finish('Priced upload', 'upload'); assert.equal(q.items.length, 3); ok('B5 upload: saved quotation carries no price')
await act(async () => root.unmount())

// ---------- C. typing a price while reviewing a paste/upload list ----------
aiMode = 'clean'
root = await mount('/client/quotations/new')
await click(byText('[role=tab]', /^\s*Paste/))
await type($('#paste-list'), 'Cement 50 bags\nSharp sand 10 tonnes')
await click(byText('button', /Extract materials/))
await waitFor(() => /Review your list/.test(text()), 10000, 'review')
assert.doesNotMatch(text(), /Prices in your list were removed/, 'no price notice when nothing was removed'); ok('C1 clean list: no price notice shown')
await type($('[aria-label="Notes 1"]'), 'Dangote only ₦8,500 each')
assert(!PRICE.test($('[aria-label="Notes 1"]').value), `price typed in notes is removed: "${$('[aria-label="Notes 1"]').value}"`)
assert.match($('[aria-label="Notes 1"]').value, /Dangote only/); assert.match(text(), /Prices cannot be added to a request/); ok('C2 a price typed into a line is removed on the spot, the rest of the note stays, customer told')
await type($('[aria-label="Material name 2"]'), 'Sharp sand @ 45,000'); assert.equal($('[aria-label="Material name 2"]').value.trim(), 'Sharp sand'); ok('C3 same for the material name')
q = await finish('Typed price', 'paste'); ok('C4 saved quotation still price-free')
await act(async () => root.unmount())

// ---------- D. backend offline: paste still strips prices (browser reader) ----------
backendOnline = false
root = await mount('/client/quotations/new')
await click(byText('[role=tab]', /^\s*Paste/))
await type($('#paste-list'), 'Cement - 50 bags @ ₦8,500\nIron rod 12mm - 40 pieces N6,500 each\nTotal: ₦700,000')
await click(byText('button', /Extract materials/))
await waitFor(() => /Review your list/.test(text()), 10000, 'review offline')
assert.equal(visibleLines(), 2); assert(!PRICE.test(fieldValues())); assert.match(text(), /Prices in your list were removed/); assert.match(text(), /nothing was sent anywhere/i); ok('D1 backend offline: paste falls back to the in-browser reader, prices still removed, labelled honestly')
await act(async () => root.unmount())

// ---------- E. backend online but AI fails on an upload: honest error, no fake list ----------
backendOnline = true; aiMode = 'down'
root = await mount('/client/quotations/new')
const fi2 = $('input[aria-label="Upload photos or PDF"]')
await act(async () => { Object.defineProperty(fi2, 'files', { value: [jpeg('quote.jpg')], configurable: true }); fi2.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
await click(byText('button', /Extract materials with AI/))
await waitFor(() => /couldn.t read this right now/.test(text()), 10000, 'AI failure message')
assert.doesNotMatch(text(), /Review your list/); assert(byText('button', /Extract materials with AI/), 'can try again'); ok('E1 AI failure on upload: clear message, stays on upload, no fake sample list')
await act(async () => root.unmount())

console.log(errors.length ? `\nConsole errors: ${errors.length}\n${errors.join('\n')}` : '\nNo React console errors.')
console.log(`${passed} checks passed`)
backend.close(); await vite.close(); process.exit(errors.length ? 1 : 0)
