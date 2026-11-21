// WakaStore quotation matching engine (pure functions, no React, no localStorage).
// Rule: a merchant qualifies when matched requested LINES / total requested LINES >= threshold (default 60%).
// Value of the order is never part of the calculation.

import { parseQuery, scoreMatch } from './productSearch.js'

export const DEFAULT_THRESHOLD = 60

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

// Line <-> product matching now lives in services/productSearch.js (one reusable engine for
// search, suggestions and quotation matching). Category words never count as proof of stock.
function lineMatchesProduct(line, product) {
  const unitLine = normalizeUnit(line.unit)
  const unitProd = normalizeUnit(product.unit)
  if (unitLine && unitProd && unitLine !== unitProd) return { ok: false, reason: 'unit_mismatch' }

  const r = scoreMatch(parseQuery(line), product, { useCategory: false })
  if (r.kind === 'exact' || (r.kind === 'partial' && r.coverage >= 0.6)) return { ok: true }
  // "Cement 20" vs "Cement 20kg": suggest it, never treat it as confirmed supply.
  if (r.kind === 'suggestion') return { ok: false, reason: 'spec_unconfirmed', suggestion: true }
  if (r.kind === 'conflict') return { ok: false, reason: 'spec_mismatch' }
  return { ok: false, reason: 'no_match' }
}

/**
 * @param lines      [{ id, name, quantity, unit, brand?, specs?, category? }]
 * @param merchants  [{ id, name, status, active? }]
 * @param products   Inventory presence qualifies regardless of stock state; stock is only contextual, not a promise to supply.
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
          const suggested = mine.find((p) => lineMatchesProduct(line, p).reason === 'spec_unconfirmed')
          return unmatched.push({ line, ...(near ? { soldPerUnit: near.unit } : {}), ...(suggested ? { suggestedProduct: suggested } : {}) })
        }
        const availableQty = Math.min(Number(line.quantity) || 0, Math.max(0, Number(hit.p.stock) || 0))
        matched.push({
          line, product: hit.p, unitPrice: hit.p.price, availableQty,
          shortfall: Math.max(0, line.quantity - hit.p.stock),
          partial: Number(hit.p.stock) < Number(line.quantity),
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
 * Prepare a complete quotation request for EVERY eligible merchant.
 * Eligibility remains line-coverage based (60% by default); the returned
 * request template contains every requested line for each eligible merchant.
 * Initial matching reveals merchant eligibility, not catalogue prices.
 */
export function matchEligibleMerchantOffers(lines, merchants, products, threshold = DEFAULT_THRESHOLD) {
  const match = matchQuotation(lines, merchants, products, threshold)
  const selected = match.eligible.map((result, index) => {
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
    dispatchedToAllEligible: true,
    requiresManualSourcing: selected.length === 0,
    message: selected.length
      ? `Quotation request prepared for all ${selected.length} eligible merchant(s). Each must independently quote the complete materials list, including requested variations and items they need to source.`
      : 'No merchant reached the 60% threshold. Send the request for manual sourcing.' 
  }
}

// Backwards-compatible alias; the function returns every eligible merchant, not just two.
export const matchTwoMerchantOffers = matchEligibleMerchantOffers
