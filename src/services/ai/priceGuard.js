// PRICE GUARD (pure functions, no React, no network, no Node-only APIs).
//
// RULE: a customer's materials request never carries prices. Merchants quote
// their own prices. If an uploaded document or pasted text includes prices
// (unit price, amount, total, "@ N8,500", a price column in a table...), they
// are removed before they can reach the review screen, the quotation or any
// merchant.
//
// The same module runs in the browser (paste, review editing, final guard) and
// on the server (before text goes to the AI, and on whatever the AI returns),
// so the rule cannot drift between upload and paste.
//
// Philosophy: remove what is clearly a price silently-but-visibly (the customer
// is told), and when something only MIGHT be a price, never delete a quantity:
// flag the line for the customer to check instead.

const UNITS =
  'bags?|pcs?|pieces?|nos?|units?|lengths?|lgths?|metres?|meters?|rm|rolls?|boxes|box|cartons?|ctns?|sheets?|tonnes?|tons?|trips?|litres?|liters?|ltrs?|buckets?|bundles?|packs?|packets?|sets?'
// Units a price can be quoted "per" (adds weights / lengths on top of the order units).
const PER_UNITS = `${UNITS}|kg|g|m|ft|cm|mm|l|lt|ltr|yard|yd|sqm|m2|m²|truck|trailer`

const AMT = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?`
const AMT_BIG = String.raw`(?:\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?`
const MAG_CUR = String.raw`(?:\s?(?:k|m|mn|million|thousand|naira|ngn)(?![A-Za-z]))?`
const MAG_PLAIN = String.raw`(?:\s?(?:k|naira|ngn)(?![A-Za-z]))?`
const SYM = String.raw`(?:₦|NGN|USD|GBP|EUR|\$|£|€)`
const TAIL = String.raw`(?:\s*(?:\/|per\s+)\s*(?:${PER_UNITS})\b|\s+(?:each|ea|only)\b)?`
const NOT_SPEC = String.raw`(?!\s?(?:mm|cm|kg|in|inch|inches|l|ltrs?|x)\b)(?!\s?(?:${UNITS})\b)`
const NOT_UNIT = String.raw`(?!\s*(?:${UNITS})\b)(?!\s?(?:mm|cm|kg|in|inch|inches|l|ltrs?)\b)`

const PRICE_PATTERNS = [
  // "@ ₦8,500", "at N8,500 per bag"
  new RegExp(String.raw`(?:@|\bat\b)\s*(?:${SYM}|(?<![A-Za-z0-9])N(?![A-Za-z])|#)\s?${AMT}${MAG_CUR}${TAIL}(?!\d)`, 'gi'),
  // ₦8,500  NGN 8500  $20  £5  €5
  new RegExp(String.raw`(?<![A-Za-z0-9])${SYM}\s?${AMT}${MAG_CUR}${TAIL}(?!\d)`, 'gi'),
  // N8,500  N 8500  (never "N12mm" or "N 50 bags")
  new RegExp(String.raw`(?<![A-Za-z0-9])N(?![A-Za-z])\s?${AMT}${MAG_CUR}(?!\d)${NOT_SPEC}${TAIL}`, 'gi'),
  // #8,500  #12000  (naira written with a hash; "#1" or "#12" are list numbers, not prices)
  new RegExp(String.raw`(?<![A-Za-z0-9&])#\s?${AMT_BIG}${MAG_CUR}(?!\d)${NOT_SPEC}${TAIL}`, 'gi'),
  // 8,500 naira   8500 ngn   8500₦
  new RegExp(String.raw`(?<![\w.])${AMT}\s?k?\s?(?:naira|ngn|kobo|₦)(?![A-Za-z])${TAIL}`, 'gi'),
  // price: 8,500   unit price - 8500   rate 12,000   total: 425,000
  new RegExp(String.raw`\b(?:unit\s*price|price|rate|cost|amount|amt|sub-?total|total|value|worth)\b\s*[:=\-–]?\s*(?:${SYM}|(?<![A-Za-z0-9])N(?![A-Za-z])|#)?\s?${AMT}${MAG_PLAIN}${TAIL}(?!\d)${NOT_UNIT}`, 'gi'),
  // @ 8500   @8,500/bag   (but not "@ 50 bags")
  new RegExp(String.raw`@\s*${AMT}${MAG_PLAIN}${TAIL}(?!\d)${NOT_UNIT}`, 'gi'),
  // at 8,500   at 12000 each   (4+ digits or thousands separators only)
  new RegExp(String.raw`\bat\s+${AMT_BIG}${MAG_PLAIN}${TAIL}(?!\d)`, 'gi'),
  // 8,500 each   12000 ea
  new RegExp(String.raw`(?<![\w.])${AMT_BIG}\s?(?:each|ea)\b`, 'gi'),
  // "... = 425,000" / "= ₦425,000" at the end of a line
  new RegExp(String.raw`=\s*(?:${SYM}|(?<![A-Za-z0-9])N(?![A-Za-z])|#)\s?${AMT}${MAG_CUR}\s*$`, 'gi'),
  new RegExp(String.raw`=\s*${AMT_BIG}${MAG_PLAIN}\s*$`, 'gi'),
]

// A remaining bare number of 4+ digits (or with thousands separators) after the
// quantity+unit were read is almost certainly a price column, never a size
// (sizes such as 12mm / 50kg / 2x2 were already taken out as specifications).
export const RESIDUAL_PRICE = /(?<![\w.])(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)(?![\w])/g

const tidyText = (s) =>
  s
    .replace(/\(\s*\)|\[\s*\]/g, ' ')
    .replace(/\s+(?:@|at)\s*$/i, ' ')
    .replace(/(\s[-–—:|/,;]\s*){2,}/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:=,.;|/]+|[\s\-–—:=,.;|/]+$/g, '')
    .trim()

