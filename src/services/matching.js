// WakaStore quotation matching engine (pure functions, no React, no localStorage).
// Rule: a merchant qualifies when matched requested LINES / total requested LINES >= threshold (default 60%).
// Value of the order is never part of the calculation.

export const DEFAULT_THRESHOLD = 60

const STOPWORDS = new Set(['of', 'the', 'a', 'an', 'for', 'and', 'with', 'in', 'to', 'x'])

const UNIT_ALIASES = {
  bag: 'bag', bags: 'bag',
  piece: 'piece', pieces: 'piece', pcs: 'piece', pc: 'piece', unit: 'piece', units: 'piece',
  length: 'length', lengths: 'length', rod: 'length', rods: 'length',
  metre: 'metre', metres: 'metre', meter: 'metre', meters: 'metre', m: 'metre',
  roll: 'roll', rolls: 'roll',
  box: 'box', boxes: 'box', carton: 'box', cartons: 'box',
  tonne: 'tonne', tonnes: 'tonne', ton: 'tonne', tons: 'tonne',
  litre: 'litre', litres: 'litre', liter: 'litre', liters: 'litre', l: 'litre',
  bucket: 'bucket', buckets: 'bucket', bundle: 'bundle', bundles: 'bundle',
  sheet: 'sheet', sheets: 'sheet'
}

export const normalizeUnit = (unit = '') => {
  const u = String(unit).trim().toLowerCase()
  return UNIT_ALIASES[u] || u
}

// "50 bags of Dangote cement" -> { name: 'Dangote cement', quantity: 50, unit: 'bags' }
export function parseMaterialsList(text = '') {
  return String(text)
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(?:of\s+)?(.+)$/i)
      if (m && UNIT_ALIASES[(m[2] || '').toLowerCase()]) {
        return { id: `line-${i + 1}`, name: m[3].replace(/[.,]$/, '').trim(), quantity: Number(m[1]), unit: m[2].toLowerCase(), category: '', brand: '', specs: '', notes: '' }
      }
      const q = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/)
      return { id: `line-${i + 1}`, name: (q ? q[2] : line).replace(/[.,]$/, '').trim(), quantity: q ? Number(q[1]) : 1, unit: '', category: '', brand: '', specs: '', notes: '' }
    })
}

const tokenize = (s = '') =>
  String(s).toLowerCase().replace(/×/g, 'x').replace(/[^a-z0-9.x\s]/g, ' ').replace(/(\d)\s+(mm|cm|kg|l|m|in)\b/g, '$1$2')
    .split(/\s+/).filter((t) => t && !STOPWORDS.has(t))

// Size-like tokens (12mm, 50kg, 60x60, 4in) must match exactly: 12mm rod is NOT a 16mm rod.
const isSizeToken = (t) => /\d/.test(t)

function lineMatchesProduct(line, product) {
  if (product.available === false || product.stock <= 0) return { ok: false, reason: 'out_of_stock' }
  const unitLine = normalizeUnit(line.unit)
  const unitProd = normalizeUnit(product.unit)
  if (unitLine && unitProd && unitLine !== unitProd) return { ok: false, reason: 'unit_mismatch' }

  const want = tokenize([line.brand, line.name, line.specs].filter(Boolean).join(' '))
  const have = new Set(tokenize([product.name, product.brand, product.specs, ...(product.aliases || [])].filter(Boolean).join(' ')))
  if (!want.length) return { ok: false, reason: 'empty' }

  const sizes = want.filter(isSizeToken)
  if (sizes.some((t) => !have.has(t))) return { ok: false, reason: 'spec_mismatch' }

  const hits = want.filter((t) => have.has(t)).length
  return hits / want.length >= 0.6 ? { ok: true } : { ok: false, reason: 'no_match' }
}

/**
 * @param lines      [{ id, name, quantity, unit, brand?, specs?, category? }]
 * @param merchants  [{ id, name, status, active? }]
 * @param products   [{ id, merchantId, name, price, stock, unit, available, aliases?, specs?, brand? }]
 * @param threshold  percent, default 60
 */
