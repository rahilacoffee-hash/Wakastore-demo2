// Extraction core: validates the request, keeps prices away from the AI,
// calls the AI, and guarantees the answer carries no prices.
// No HTTP in here (see http.js), so it is easy to test.
//
//   text   -> prices are stripped BEFORE the text is sent to the AI; AI result is
//             built with the same rules as the browser parser; the browser parser
//             is the fallback if the AI is off, down, or finds nothing.
//   files  -> the AI is told never to output prices; whatever it returns is swept
//             again here. No AI key / AI down => honest error (never a fake list).

import { buildAiResult } from '../src/services/ai/aiItems.js'
import { parseMaterialText } from '../src/services/ai/materialParser.js'
import { redactTextPrices, sanitizeExtraction } from '../src/services/ai/priceGuard.js'
import { DEFAULT_MODEL, ProviderError, callModel } from './anthropic.js'

export const LIMITS = {
  maxTextChars: 20_000,
  maxFiles: 6,
  maxFileBytes: 10 * 1048576,
  maxBodyBytes: 4_400_000, // Vercel functions accept ~4.5 MB request bodies
}

const fail = (status, code, message) => ({ status, body: { ok: false, code, message } })
const KIND_LABEL = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WEBP', 'application/pdf': 'PDF' }

// What the bytes really are (never trust the declared type alone).
export function sniffType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp'
  if (buf.toString('latin1', 0, Math.min(buf.length, 1024)).includes('%PDF-')) return 'application/pdf'
  return null
}

function readFiles(files) {
  if (!Array.isArray(files) || !files.length) return { error: fail(400, 'NO_FILES', 'Add at least one photo or PDF first.') }
  if (files.length > LIMITS.maxFiles) return { error: fail(400, 'TOO_MANY_FILES', `You can send up to ${LIMITS.maxFiles} files.`) }
  const out = []
  for (const f of files) {
    const label = String(f?.name || 'file').slice(0, 80)
    if (typeof f?.data !== 'string' || !f.data) return { error: fail(400, 'BAD_FILE', `"${label}" could not be read. Please add it again.`) }
    const buf = Buffer.from(f.data, 'base64')
    if (!buf.length || Math.abs((buf.length * 4) / 3 - f.data.length) > 8) return { error: fail(400, 'BAD_FILE', `"${label}" is damaged. Please add it again.`) }
    if (buf.length > LIMITS.maxFileBytes) return { error: fail(413, 'FILE_TOO_LARGE', `"${label}" is larger than ${LIMITS.maxFileBytes / 1048576} MB.`) }
    const real = sniffType(buf)
    if (!real) return { error: fail(400, 'UNSUPPORTED_FILE', `"${label}" is not a supported file. Use JPG, PNG, WEBP or PDF.`) }
    if (f.type && f.type !== real) return { error: fail(400, 'FILE_TYPE_MISMATCH', `"${label}" is not really a ${KIND_LABEL[f.type] || 'supported'} file.`) }
    out.push({ type: real, data: f.data })
  }
  return { files: out }
}

const fileBlock = (f) =>
  f.type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } }
    : { type: 'image', source: { type: 'base64', media_type: f.type, data: f.data } }

const providerFailure = (e) =>
  e instanceof ProviderError && e.kind === 'busy'
    ? fail(503, 'AI_BUSY', 'The AI service is busy right now. Please try again in a minute.')
    : e instanceof ProviderError && e.kind === 'timeout'
      ? fail(504, 'AI_TIMEOUT', 'The AI service took too long. Try fewer or smaller files, or try again.')
      : fail(502, 'AI_FAILED', "The AI service couldn't read this right now. Please try again, or use Paste or Type in.")

export async function runExtraction(body, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const t0 = Date.now()
  const apiKey = String(env.ANTHROPIC_API_KEY || '').trim()
  const model = String(env.ANTHROPIC_MODEL || '').trim() || DEFAULT_MODEL
  const ask = (content) => callModel({ apiKey, model, content, fetchImpl })
  const done = (result, mode, label) => {
    const safe = sanitizeExtraction(result) // last price sweep, whatever happened above
    return { status: 200, body: { ok: true, mode, label, items: safe.items, warnings: safe.warnings, durationMs: Date.now() - t0 } }
  }

  if (!body || typeof body !== 'object') return fail(400, 'BAD_REQUEST', 'Send a JSON body.')

  // ---------------- pasted text ----------------
  if (body.kind === 'text') {
    const text = String(body.text ?? '').trim()
    if (!text) return fail(400, 'EMPTY', 'Paste or type a materials list first.')
    if (text.length > LIMITS.maxTextChars) return fail(413, 'TEXT_TOO_LONG', `That list is too long. Send up to ${LIMITS.maxTextChars.toLocaleString('en')} characters at a time.`)

    const parsed = () => parseMaterialText(text) // strips prices itself
    if (apiKey) {
      const redacted = redactTextPrices(text) // the AI never sees the prices
      if (redacted.text.trim()) {
        try {
          const ai = await ask([{ type: 'text', text: `Customer's pasted materials list:\n\n${redacted.text}` }])
          const result = buildAiResult(ai, { documentHadPrices: redacted.touched > 0 || ai.document_has_prices === true })
          if (result.items.length) return done(result, 'ai', 'Read by WakaStore AI. Please check every line. Prices are never used.')
          const backup = parsed()
          if (backup.items.length) return done(backup, 'parser', 'Read by the WakaStore list reader. Please check every line. Prices are never used.')
          return done(result, 'ai', 'Read by WakaStore AI. Please check every line. Prices are never used.')
        } catch (e) {
          if (!(e instanceof ProviderError)) throw e
          const backup = parsed()
          const priceWarn = backup.warnings.filter((w) => w.code === 'PRICE_REMOVED')
          const rest = backup.warnings.filter((w) => w.code !== 'PRICE_REMOVED')
          const warnings = [...priceWarn, { code: 'AI_FALLBACK', message: 'The AI service was unavailable, so a simpler reader was used. Please check every line.' }, ...rest]
          return done({ ...backup, warnings }, 'parser', 'Read by the WakaStore list reader. Please check every line. Prices are never used.')
        }
      }
    }
    const backup = parsed()
    return done(backup, 'parser', 'Read by the WakaStore list reader. Please check every line. Prices are never used.')
  }

  // ---------------- uploaded photos / PDFs ----------------
  if (body.kind === 'files') {
    const read = readFiles(body.files)
    if (read.error) return read.error
    if (!apiKey) return fail(503, 'AI_NOT_CONFIGURED', 'The AI reader is not switched on for this site yet.')
    try {
      const ai = await ask([
        ...read.files.map(fileBlock),
        { type: 'text', text: 'Extract the materials from the attached document(s). Never include prices.' },
      ])
      const result = buildAiResult(ai, { documentHadPrices: ai.document_has_prices === true })
      return done(result, 'ai', 'Read by WakaStore AI from your file. Please check every line, especially anything marked unclear. Prices are never used.')
    } catch (e) {
      if (!(e instanceof ProviderError)) throw e
      return providerFailure(e)
    }
  }

  return fail(400, 'BAD_REQUEST', 'Unknown request. Use kind "text" or "files".')
}

