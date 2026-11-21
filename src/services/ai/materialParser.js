// Deterministic material-list parser (pure functions, no React, no network).
// It only ever reads what is WRITTEN: a missing quantity stays null and is
// flagged for the customer; nothing is guessed, and no prices or stock are
// ever produced here.

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
    .replace(/^[\s\-–—:=,.;x×]+|[\s\-–—:=,.;]+$/gi, '')
    .replace(/\s+x$/i, '')
    .replace(/^(of|and)\s+/i, '')
    .trim()
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function parseMaterialLine(rawLine) {
  const raw = String(rawLine)
  let text = raw
    .replace(/^\s*(?:[-*•▪●]|\(?\d{1,2}[.)])\s+/, '')
    .replace(/[–—]/g, ' - ')
    .replace(/×/g, 'x')
    .trim()
  const flags = []
  const unreadable = UNREADABLE.test(text)

  // 1. specifications (sizes)
  const specs = []
  text = text.replace(SIZE, (m) => { specs.push(m.replace(/\s+/g, '').replace(/inches|inch/i, 'in').replace(/x/gi, 'x')); return ' ' })

  // 2. quantity + unit
  let quantity = null
  let unit = null
  const qu = text.match(QTY_UNIT)
  if (qu) {
    quantity = num(qu[1])
    unit = normalizeUnitWord(qu[2])
    text = text.replace(qu[0], ' ')
  } else {
    const lead = text.match(/^\s*(\d+(?:\.\d+)?)\s+(?=[A-Za-z])/)
    const trail = text.match(/\s(?:x|-|:|=)\s*(\d+(?:\.\d+)?)\s*$/i) || text.match(/\s(\d+)\s*$/)
    if (lead) { quantity = num(lead[1]); text = text.replace(lead[0], ' ') }
    else if (trail) { quantity = num(trail[1]); text = text.slice(0, trail.index) }
  }

  let name = cap(tidy(text.replace(UNREADABLE, ' ')))
  if (!name) name = ''
  if (quantity === null) flags.push('MISSING_QUANTITY')
  else if (!(quantity > 0)) { flags.push('INVALID_QUANTITY') }
  if (quantity !== null && !unit) flags.push('MISSING_UNIT')
  if (unreadable) flags.push('UNCERTAIN_TEXT')
  if (name.length > 0 && name.length < 3) flags.push('SHORT_NAME')

  let confidence = 0.96
  if (flags.includes('MISSING_UNIT')) confidence = 0.8
  if (flags.includes('SHORT_NAME')) confidence = 0.55
  if (flags.includes('MISSING_QUANTITY')) confidence = 0.5
  if (flags.includes('INVALID_QUANTITY')) confidence = 0.4
  if (flags.includes('UNCERTAIN_TEXT')) confidence = Math.min(confidence, 0.4)

  return {
    name,
    quantity: quantity !== null && quantity > 0 ? quantity : null,
    unit: unit || '',
    specs: specs.join(' '),
    notes: unreadable ? 'Marked as unclear in your list. Please check.' : '',
    confidence,
    flags,
    needsReview: confidence < 0.7 || flags.includes('MISSING_QUANTITY'),
    raw,
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

export function parseMaterialText(text = '') {
  const lines = String(text)
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter((l) => l && !/^[\s\-_=*.]+$/.test(l))
  const warnings = []
  const items = []
  lines.forEach((line, i) => {
    // Headings such as "Materials list:" are not materials.
    if (/:\s*$/.test(line) && !/\d/.test(line)) { warnings.push({ code: 'HEADING_SKIPPED', message: `Skipped heading "${line}".` }); return }
    const parsed = parseMaterialLine(line)
    if (!parsed.name) { warnings.push({ code: 'LINE_SKIPPED', message: `Could not find a material name in "${line}".` }); return }
    items.push({ id: `ex-${Date.now().toString(36)}-${i}`, ...parsed })
  })
  items.forEach((item, index) => {
    if (item.flags.includes('MISSING_QUANTITY')) warnings.push({ code: 'MISSING_QUANTITY', itemId: item.id, message: `"${item.name}" has no quantity. Please enter it.` })
    if (item.flags.includes('INVALID_QUANTITY')) warnings.push({ code: 'INVALID_QUANTITY', itemId: item.id, message: `"${item.name}" has an invalid quantity.` })
    if (item.flags.includes('UNCERTAIN_TEXT')) warnings.push({ code: 'UNCERTAIN_TEXT', itemId: item.id, message: `"${item.name}" was marked unclear. Please confirm it.` })
    if (item.flags.includes('MISSING_UNIT')) warnings.push({ code: 'MISSING_UNIT', itemId: item.id, message: `"${item.name}" has no unit. Choose one or leave it as "Any unit".` })
    void index
  })
  for (const group of findDuplicates(items)) {
    for (const idx of group) items[idx].flags.push('DUPLICATE')
    warnings.push({ code: 'DUPLICATE', itemId: items[group[0]].id, message: `"${items[group[0]].name}" appears ${group.length} times. Merge or keep them.` })
  }
  if (!items.length) warnings.push({ code: 'NO_ITEMS', message: 'No materials were found. You can add items manually.' })
  return { items, warnings }
}