// Removes every clearly-marked price from a piece of text.
// { tidy: false } keeps the rest of the text byte-for-byte (used while typing).
export function stripPrices(input, { tidy = true } = {}) {
  const original = String(input ?? '')
  let text = original
  const removed = []
  for (const re of PRICE_PATTERNS) {
    text = text.replace(re, (m) => { removed.push(m.trim()); return ' ' })
  }
  if (!removed.length) return { text: original, removed, changed: false }
  return { text: tidy ? tidyText(text) : text, removed, changed: true }
}

export const containsPrice = (text) => stripPrices(text, { tidy: false }).changed

const NUM_CELL = /^(?:₦|NGN|USD|GBP|EUR|\$|£|€|#|N)?\s?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s?(?:k|naira|ngn))?$/i
const UNIT_CELL = new RegExp(`^(?:${UNITS})\\.?$`, 'i')

// Tab / pipe separated rows (Excel, Google Sheets, WhatsApp tables, SmartFixer exports).
// Keeps the item, the quantity and the unit; drops serial numbers and every
// numeric cell that comes after the quantity/unit (rate and amount columns).
export function normalizeCells(line) {
  const src = String(line ?? '')
  if (!/\t|\|/.test(src)) return { text: src, dropped: 0, inferred: false }
  let cells = src.split(/\t|\|/).map((c) => c.trim()).filter(Boolean)
  if (cells.length < 2) return { text: cells.join(' '), dropped: 0, inferred: false }

  let inferred = false
  let qIdx = cells.findIndex((c, i) => NUM_CELL.test(c) && cells[i + 1] && UNIT_CELL.test(cells[i + 1]))
  let keepUntil
  if (qIdx >= 0) {
    keepUntil = qIdx + 2
  } else {
    const nums = cells.map((c, i) => (NUM_CELL.test(c) ? i : -1)).filter((i) => i >= 0)
    if (nums.length >= 3 && nums[0] === 0) { cells = cells.slice(1); nums.shift(); nums.forEach((_, k) => { nums[k] -= 1 }) }
    if (!nums.length) return { text: cells.join(' '), dropped: 0, inferred: false }
    qIdx = nums[0]
    keepUntil = qIdx + 1
    inferred = nums.length > 1
  }
  // serial number column ("1 | Cement | 50 | bags | ...")
  let serial = 0
  if (qIdx > 0 && /^\d{1,3}$/.test(cells[0]) && cells.length >= 4) serial = 1

  let dropped = serial
  const kept = []
  cells.forEach((c, i) => {
    if (i < serial) return
    if (i >= keepUntil && NUM_CELL.test(c)) { dropped += 1; return }
    kept.push(c)
  })
  return { text: kept.join(' '), dropped: dropped - serial, inferred }
}

const TOTAL_LINE = new RegExp(
  String.raw`^\s*(?:[-*•▪●]\s*|\(?\d{1,2}[.)]\s+)?(?:` +
    String.raw`(?:grand\s*|sub-?\s*)?total\b|v\.?a\.?t\b|tax\b|discount\b|balance\b|amount\s*(?:due|paid|payable|in\s*words)\b|` +
    String.raw`(?:delivery|transport(?:ation)?|loading|offloading|labou?r|installation|service|handling|shipping)\s*(?:fees?|charges?|costs?)\b|` +
    String.raw`bank\b|account\s*(?:no|number|name)\b|acct\b|payment\s*(?:terms|details|method)\b|pay(?:able)?\s+to\b` +
    String.raw`)`,
  'i',
)
const HEADER_WORDS = /\b(?:qty|quantity|item|items|description|desc|particulars|s\/?n)\b/i
const PRICE_WORDS = /\b(?:unit\s*price|price|amount|rate|total|cost)\b/i

const TITLE_LINE = /^\s*(?:quotation|quote|invoice|pro-?forma(?:\s+invoice)?|receipt|estimate|bill\s+of\s+quantit(?:y|ies)|boq)\s*[:.]?\s*$/i

// 'total'  -> totals, fees, tax, bank details (never materials)
// 'header' -> a table header row that has a price column
// 'title'  -> a document title such as "QUOTATION" or "INVOICE" (never a material)
export function classifyLine(line) {
  const s = String(line ?? '')
  if (TITLE_LINE.test(s)) return 'title'
  if (TOTAL_LINE.test(s)) return 'total'
  if (PRICE_WORDS.test(s) && HEADER_WORDS.test(s) && !/\d{3,}/.test(s)) return 'header'
  return null
}

// Cleans pasted text BEFORE it is sent anywhere (e.g. to an AI service).
export function redactTextPrices(text) {
  const lines = String(text ?? '').split(/\r?\n/)
  const out = []
  let touched = 0
  for (const line of lines) {
    const kind = classifyLine(line)
    if (kind) { if (kind !== 'title') touched += 1; continue }
    const cells = normalizeCells(line)
    const sp = stripPrices(cells.text)
    if (sp.changed || cells.dropped) touched += 1
    out.push(sp.changed || cells.dropped ? sp.text : cells.text)
  }
  return { text: out.join('\n'), touched }
}

export const PRICE_REMOVED_MESSAGE =
  'Prices in your list were removed. Merchants quote their own prices, so a price from a list or document is never used.'
export const PRICE_CHECK_MESSAGE =
  'A number that may have been a price was removed. Please check this line.'

export const priceRemovedWarning = () => ({ code: 'PRICE_REMOVED', message: PRICE_REMOVED_MESSAGE })

// The ONLY fields a material line may carry. Anything else (price, unitPrice,
// amount, total, cost, rate, currency, ...) is dropped, whatever produced it.
export const ITEM_FIELDS = ['id', 'name', 'quantity', 'unit', 'specs', 'notes', 'confidence', 'flags', 'needsReview', 'source']

const cleanField = (v) => stripPrices(String(v ?? '')).text

// Defence in depth: used on whatever the AI service (or the network) returns.
export function sanitizeItem(item) {
  if (!item || typeof item !== 'object') return { item: null, priceRemoved: false }
  const out = {}
  let priceRemoved = Object.keys(item).some((k) => !ITEM_FIELDS.includes(k) && /pric|cost|amount|rate|total|currency|naira|ngn|vat|worth/i.test(k))
  for (const k of ITEM_FIELDS) if (k in item) out[k] = item[k]
  for (const k of ['name', 'specs', 'notes']) {
    if (typeof out[k] === 'string') {
      const r = stripPrices(out[k])
      if (r.changed) { priceRemoved = true; out[k] = r.text }
    }
  }
  if (priceRemoved && Array.isArray(out.flags) && !out.flags.includes('PRICE_REMOVED')) out.flags = [...out.flags, 'PRICE_REMOVED']
  return { item: out, priceRemoved }
}

// Sanitises a whole extraction result. Adds ONE visible PRICE_REMOVED warning
// when anything was removed. Lines left with no name are dropped (and said so).
export function sanitizeExtraction(result) {
  const warnings = [...(result?.warnings || [])]
  const items = []
  let touched = warnings.some((w) => w.code === 'PRICE_REMOVED')
  for (const raw of result?.items || []) {
    const { item, priceRemoved } = sanitizeItem(raw)
    if (priceRemoved) touched = true
    if (!item) continue
    if (!String(item.name || '').trim()) {
      warnings.push({ code: 'LINE_SKIPPED', message: 'A line that only contained a price was left out.' })
      continue
    }
    items.push(item)
  }
  const rest = warnings.filter((w) => w.code !== 'PRICE_REMOVED')
  const out = touched ? [priceRemovedWarning(), ...rest] : rest
  return { ...result, items, warnings: out, priceRemoved: touched }
}