export function matchQuotation(lines, merchants, products, threshold = DEFAULT_THRESHOLD) {
  const total = lines.length
  const results = merchants
    .filter((m) => m.status === 'approved' && m.active !== false)
    .map((merchant) => {
      const mine = products.filter((p) => p.merchantId === merchant.id)
      const matched = []
      const unmatched = []
      lines.forEach((line) => {
        const hit = mine.map((p) => ({ p, r: lineMatchesProduct(line, p) })).filter((x) => x.r.ok).sort((a, b) => a.p.price - b.p.price)[0]
        if (!hit) {
          // Same item, different unit? Tell the UI which unit the merchant actually sells it in.
          const near = mine.find((p) => lineMatchesProduct({ ...line, unit: '' }, p).ok)
          return unmatched.push(near ? { line, soldPerUnit: near.unit } : { line })
        }
        const availableQty = Math.min(line.quantity, hit.p.stock)
        matched.push({
          line, product: hit.p, unitPrice: hit.p.price, availableQty,
          shortfall: Math.max(0, line.quantity - hit.p.stock),
          partial: hit.p.stock < line.quantity,
          lineTotal: availableQty * hit.p.price
        })
      })
      const percentage = total ? Math.round((matched.length / total) * 1000) / 10 : 0
      return {
        merchant, matchedCount: matched.length, totalLines: total, percentage,
        eligible: total > 0 && percentage >= threshold,
        matched, unmatched, subtotal: matched.reduce((s, m) => s + m.lineTotal, 0)
      }
    })
    .sort((a, b) => b.percentage - a.percentage || a.subtotal - b.subtotal)

  const eligible = results.filter((r) => r.eligible)

  // Per line: every eligible merchant that can supply it (for the compare / per-item selection screen).
  const perLine = lines.map((line) => ({
    line,
    options: eligible.flatMap((r) => r.matched.filter((m) => m.line.id === line.id).map((m) => ({ merchantId: r.merchant.id, merchantName: r.merchant.name, ...m })))
      .sort((a, b) => Number(a.partial) - Number(b.partial) || a.unitPrice - b.unitPrice) // full-quantity offers first, then cheapest
  }))
  const needsSourcing = perLine.filter((x) => !x.options.length).map((x) => x.line)

  return { threshold, totalLines: total, results, eligible, ineligible: results.filter((r) => !r.eligible), perLine, needsSourcing, quotationNeedsSourcing: eligible.length === 0 }
}

// One tap "Best basket": cheapest eligible merchant for each line. Returns { [lineId]: option }.
export const bestBasket = (match) =>
  Object.fromEntries(match.perLine.filter((x) => x.options.length).map((x) => [x.line.id, x.options[0]]))

// Group a { lineId: option } selection by merchant -> the shape used to build sub-orders.
export function groupSelectionByMerchant(selection) {
  const groups = {}
  Object.values(selection).forEach((o) => {
    groups[o.merchantId] ||= { merchantId: o.merchantId, merchantName: o.merchantName, items: [], subtotal: 0 }
    groups[o.merchantId].items.push({ lineId: o.line.id, productId: o.product.id, name: o.product.name, unit: o.product.unit, quantity: o.availableQty, unitPrice: o.unitPrice, lineTotal: o.lineTotal })
    groups[o.merchantId].subtotal += o.lineTotal
  })
  return Object.values(groups)
}

/**
 * Select the two strongest merchants for the WakaStore MVP.
 * Eligibility remains line-coverage based (60% by default); the returned
 * offer template always contains every requested line. Lines not held in
 * stock are explicitly marked for merchant sourcing and must be priced by
 * the merchant before the quotation can be sent to the customer.
 */
export function matchTwoMerchantOffers(lines, merchants, products, threshold = DEFAULT_THRESHOLD) {
  const match = matchQuotation(lines, merchants, products, threshold)
  const selected = match.eligible.slice(0, 2).map((result, index) => {
    const matchedByLine = new Map(result.matched.map((item) => [item.line.id, item]))
    const unmatchedByLine = new Map(result.unmatched.map((item) => [item.line.id, item]))
    const completeItems = lines.map((line) => {
      const stocked = matchedByLine.get(line.id)
      if (stocked) return {
        lineId: line.id,
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        specification: line.specs || '',
        supplyType: stocked.partial ? 'partial-stock-plus-sourcing' : 'in-stock',
        availableQuantity: stocked.availableQty,
        outsourcedQuantity: stocked.shortfall,
        productId: stocked.product.id,
        productName: stocked.product.name,
        unitPrice: stocked.unitPrice,
        lineTotal: stocked.lineTotal,
        merchantMustConfirm: stocked.partial
      }
      return {
        lineId: line.id,
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        specification: line.specs || '',
        supplyType: 'merchant-sourcing-required',
        availableQuantity: 0,
        outsourcedQuantity: line.quantity,
        productId: null,
        productName: null,
        unitPrice: null,
        lineTotal: null,
        merchantMustConfirm: true,
        matchReason: unmatchedByLine.get(line.id)?.reason || 'not-in-stock-catalogue'
      }
    })
    return {
      rank: index + 1,
      merchant: result.merchant,
      coveragePercentage: result.percentage,
      threshold,
      completeOrderRequired: true,
      status: 'awaiting-merchant-complete-quotation',
      items: completeItems,
      stockedLineCount: result.matchedCount,
      totalLineCount: lines.length,
      requiresSourcing: completeItems.some((item) => item.merchantMustConfirm),
      merchantMustPriceEveryLine: true,
      estimatedStockedSubtotal: result.subtotal
    }
  })
  return {
    ...match,
    offers: selected,
    offersFound: selected.length,
    requiresManualSourcing: selected.length < 2,
    message: selected.length === 2
      ? 'Two qualified merchants selected. Each must quote the complete materials list, including outsourced items.'
      : `Only ${selected.length} qualified merchant offer${selected.length === 1 ? '' : 's'} found. Do not fabricate a second offer; widen the search or request admin sourcing.`
  }
}
