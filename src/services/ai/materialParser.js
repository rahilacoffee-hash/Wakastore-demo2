// Deterministic material-list parser (pure functions, no React, no network).
// It only ever reads what is WRITTEN: a missing quantity stays null and is
// flagged for the customer; nothing is guessed, and no prices or stock are
// ever produced here. If the text contains prices (unit price, amount, total,
// a price column), they are removed by priceGuard.js and the customer is told.

import { RESIDUAL_PRICE, classifyLine, normalizeCells, priceRemovedWarning, stripPrices } from './priceGuard.js'

export const CANONICAL_UNITS = ['bags', 'pieces', 'lengths', 'metres', 'rolls', 'boxes', 'cartons', 'sheets', 'tonnes', 'trips', 'litres', 'buckets', 'bundles', 'packs', 'sets']

const UNIT_WORDS = {
  bag: 'bags', bags: 'bags',
  pc: 'pieces', pcs: 'pieces', piece: 'pieces', pieces: 'pieces', nos: 'pieces', no: 'pieces', units: 'pieces', unit: 'pieces',
  length: 'lengths', lengths: 'lengths', lgth: 'lengths', lgths: 'lengths',
  metre: 'metres', metres: 'metres', meter: 'metres', meters: 'metres', rm: 'metres',
  roll: 'rolls', rolls: 'rolls',
  box: 'boxes', boxes: 'boxes',
  carton: 'cartons', cartons: 'cartons', ctn: 'cartons', ctns: 'cartons',
  sheet: 'sheets', sheets: 'sheets',
  tonne: 'tonnes', tonnes: 'tonnes', ton: 'tonnes', tons: 'tonnes',
  trip: 'trips', trips: 'trips',
  litre: 'litres', litres: 'litres', liter: 'litres', liters: 'litres', ltr: 'litres', ltrs: 'litres',
  bucket: 'buckets', buckets: 'buckets',
  bundle: 'bundles', bundles: 'bundles',
  set: 'sets', sets: 'sets',
  pack: 'packs', packs: 'packs', packet: 'packs', packets: 'packs',
}
export const normalizeUnitWord = (w) => UNIT_WORDS[String(w || '').toLowerCase().replace(/\.$/, '')] || null

const UNIT_ALT = Object.keys(UNIT_WORDS).sort((a, b) => b.length - a.length).join('|')
const QTY_UNIT = new RegExp(`(?<![\\w.])(\\d{1,3}(?:,\\d{3})+|\\d+(?:\\.\\d+)?)\\s*(${UNIT_ALT})\\b\\.?`, 'i')
// Sizes stay with the material (12mm, 50kg, 2x2, 4in, 20L, 60x60cm), never become the quantity.
const SIZE = /(?<![\w.])(\d+(?:\.\d+)?\s*x\s*\d+(?:\.\d+)?(?:\s*x\s*\d+(?:\.\d+)?)?\s*(?:mm|cm|m|in|inch|inches|")?|\d+(?:\.\d+)?\s*(?:mm|cm|kg|ltrs?|l|inch|inches|in|")(?![a-z]))/gi
const UNREADABLE = /\?|\billegible\b|\bunclear\b|\bunreadable\b|\[\s*\]/i

const num = (s) => Number(String(s).replace(/,/g, ''))
const tidy = (s) =>
  s.replace(/\s+/g, ' ')
    .replace(/(\s[-–—:|,;]\s*){2,}/g, ' - ')
    .replace(/^[\s\-–—:=,.;]+|[\s\-–—:=,.;]+$/g, '')
    .replace(/^[x×]\s+/i, '')
    .replace(/\s+x$/i, '')
    .replace(/^(of|and)\s+/i, '')
    .trim()
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

