// Reusable product search / line-matching engine (pure functions, no React).
//
// Rules (apply to the whole catalogue, nothing is special-cased per product):
//  * case, punctuation, spacing and word order do not matter
//  * names match by whole word, prefix ("roof" -> roofing), plural and alias
//  * specifications (12mm, 20kg, 2x2, 60x60cm, 3/4) are parsed and compared
//      same value   -> exact
//      bare number  -> "Cement 20" SUGGESTS "Cement 20kg" (never auto-confirmed)
//      other value  -> conflict: Cement 20kg is NEVER silently turned into Cement 50kg
//  * exact matches rank above partial matches; conflicts are reported separately

const STOP = new Set(['of', 'the', 'a', 'an', 'for', 'and', 'with', 'in', 'to', 'x', 'pcs', 'pc', 'piece', 'pieces', 'no', 'nos', 'bag', 'bags'])

// Phrase aliases: any phrase in a group is rewritten to the first one.
const ALIAS_GROUPS = [
  ['iron rod', 'rebar', 'reinforcement bar', 'reinforcement rod', 'steel rod', 'iron bar'],
  ['roofing sheet', 'roof sheet', 'roofing sheets', 'longspan', 'long span', 'roofing zinc', 'zinc sheet'],
  ['sandcrete block', 'block', 'blocks', 'hollow block'],
  ['granite', 'chippings', 'gravel', 'crushed stone'],
  ['pvc pipe', 'pressure pipe'],
  ['emulsion paint', 'wall paint', 'paint'],
  ['plaster of paris', 'pop'],
  ['binding wire', 'tie wire'],
]
const ALIAS_MAP = new Map(ALIAS_GROUPS.flatMap(([canon, ...rest]) => rest.map((r) => [r, canon])))
const ALIAS_PHRASES = [...ALIAS_MAP.keys()].sort((a, b) => b.length - a.length)

const UNIT_CANON = { mm: 'mm', cm: 'cm', m: 'm', kg: 'kg', g: 'g', l: 'l', ltr: 'l', ltrs: 'l', litre: 'l', litres: 'l', in: 'in', inch: 'in', inches: 'in', '"': 'in', hp: 'hp', kw: 'kw', w: 'w', amp: 'a', a: 'a', v: 'v' }
const UNIT_RE = 'mm|cm|kg|ltrs?|litres?|inches|inch|in|hp|kw|amp|g|l|m|w|a|v|"'
const DIMS = new RegExp(`(?<![\\w.])(\\d+(?:\\.\\d+)?)\\s*x\\s*(\\d+(?:\\.\\d+)?)(?:\\s*x\\s*(\\d+(?:\\.\\d+)?))?\\s*(${UNIT_RE})?(?![a-z0-9])`, 'gi')
const FRAC = /(?<![\w.])(\d+)\s*\/\s*(\d+)(?![\w.])/g
const MEASURE = new RegExp(`(?<![\\w.])(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})(?![a-z0-9])`, 'gi')
const BARE = /(?<![\w.])\d+(?:\.\d+)?(?![\w.])/g

const clean = (s) => String(s ?? '').toLowerCase().replace(/×/g, 'x').replace(/[–—]/g, ' ')

export function extractSpecs(text) {
  let rest = ` ${clean(text)} `
  const specs = []
  rest = rest.replace(DIMS, (m, a, b, c, u) => { specs.push({ type: 'dims', values: [a, b, c].filter(Boolean).map(Number), unit: u ? UNIT_CANON[u.toLowerCase()] : '' }); return ' ' })
  rest = rest.replace(FRAC, (m, a, b) => { specs.push({ type: 'frac', value: Number(a) / Number(b), raw: `${a}/${b}` }); return ' ' })
  rest = rest.replace(MEASURE, (m, v, u) => { specs.push({ type: 'measure', value: Number(v), unit: UNIT_CANON[u.toLowerCase()] }); return ' ' })
  rest = rest.replace(BARE, (m) => { specs.push({ type: 'bare', value: Number(m) }); return ' ' })
  return { specs, rest }
}

const singular = (w) => (w.length > 3 && /(ches|xes|sses|shes)$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)

export function nameTokens(text) {
  let t = ` ${text} `.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')
  for (const phrase of ALIAS_PHRASES) {
    const re = new RegExp(`(?<=\\s)${phrase.replace(/ /g, '\\s+')}(?=\\s)`, 'g')
    t = t.replace(re, ` ${ALIAS_MAP.get(phrase)} `)
  }
  return [...new Set(t.split(/\s+/).filter((w) => w && !STOP.has(w)).map(singular))]
}

export function parseQuery(input) {
  const text = typeof input === 'string' ? input : [input.brand, input.name, input.specs].filter(Boolean).join(' ')
  const { specs, rest } = extractSpecs(text)
  return { text, specs, tokens: nameTokens(rest) }
}

