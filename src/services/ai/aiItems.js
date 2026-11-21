// Turns the raw output of an AI service into the app's ExtractionResult.
// Pure functions (no network). Used by the backend, and by tests.
//
// Rules, same as the text parser:
//   - AI only extracts and organises. Never prices, never stock.
//   - A missing / unclear quantity stays null and is flagged for the customer.
//   - Anything shaped like a price is removed (priceGuard), whatever the AI sent.
//   - Units are mapped to the app's canonical units; an unknown unit is never
//     silently dropped: it is kept in notes and the unit is left for the customer.

import { CANONICAL_UNITS, annotateItems, normalizeUnitWord, scoreItem } from './materialParser.js'
import { priceRemovedWarning, sanitizeExtraction, stripPrices } from './priceGuard.js'

export const MAX_ITEMS = 200

const tidy = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:=,.;|]+|[\s\-–—:=,.;|]+$/g, '')
    .trim()
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function buildAiResult(aiOutput, { idPrefix = 'ai', documentHadPrices = false } = {}) {
  const rawItems = Array.isArray(aiOutput?.items) ? aiOutput.items : []
  const warnings = []
  const items = []
  let priceTouched = Boolean(documentHadPrices)
  const stamp = Date.now().toString(36)

  if (rawItems.length > MAX_ITEMS) warnings.push({ code: 'TOO_MANY_ITEMS', message: `Only the first ${MAX_ITEMS} lines were read. Send the rest as a second list.` })

  rawItems.slice(0, MAX_ITEMS).forEach((r, i) => {
    if (!r || typeof r !== 'object') return
    // Any price-ish key the AI sent is a price. Counted, never copied.
    if (Object.keys(r).some((k) => /pric|cost|amount|rate|total|currency|naira|ngn|vat|worth/i.test(k) && r[k] !== undefined && r[k] !== null && r[k] !== '' && r[k] !== false)) priceTouched = true

    const clean = (v) => {
      const s = stripPrices(String(v ?? ''))
      if (s.changed) priceTouched = true
      return tidy(s.text)
    }
    const name = cap(clean(r.name))
    const specs = clean(r.specs)
    let notes = clean(r.notes)

    let quantity = null
    if (r.quantity !== null && r.quantity !== undefined && r.quantity !== '') {
      const n = Number(String(r.quantity).replace(/,/g, ''))
      quantity = Number.isFinite(n) ? n : null
    }

    let unit = ''
    const written = tidy(r.unit)
    if (written) {
      unit = normalizeUnitWord(written) || (CANONICAL_UNITS.includes(written.toLowerCase()) ? written.toLowerCase() : '')
      if (!unit) notes = tidy(`${notes} Unit written: ${written}.`)
    }

    if (!name) {
      warnings.push({ code: 'LINE_SKIPPED', message: 'A line with no readable material name was left out.' })
      return
    }

    const scored = scoreItem({ name, quantity, unit, unreadable: Boolean(r.uncertain) })
    items.push({
      id: `${idPrefix}-${stamp}-${i}`,
      name,
      quantity: quantity !== null && quantity > 0 ? quantity : null,
      unit,
      specs,
      notes,
      ...scored,
      source: 'ai',
    })
  })

  annotateItems(items, warnings)
  if (priceTouched) warnings.unshift(priceRemovedWarning())
  return sanitizeExtraction({ items, warnings })
}