// Flags + confidence for ONE line. Shared by the text parser and by AI results,
// so a line is judged by exactly the same rules whichever way it was read.
export function scoreItem({ name = '', quantity = null, unit = '', unreadable = false }) {
  const flags = []
  const hasQty = quantity !== null && quantity !== undefined
  if (!hasQty) flags.push('MISSING_QUANTITY')
  else if (!(quantity > 0)) flags.push('INVALID_QUANTITY')
  if (hasQty && !unit) flags.push('MISSING_UNIT')
  if (unreadable) flags.push('UNCERTAIN_TEXT')
  if (name.length > 0 && name.length < 3) flags.push('SHORT_NAME')

  let confidence = 0.96
  if (flags.includes('MISSING_UNIT')) confidence = 0.8
  if (flags.includes('SHORT_NAME')) confidence = 0.55
  if (flags.includes('MISSING_QUANTITY')) confidence = 0.5
  if (flags.includes('INVALID_QUANTITY')) confidence = 0.4
  if (flags.includes('UNCERTAIN_TEXT')) confidence = Math.min(confidence, 0.4)
  return { flags, confidence, needsReview: confidence < 0.7 || flags.includes('MISSING_QUANTITY') }
}

export function parseMaterialLine(rawLine) {
  const raw = String(rawLine)
  let text = raw
    .replace(/^\s*(?:[-*•▪●]|\(?\d{1,2}[.)])\s+/, '')
    .replace(/[–—]/g, ' - ')
    .replace(/×/g, 'x')
    .trim()

  // 0. prices never become part of a material line.
  const cells = normalizeCells(text)
  text = cells.text
  const sp = stripPrices(text)
  text = sp.text
  let priceRemoved = sp.changed || cells.dropped > 0
  let priceCheck = cells.inferred // price column dropped without a unit to anchor the quantity

  const unreadable = UNREADABLE.test(text)

  // 1. specifications (sizes)
  const specs = []
  text = text.replace(SIZE, (m) => { specs.push(m.replace(/\s+/g, '').replace(/inches|inch/i, 'in').replace(/x/gi, 'x')); return ' ' })

  // 2. quantity + unit
  let quantity = null
  let unit = null
  let possiblePrice = false
  const qu = text.match(QTY_UNIT)
  if (qu) {
    quantity = num(qu[1])
    unit = normalizeUnitWord(qu[2])
    text = text.replace(qu[0], ' ')
    // A bare 4+ digit number left over after "50 bags" is a price column, not a size.
    const before = text
    text = text.replace(RESIDUAL_PRICE, ' ')
    if (text !== before) { priceRemoved = true; priceCheck = true }
  } else {
    const lead = text.match(/^\s*(\d+(?:\.\d+)?)\s+(?=[A-Za-z])/)
    const trail = text.match(/\s(?:x|-|:|=)\s*(\d+(?:\.\d+)?)\s*$/i) || text.match(/\s(\d+)\s*$/)
    if (lead) { quantity = num(lead[1]); text = text.replace(lead[0], ' ') }
    else if (trail) { quantity = num(trail[1]); text = text.slice(0, trail.index) }
    // "Roofing nails 3500": no unit, thousands. It might be a price. Never deleted, always checked.
    if (quantity !== null && quantity >= 1000) possiblePrice = true
  }

  let name = cap(tidy(text.replace(UNREADABLE, ' ')))
  if (!name) name = ''
  const { flags, confidence: base, needsReview: baseReview } = scoreItem({ name, quantity, unit: unit || '', unreadable })
  let confidence = base
  if (priceRemoved) flags.push('PRICE_REMOVED')
  if (priceCheck) { flags.push('PRICE_CHECK'); confidence = Math.min(confidence, 0.65) }
  if (possiblePrice) { flags.push('POSSIBLE_PRICE'); confidence = Math.min(confidence, 0.6) }

  return {
    name,
    quantity: quantity !== null && quantity > 0 ? quantity : null,
    unit: unit || '',
    specs: specs.join(' '),
    notes: unreadable ? 'Marked as unclear in your list. Please check.' : '',
    confidence,
    flags,
    needsReview: baseReview || confidence < 0.7,
  }
}