const same = (a, b) => Math.abs(a - b) < 1e-9
const dimsEqual = (a, b) => a.length === b.length && (a.every((v, i) => same(v, b[i])) || a.every((v, i) => same(v, [...b].reverse()[i])))

// Compare ONE query spec with the product's specs -> 'exact' | 'suggest' | 'conflict' | 'unknown'
export function compareSpec(q, pSpecs) {
  const mine = pSpecs.filter((p) => (q.type === 'bare' ? p.type === 'measure' || p.type === 'bare' || p.type === 'frac' : q.type === 'measure' ? p.type === 'measure' : p.type === q.type))
  if (!mine.length) return 'unknown'
  if (q.type === 'dims') {
    if (mine.some((p) => dimsEqual(p.values, q.values) && (!q.unit || !p.unit || p.unit === q.unit))) return 'exact'
    return 'conflict'
  }
  if (q.type === 'frac') return mine.some((p) => same(p.value, q.value)) ? 'exact' : 'conflict'
  if (q.type === 'measure') {
    const sameUnit = mine.filter((p) => p.unit === q.unit)
    if (!sameUnit.length) return 'unknown'
    return sameUnit.some((p) => same(p.value, q.value)) ? 'exact' : 'conflict'
  }
  // bare number: only a suggestion, never an automatic match
  return mine.some((p) => same(p.value, q.value)) ? 'suggest' : 'conflict'
}

const catTokens = (c) => nameTokens(clean(String(c || '').replace(/\b(merchant|materials|material)\b/gi, ' ')))

const prefixHit = (tok, hay) => tok.length >= 3 && [...hay].some((h) => h.startsWith(tok) || (h.length >= 4 && tok.startsWith(h)))

export function scoreMatch(query, product, { useCategory = true } = {}) {
  const q = typeof query === 'object' && query.tokens ? query : parseQuery(query)
  const pText = [product.name, product.specs].filter(Boolean).join(' ')
  const { specs: pSpecs, rest } = extractSpecs(pText)
  const nameHay = new Set(nameTokens([rest, product.brand, ...(product.aliases || []), ...(product.keywords || [])].filter(Boolean).map(clean).join(' ')))
  const catHay = new Set(useCategory ? [...catTokens(product.category), ...catTokens(product.customerCategory)] : [])
  if (!q.tokens.length) return { kind: 'none', score: 0 }

  let nameHits = 0
  let catHits = 0
  for (const t of q.tokens) {
    if (nameHay.has(t) || prefixHit(t, nameHay)) nameHits++
    else if (catHay.has(t) || prefixHit(t, catHay)) catHits++
  }
  const coverage = (nameHits + 0.7 * catHits) / q.tokens.length

  const specResults = q.specs.map((s) => compareSpec(s, pSpecs))
  const conflicts = specResults.filter((r) => r === 'conflict').length
  const reasons = []
  if (nameHits + catHits === 0) return { kind: 'none', score: 0, reasons }
  if (conflicts) return { kind: 'conflict', score: 0, coverage, reasons: ['Different specification'], productSpecs: pSpecs }

  const allNameTokens = nameHits === q.tokens.length
  const exactName = allNameTokens && new Set(nameTokens(rest)).size === q.tokens.length
  const unconfirmed = specResults.some((r) => r === 'suggest' || r === 'unknown')

  if (allNameTokens && !unconfirmed) return { kind: 'exact', score: exactName ? 110 : 100, coverage, reasons: q.specs.length ? ['Name and specification match'] : ['Name matches'] }
  if (allNameTokens) return { kind: 'suggestion', score: 70, coverage, reasons: [specResults.includes('unknown') ? 'Product does not state this specification' : 'Specification matches only without a unit. Please confirm the unit.'] }
  if (coverage >= 0.5) return { kind: unconfirmed ? 'suggestion' : 'partial', score: 30 + Math.round(coverage * 30), coverage, reasons: ['Partial name match'] }
  return { kind: 'none', score: 0, reasons }
}

export function searchCatalogue(input, products, { limit = 50, useCategory = true } = {}) {
  const q = parseQuery(input)
  const scored = products.map((product) => ({ product, ...scoreMatch(q, product, { useCategory }) }))
  const results = scored.filter((r) => r.kind !== 'none' && r.kind !== 'conflict').sort((a, b) => b.score - a.score || String(a.product.name).localeCompare(String(b.product.name))).slice(0, limit)
  const otherSpecs = scored.filter((r) => r.kind === 'conflict').slice(0, 5).map((r) => r.product)
  return {
    query: q,
    results,
    exact: results.filter((r) => r.kind === 'exact'),
    suggestions: results.filter((r) => r.kind !== 'exact'),
    otherSpecs,
    hasCatalogueMatch: results.some((r) => r.kind === 'exact'),
    isCustomRequest: results.length === 0,
  }
}
