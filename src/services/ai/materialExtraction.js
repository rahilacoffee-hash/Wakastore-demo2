// AI material-extraction SERVICE.
//
//   extractMaterials({ kind: 'text', text })   -> Promise<ExtractionResult>
//   extractMaterials({ kind: 'files', files }) -> Promise<ExtractionResult>
//     files: [{ name, type, size, data }]  (data = base64, no "data:" prefix)
//
// ExtractionResult = { items: [{ id, name, quantity|null, unit, specs, notes,
//   confidence, flags[], needsReview }], warnings: [{ code, message, itemId? }],
//   mode: 'ai' | 'parser' | 'demo', label: string, durationMs }
//
// How it works:
//   1. The WakaStore AI backend (server/, POST /api/extract-materials) is tried first.
//      The API key lives ONLY on that server, never in the browser.
//        - mode 'ai'     : an AI model read the text / photos / PDF.
//        - mode 'parser' : the server's list reader parsed pasted text (AI off or down).
//   2. If the backend is not reachable or the AI is not switched on, the old demo
//      behaviour is used so the prototype still runs, and it is clearly labelled:
//        - pasted text is parsed in this browser (nothing is sent anywhere);
//        - uploaded files are NOT read: a labelled sample list is returned.
//
// RULES (enforced here AND on the server): AI only extracts and organises. Never
// prices (anything price-like is removed and the customer is told), never stock,
// never guessing unclear handwriting.

import { parseMaterialText } from './materialParser.js'
import { sanitizeExtraction } from './priceGuard.js'

export const EXTRACTION_STEPS = [
  'Reading your document',
  'Recognising material names',
  'Extracting quantities and units',
  'Normalising and checking for duplicates',
  'Flagging anything uncertain',
]

