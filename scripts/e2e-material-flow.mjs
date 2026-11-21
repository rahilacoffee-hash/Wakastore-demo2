// Browser-like (jsdom) journey test of the three material-list pathways -> shared review -> quotation.
// Renders the real routed app and drives it with DOM events. Not a substitute for real-device testing.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import assert from 'node:assert/strict'

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

// ---------- 1. Paste -> extract -> review -> fix flagged lines -> submit ----------
let root = await mount('/client/quotations/new')
assert.match(text(), /Get a quotation/); ok('route renders with three pathways')
for (const t of ['Upload', 'Paste', 'Type in']) assert(byText('[role=tab]', new RegExp(`^\\s*${t}`)), t)
await click(byText('[role=tab]', /^\s*Paste/))
const ta = $('#paste-list')
assert($$('button').find((b) => /Extract materials/.test(b.textContent)).disabled, 'extract disabled when empty')
await type(ta, 'Materials list:\nCement — 50 bags\nIron Rod 12mm — 40 pieces\nBinding wire - [unclear] rolls\nRoofing nails\ncement 50 bags')
await click(byText('button', /Extract materials/))
assert.match(text(), /Extracting your materials/); ok('extraction progress shown')
await waitFor(() => /Review your list/.test(text()), 8000, 'review screen')
assert.equal($$('li[aria-label^="Material "]').length, 5, 'heading skipped, 5 items'); ok('paste -> 5 editable review lines (heading skipped)')
assert.match(text(), /need your confirmation/); assert.match(text(), /appears 2 times/); ok('uncertain + duplicate warnings shown')
const submit = () => byText('button', /Send to matching merchants/)
assert(submit().disabled, 'submit blocked while flagged lines unresolved'); ok('submit blocked while lines unresolved')
// fix: nails qty, wire qty; merge duplicates; confirm
const qty = (i) => $(`[aria-label="Quantity ${i}"]`)
await type(qty(3), '4'); await type(qty(4), '3')
await click(byText('button', /Add quantities together/))
assert.equal($$('li[aria-label^="Material "]').length, 4); assert.equal($('[aria-label="Quantity 1"]').value, '100'); ok('duplicates merged on request (50+50=100), never automatically')
assert(submit().disabled, 'still blocked until global confirmation'); 
await click($('input[type=checkbox]'))
await waitFor(() => !submit().disabled, 2000, 'submit enabled')
ok('edited flagged lines auto-confirm; global confirmation required')
await type($('[aria-label="List name"]'), 'Test bungalow'); await type($('[aria-label="Delivery location"]'), 'Gwarinpa, Abuja')
await click(submit())
await waitFor(() => saved().quotations[0]?.name === 'Test bungalow', 3000, 'quotation saved')
const q = saved().quotations[0]
assert.equal(q.items.length, 4); assert.equal(q.deliveryLocation, 'Gwarinpa, Abuja'); assert.equal(q.source, 'paste')
assert(q.items.every((i) => Number(i.quantity) > 0 && i.name), 'every submitted line complete')
assert(q.items.every((i) => !('price' in i) && !('unitPrice' in i)), 'no prices invented')
ok('submitted quotation stored with complete lines, delivery location, source; no prices'); 
await waitFor(() => /QT-\d+/.test(text()), 3000, 'navigated to quotation detail'); ok('navigates to quotation detail')
await act(async () => root.unmount())

