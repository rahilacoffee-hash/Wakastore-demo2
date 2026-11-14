// AI material-extraction SERVICE ABSTRACTION (frontend-only prototype).
//
//   extractMaterials({ kind: 'text', text })  -> Promise<ExtractionResult>
//   extractMaterials({ kind: 'files', files }) -> Promise<ExtractionResult>
//
// ExtractionResult = { items: [{ id, name, quantity|null, unit, specs, notes,
//   confidence, flags[], needsReview }], warnings: [{ code, message, itemId? }],
//   mode: 'demo', label: string, durationMs }
//
// This build ships ONLY the demo provider below: no AI service is called, no
// key exists in the browser, and nothing leaves the device.
//   - Pasted text is genuinely parsed in the browser by materialParser.js.
//   - Uploaded photos/PDFs are NOT read. The demo returns a clearly labelled
//     sample list so reviewers can experience the review flow.
//
// FUTURE INTEGRATION POINT: to use real AI later (e.g. Groq via a server you
// control, because an API key must never be placed in browser code), add a
// provider with the same two functions that calls your server endpoint and
// returns the same ExtractionResult shape, then register it in `providers`
// below. No UI change is needed. AI must only extract and organise: never
// prices, never stock, never guessing unclear handwriting.

import { parseMaterialText } from './materialParser.js'

export const EXTRACTION_STEPS = [
  'Reading your document',
  'Recognising material names',
  'Extracting quantities and units',
  'Normalising and checking for duplicates',
  'Flagging anything uncertain',
]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

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

const providers = { demo: demoProvider }
let active = providers.demo

export const getExtractionProvider = () => active.id

export async function extractMaterials(input, { onProgress } = {}) {
  if (input.kind === 'text') {
    if (!String(input.text || '').trim()) throw new Error('Paste or type a materials list first.')
    return active.extractText({ text: input.text, onProgress })
  }
  if (input.kind === 'files') {
    if (!input.files?.length) throw new Error('Add at least one photo or PDF first.')
    return active.extractFiles({ files: input.files, onProgress })
  }
  throw new Error('Unknown extraction input.')
}