const API_BASE = import.meta.env?.VITE_API_BASE || ''
const REQUEST_TIMEOUT_MS = 70_000
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- 1. real backend ----------
// Resolves { data } on success, { unavailable: true } when the backend / AI is not there
// (caller falls back to the demo), and THROWS an Error with a customer-friendly message
// for real problems (too large, rate limited, AI failed...).
async function callBackend(payload, onProgress) {
  if (typeof fetch !== 'function') return { unavailable: true }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  let step = 0
  const tick = () => onProgress?.({ step, steps: EXTRACTION_STEPS, percent: Math.round((step / EXTRACTION_STEPS.length) * 100), mode: 'ai' })
  tick()
  const ticker = setInterval(() => { if (step < EXTRACTION_STEPS.length - 1) { step += 1; tick() } }, 2200)
  try {
    let res
    try {
      res = await fetch(`${API_BASE}/api/extract-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
    } catch (e) {
      if (e?.name === 'AbortError') throw new Error('The AI took too long. Try fewer or smaller files, or try again.')
      return { unavailable: true } // offline / no backend / invalid URL (tests)
    }
    if (!String(res.headers.get('content-type') || '').includes('application/json')) return { unavailable: true } // e.g. a dev server answering with index.html
    let data
    try { data = await res.json() } catch { return { unavailable: true } }
    if (res.ok && data?.ok) return { data }
    if (data?.code === 'AI_NOT_CONFIGURED' || data?.code === 'BACKEND_OFFLINE') return { unavailable: true }
    throw new Error(data?.message || 'Extraction failed. Please try again.')
  } finally {
    clearInterval(ticker)
    clearTimeout(timer)
  }
}

function fromBackend(data, t0, onProgress) {
  onProgress?.({ step: EXTRACTION_STEPS.length, steps: EXTRACTION_STEPS, percent: 100, mode: 'ai' })
  // Defence in depth: whatever the network returned is price-swept once more.
  const safe = sanitizeExtraction({ items: data.items || [], warnings: data.warnings || [] })
  return {
    items: safe.items.map((i, n) => ({ ...i, id: i.id || `ai-${Date.now().toString(36)}-${n}` })),
    warnings: safe.warnings,
    mode: data.mode === 'ai' ? 'ai' : 'parser',
    label: data.label || '',
    durationMs: Date.now() - t0,
  }
}

// ---------- 2. demo / offline fallback (the original behaviour) ----------
// Sample output for a photographed handwritten list. Unclear entries are
// deliberately included and flagged, to demonstrate the confirm-before-use rule.
const SAMPLE_HANDWRITTEN = [
  'Cement - 50 bags',
  'Sharp sand - 10 tonnes',
  'Iron rod 12mm - 4? pieces',
  'Granite 3/4 - 5 tonnes',
  'Binding wire - [unclear] rolls',
  'Roofing nails',
  'Cement 50 bags',
]
const SAMPLE_PDF = [
  'Cement 50kg - 80 bags',
  'Iron rod 12mm - 120 pieces',
  'Iron rod 16mm - 60 pieces',
  'Blocks 9 inch - 1,500 pieces',
  'Tile adhesive 25kg - 30 bags',
  'PVC pipe 4in - 20 lengths',
]

const demoProvider = {
  id: 'demo',
  async extractText({ text, onProgress }) {
    const t0 = Date.now()
    await runSteps(onProgress, 350)
    const { items, warnings } = parseMaterialText(text)
    return {
      items, warnings, mode: 'demo', durationMs: Date.now() - t0,
      label: 'AI extraction demo. Your pasted text was parsed in this browser; nothing was sent anywhere.',
    }
  },
  async extractFiles({ files, onProgress }) {
    const t0 = Date.now()
    await runSteps(onProgress, 550)
    const hasPdfOnly = files.length > 0 && files.every((f) => f.type === 'application/pdf')
    const sample = hasPdfOnly ? SAMPLE_PDF : SAMPLE_HANDWRITTEN
    const { items, warnings } = parseMaterialText(sample.join('\n'))
    items.forEach((i) => { i.source = 'demo-sample' })
    warnings.unshift({
      code: 'DEMO_SAMPLE',
      message: `DEMO: your ${files.length === 1 ? 'file was' : `${files.length} files were`} not actually read. This is a sample list showing how extraction and review work. Replace it with your real materials.`,
    })
    return {
      items, warnings, mode: 'demo', durationMs: Date.now() - t0,
      label: 'DEMO extraction: sample output, not read from your files.',
    }
  },
}

async function runSteps(onProgress, perStep) {
  for (let i = 0; i < EXTRACTION_STEPS.length; i++) {
    onProgress?.({ step: i, steps: EXTRACTION_STEPS, percent: Math.round((i / EXTRACTION_STEPS.length) * 100) })
    await wait(perStep)
  }
  onProgress?.({ step: EXTRACTION_STEPS.length, steps: EXTRACTION_STEPS, percent: 100 })
}

export const getExtractionProvider = () => 'backend-with-demo-fallback'

export async function extractMaterials(input, { onProgress } = {}) {
  const t0 = Date.now()
  if (input.kind === 'text') {
    if (!String(input.text || '').trim()) throw new Error('Paste or type a materials list first.')
    const live = await callBackend({ kind: 'text', text: String(input.text) }, onProgress)
    if (live.data) return fromBackend(live.data, t0, onProgress)
    return demoProvider.extractText({ text: input.text, onProgress })
  }
  if (input.kind === 'files') {
    if (!input.files?.length) throw new Error('Add at least one photo or PDF first.')
    // Only files that carry their content can be sent to the AI.
    if (input.files.every((f) => typeof f.data === 'string' && f.data)) {
      const live = await callBackend({ kind: 'files', files: input.files.map(({ name, type, data }) => ({ name, type, data })) }, onProgress)
      if (live.data) return fromBackend(live.data, t0, onProgress)
    }
    return demoProvider.extractFiles({ files: input.files, onProgress })
  }
  throw new Error('Unknown extraction input.')
}