const dupKey = (i) => `${i.name.toLowerCase().replace(/[^a-z0-9]/g, '')}|${i.specs.toLowerCase()}|${i.unit}`

// Marks lines that look like the same material. They are NOT merged automatically.
export function findDuplicates(items) {
  const groups = new Map()
  items.forEach((item, index) => {
    if (!item.name) return
    const k = dupKey(item)
    groups.set(k, [...(groups.get(k) || []), index])
  })
  return [...groups.values()].filter((g) => g.length > 1)
}

// Adds the per-line warnings (missing quantity, unclear, duplicate...) to a list of
// items. Used for text parsing AND for AI results, so the review screen behaves the same.
export function annotateItems(items, warnings = []) {
  items.forEach((item) => {
    if (item.flags.includes('MISSING_QUANTITY')) warnings.push({ code: 'MISSING_QUANTITY', itemId: item.id, message: `"${item.name}" has no quantity. Please enter it.` })
    if (item.flags.includes('INVALID_QUANTITY')) warnings.push({ code: 'INVALID_QUANTITY', itemId: item.id, message: `"${item.name}" has an invalid quantity.` })
    if (item.flags.includes('UNCERTAIN_TEXT')) warnings.push({ code: 'UNCERTAIN_TEXT', itemId: item.id, message: `"${item.name}" was marked unclear. Please confirm it.` })
    if (item.flags.includes('MISSING_UNIT')) warnings.push({ code: 'MISSING_UNIT', itemId: item.id, message: `"${item.name}" has no unit. Choose one or leave it as "Any unit".` })
    if (item.flags.includes('PRICE_CHECK')) warnings.push({ code: 'PRICE_CHECK', itemId: item.id, message: `"${item.name}": a number that may have been a price was removed. Please check this line.` })
    if (item.flags.includes('POSSIBLE_PRICE')) warnings.push({ code: 'POSSIBLE_PRICE', itemId: item.id, message: `"${item.name}": the quantity ${item.quantity} could be a price. Please confirm it.` })
  })
  for (const group of findDuplicates(items)) {
    for (const idx of group) if (!items[idx].flags.includes('DUPLICATE')) items[idx].flags.push('DUPLICATE')
    warnings.push({ code: 'DUPLICATE', itemId: items[group[0]].id, message: `"${items[group[0]].name}" appears ${group.length} times. Merge or keep them.` })
  }
  if (!items.length) warnings.push({ code: 'NO_ITEMS', message: 'No materials were found. You can add items manually.' })
  return warnings
}

export function parseMaterialText(text = '') {
  const lines = String(text)
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter((l) => l && !/^[\s\-_=*.]+$/.test(l))
  const warnings = []
  const items = []
  let priceLinesSkipped = 0
  lines.forEach((line, i) => {
    // Totals, fees, VAT, bank details and price-column headers are not materials.
    const kind = classifyLine(line)
    if (kind) { if (kind !== 'title') priceLinesSkipped += 1; return }
    // Headings such as "Materials list:" are not materials.
    if (/:\s*$/.test(line) && !/\d/.test(line)) { warnings.push({ code: 'HEADING_SKIPPED', message: `Skipped heading "${line}".` }); return }
    const parsed = parseMaterialLine(line)
    if (!parsed.name) {
      if (parsed.flags.includes('PRICE_REMOVED')) { priceLinesSkipped += 1; return } // the line was only a price
      warnings.push({ code: 'LINE_SKIPPED', message: `Could not find a material name in "${line}".` })
      return
    }
    items.push({ id: `ex-${Date.now().toString(36)}-${i}`, ...parsed })
  })
  annotateItems(items, warnings)
  if (priceLinesSkipped > 0 || items.some((i) => i.flags.includes('PRICE_REMOVED'))) warnings.unshift(priceRemovedWarning())
  return { items, warnings }
}