// ---------- 2. Upload pathway ----------
root = await mount('/client/quotations/new')
const fileInput = $('input[aria-label="Upload photos or PDF"]')
const mk = (name, type, size = 2048) => new dom.window.File([new Uint8Array(size)], name, { type })
async function pick(files) { await act(async () => { Object.defineProperty(fileInput, 'files', { value: files, configurable: true }); fileInput.dispatchEvent(new dom.window.Event('change', { bubbles: true })) }) }
await pick([mk('notes.gif', 'image/gif')])
assert.match(text(), /not supported/); ok('unsupported file type rejected with message')
await pick([mk('huge.jpg', 'image/jpeg', 11 * 1048576)])
assert.match(text(), /larger than 10 MB/); ok('oversize file rejected')
await pick([mk('list1.jpg', 'image/jpeg'), mk('list2.png', 'image/png'), mk('list.pdf', 'application/pdf')])
assert.equal($$('ul[aria-label="Selected files"] li').length, 3); assert.equal($$('ul[aria-label="Selected files"] img').length, 2); ok('3 files listed, 2 image previews')
await click($('button[aria-label="Remove list2.png"]'))
assert.equal($$('ul[aria-label="Selected files"] li').length, 2); ok('file removed'); 
await pick([mk('a.jpg', 'image/jpeg'), mk('b.jpg', 'image/jpeg'), mk('c.jpg', 'image/jpeg'), mk('d.jpg', 'image/jpeg'), mk('e.jpg', 'image/jpeg')])
assert.match(text(), /up to 6 files/); assert.equal($$('ul[aria-label="Selected files"] li').length, 6); ok('file cap (6) enforced')
await click($('button[aria-label="Remove a.jpg"]'))
await click(byText('button', /Extract materials with AI/))
await waitFor(() => /Review your list/.test(text()), 9000, 'upload review')
assert.match(text(), /DEMO: your 6 files were not actually read|not actually read/); ok('upload extraction clearly labelled as demo sample')
assert(submit().disabled); assert.match(text(), /Unclear|Check this/); ok('uncertain handwriting flagged; submit blocked')
await click(byText('button', /Change how I add materials/)); assert.match(text(), /Get a quotation/); ok('can go back to choose a pathway')
await act(async () => root.unmount())
const leaked = made.length; assert.equal(leaked, 0, `object URLs revoked on unmount (${leaked} leaked)`); ok('preview object URLs revoked on unmount')

// ---------- 3. Manual pathway ----------
root = await mount('/client/quotations/new?mode=manual')
assert.equal($('[role=tab][aria-selected=true]').textContent.trim().startsWith('Type in'), true); ok('?mode=manual opens manual tab')
assert($$('button').find((b) => /Review my list/.test(b.textContent)).disabled)
await click(byText('button', /^\s*Add to list/)); assert.match(text(), /Enter or choose a material/); ok('manual validation: material required')
await type($('input[aria-label="Search materials"]'), 'cement')
const sug = $$('ul[aria-label="Matching materials"] button')
assert(sug.length > 0, 'search suggestions'); await click(sug[0])
assert.equal($('input[aria-label="Material name"]').value.toLowerCase().includes('cement'), true)
await click(byText('button', /^\s*Add to list/)); assert.match(text(), /quantity above zero/); ok('manual validation: quantity required')
await type($('input[aria-label="Quantity"]'), '30'); await click(byText('button', /^\s*Add to list/))
assert.match(text(), /Your list \(1\)/); ok('search -> pick -> add item')
await click(byText('[role=group][aria-label="Category"] button', /Plumbing/)); await type($('input[aria-label="Search materials"]'), 'pipe')
assert($$('ul[aria-label="Matching materials"] li').length >= 1); ok('category filter narrows search')
await click(byText('button', /Review my list/)); await waitFor(() => /Review your list/.test(text()), 2000)
assert.equal($$('li[aria-label^="Material "]').length, 1); ok('manual -> same shared review screen')
await click(byText('button', /Add another material/)); assert.equal($$('li[aria-label^="Material "]').length, 2)
assert(submit().disabled, 'blank line blocks submit'); await click($('button[aria-label="Remove item 2"]')); ok('add/remove lines in review; blank line blocks submit')
await click($('input[type=checkbox]')); await click(submit())
await waitFor(() => saved().quotations[0]?.source === 'manual', 3000, 'manual quotation saved'); ok('manual quotation submitted')
await act(async () => root.unmount())

console.log(errors.length ? `\nConsole errors: ${errors.length}\n${errors.join('\n')}` : '\nNo React console errors.')
console.log(`${passed} checks passed`)
await vite.close(); process.exit(errors.length ? 1 : 0)
