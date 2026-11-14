// Item-level sourcing, confirmation and rerouting (pure functions, no React, no localStorage).
//
// Two DISTINCT processes live in this app:
//   1. INITIAL MERCHANT MATCHING  -> services/matching.js (60% of requested lines, max 2 merchants)
//   2. POST-ORDER ITEM SOURCING   -> this file (confirmation + reassignment of single items)
// Rerouting here never changes the 60% rule and never makes an initially ineligible merchant
// "eligible": a merchant considered for ONE item must have a relevant merchant category and either
// matching stock or a declared sourcing capability. Nothing here invents stock, prices or merchants.
//
// Every function takes an `order` and returns { ok, order } or { ok:false, code, error }.
// Orders are never mutated. Other items are never touched by an action on one item.

import { MERCHANT_CATEGORY_NAMES } from '../constants/categories.js'
import { parseQuery, scoreMatch, nameTokens, searchCatalogue } from './productSearch.js'

export const SOURCING = Object.freeze({
  AVAILABLE: 'AVAILABLE',                       // stocked and priced by the assigned merchant
  OUT_OF_STOCK: 'OUT_OF_STOCK',                 // known out of stock, merchant not asked yet
  SOURCING_REQUESTED: 'SOURCING_REQUESTED',     // assigned merchant must decide: can they source it?
  SOURCING_CONFIRMED: 'SOURCING_CONFIRMED',     // merchant explicitly confirmed + priced it
  SOURCING_DECLINED: 'SOURCING_DECLINED',       // merchant said "cannot source"
  REASSIGNMENT_PENDING: 'REASSIGNMENT_PENDING', // looking for another merchant for this item only
  REROUTED: 'REROUTED',                         // moved to another merchant; awaiting THEIR confirmation
  AWAITING_MERCHANT: 'AWAITING_MERCHANT',       // no merchant assigned yet
  UNRESOLVED: 'UNRESOLVED',                     // nobody can supply/source it (or customer declined the price)
})

export const FULFILMENT = Object.freeze(['PENDING', 'PREPARING', 'READY', 'DISPATCHED', 'DELIVERED', 'ACCEPTED'])
export const COMMISSION = Object.freeze({ merchant: 95, platform: 5 }) // percent
export const split = (gross) => {
  const merchantShare = Math.round((gross * COMMISSION.merchant) / 100)
  return { gross, merchantShare, commission: gross - merchantShare }
}

const nowIso = () => new Date().toISOString()
const fail = (code, error) => ({ ok: false, code, error })
const money = (n) => Number.isFinite(Number(n)) ? Number(n) : null
const roleOf = (actor) => actor?.role || ''
const isMerchant = (actor) => roleOf(actor) === 'merchant' && actor.merchantId
const isStaff = (actor) => ['admin', 'super-admin'].includes(roleOf(actor))

const patchItem = (order, itemId, fn) => ({
  ...order,
  items: order.items.map((it) => (it.itemId === itemId ? fn(it) : it)),
})
const entry = (type, by, extra = {}) => ({ at: extra.at || nowIso(), type, by, ...extra })
const findItem = (order, itemId) => (order?.items || []).find((i) => i.itemId === itemId)

/* ------------------------------------------------------------------ building */

// entries: [{ lineId?, name, specification?, quantity, unit?, productRef?, unitPrice?, category?, merchantId?, unavailable? }]
export function buildItems(orderId, entries, { at } = {}) {
  return entries.map((e, i) => {
    const unavailable = Boolean(e.unavailable) || !(Number(e.unitPrice) > 0)
    const qty = Math.max(1, Number(e.quantity) || 1)
    const merchantId = e.merchantId || null
    const status = !unavailable ? SOURCING.AVAILABLE : merchantId ? SOURCING.SOURCING_REQUESTED : SOURCING.AWAITING_MERCHANT
    return {
      itemId: `${orderId}-I${i + 1}`,
      lineId: e.lineId || null,
      name: e.name,
      specification: e.specification || '',
      quantity: qty,
      unit: e.unit || '',
      productRef: unavailable ? null : e.productRef || null,
      category: e.category || '',
      unitPrice: unavailable ? null : Number(e.unitPrice),
      lineTotal: unavailable ? null : Number(e.unitPrice) * qty,
      originalMerchantId: merchantId,
      currentMerchantId: merchantId,
      availability: unavailable ? 'NOT_IN_STOCK' : 'IN_STOCK',
      sourcingStatus: status,
      sourcing: null,
      declinedBy: [],
      priceApproval: null,
      fulfilment: 'PENDING',
      dispute: null,
      history: [entry(merchantId ? 'ASSIGNED' : 'NO_MERCHANT', 'system', { at, to: merchantId, note: unavailable ? 'Not currently in stock. Merchant must confirm whether they can source it.' : 'In stock' })],
    }
  })
}

// Upgrades orders saved before item-level tracking existed. Idempotent.
export function upgradeOrder(order) {
  if (!order || (order.items?.length && order.items.every((i) => i.itemId))) return order
  const subs = order.subOrders || []
  const items = (order.items || []).map((it, i) => {
    const sub = subs.find((s) => (s.items || []).some((x) => x.name === it.name)) || subs[0]
    const merchantId = it.merchantId || sub?.merchantId || null
    const price = money(it.unitPrice ?? it.price)
    const qty = Math.max(1, Number(it.quantity) || 1)
    return {
      itemId: it.itemId || `${order.id}-I${i + 1}`, lineId: it.lineId || null, name: it.name, specification: it.specification || '',
      quantity: qty, unit: it.unit || '', productRef: it.productRef || null, category: it.category || '',
      unitPrice: price, lineTotal: price == null ? null : price * qty,
      originalMerchantId: merchantId, currentMerchantId: merchantId,
      availability: 'IN_STOCK', sourcingStatus: SOURCING.AVAILABLE, sourcing: null, declinedBy: [], priceApproval: null,
      fulfilment: sub?.status === 'Delivered' ? 'DELIVERED' : sub?.status === 'Shipped' ? 'DISPATCHED' : 'PENDING', dispute: null,
      history: [entry('ASSIGNED', 'system', { to: merchantId, note: 'Imported from earlier order' })],
    }
  })
  return { ...order, items }
}

// One coordinated order: sub-orders are always derived from the items' CURRENT merchants.
export function rebuildSubOrders(order, merchants = []) {
  const prevStatus = Object.fromEntries((order.subOrders || []).map((s) => [s.merchantId, s]))
  const ids = [...new Set(order.items.filter((i) => i.currentMerchantId).map((i) => i.currentMerchantId))]
  const subOrders = ids.map((merchantId) => {
    const mine = order.items.filter((i) => i.currentMerchantId === merchantId)
    const prev = prevStatus[merchantId] || {}
    const subtotal = mine.reduce((n, i) => n + (countsAsPriced(i) ? i.unitPrice * i.quantity : 0), 0)
    return {
      ...prev,
      merchantId,
      merchantName: merchants.find((m) => m.id === merchantId)?.name || prev.merchantName || 'Marketplace merchant',
      status: prev.status && !['Rejected', 'Reassigned'].includes(prev.status) ? prev.status : 'Pending',
      items: mine.map((i) => ({ itemId: i.itemId, name: i.name, productRef: i.productRef, quantity: i.quantity, unit: i.unit, price: i.unitPrice, lineTotal: i.unitPrice == null ? null : i.unitPrice * i.quantity, sourcingStatus: i.sourcingStatus })),
      subtotal,
    }
  })
  return { ...order, subOrders, merchants: ids.length }
}

/* ------------------------------------------------------------------ pricing */

// A price counts only when it is final: priced, not awaiting the customer's approval and not rejected/unresolved.
export const countsAsPriced = (i) =>
  i.unitPrice != null && i.sourcingStatus !== SOURCING.UNRESOLVED && (!i.priceApproval || i.priceApproval.status === 'APPROVED')

export function orderTotals(order, feeRate = 0.025) {
  const items = order.items || []
  const confirmedSubtotal = items.reduce((n, i) => n + (countsAsPriced(i) ? i.unitPrice * i.quantity : 0), 0)
  const pending = items.filter((i) => i.priceApproval?.status === 'PENDING')
  const pendingApprovalAmount = pending.reduce((n, i) => n + i.unitPrice * i.quantity, 0)
  const fee = Math.round(confirmedSubtotal * feeRate)
  return {
    confirmedSubtotal, fee, deliveryFee: Number(order.deliveryFee) || 0, total: confirmedSubtotal + fee + (Number(order.deliveryFee) || 0),
    pendingApprovalAmount, pendingApprovalCount: pending.length,
    unpricedCount: items.filter((i) => i.unitPrice == null && i.sourcingStatus !== SOURCING.UNRESOLVED).length,
    unresolvedCount: items.filter((i) => i.sourcingStatus === SOURCING.UNRESOLVED).length,
    awaitingMerchantCount: items.filter((i) => i.sourcingStatus === SOURCING.AWAITING_MERCHANT).length,
  }
}

// Sets a new price. Increases (or a first price) need the customer's approval; decreases are recorded and auto-approved.
function applyPrice(item, newPrice, by, at, note) {
  const approvedBefore = item.unitPrice != null && countsAsPriced(item) ? item.unitPrice : item.priceApproval?.previousPrice ?? null
  const needsApproval = approvedBefore == null || newPrice > approvedBefore
  return {
    ...item,
    unitPrice: newPrice,
    lineTotal: newPrice * item.quantity,
    priceApproval: { status: needsApproval ? 'PENDING' : 'APPROVED', previousPrice: approvedBefore, proposedPrice: newPrice, requestedAt: at, decidedAt: needsApproval ? null : at },
    history: [...item.history, entry('PRICE_CHANGE', by, { at, from: approvedBefore, to: newPrice, note: note + (needsApproval ? ' Customer approval required.' : ' Lower than before, applied.') })],
  }
}

/* ------------------------------------------------------------------ merchant: confirm / decline */

export function confirmSourcing(order, itemId, actor, details = {}, { at = nowIso() } = {}) {
  if (!isMerchant(actor)) return fail('FORBIDDEN', 'Only the assigned merchant can confirm sourcing.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (item.currentMerchantId !== actor.merchantId) return fail('NOT_ASSIGNED', 'This item is not assigned to you.')
  if (![SOURCING.SOURCING_REQUESTED, SOURCING.REROUTED].includes(item.sourcingStatus)) return fail('INVALID_STATE', 'This item is not waiting for a sourcing decision.')
  if (details.confirmed !== true) return fail('CHECKBOX_NOT_CONFIRMED', 'Tick "I can source this product" to confirm. An unticked box is not a confirmation.')
  const price = money(details.price)
  if (!(price > 0)) return fail('PRICE_REQUIRED', 'Enter the sourcing price per unit.')
  if (!String(details.eta || '').trim()) return fail('ETA_REQUIRED', 'Enter when you expect to have it (for example "3 days").')
  if (details.finalPriceConfirmed !== true) return fail('FINAL_PRICE_NOT_CONFIRMED', 'Confirm that this is your final price.')
  let next = patchItem(order, itemId, (it) => ({
    ...it,
    sourcingStatus: SOURCING.SOURCING_CONFIRMED,
    sourcing: { confirmedAt: at, confirmedBy: actor.merchantId, price, eta: String(details.eta).trim(), supplier: String(details.supplier || '').trim(), notes: String(details.notes || '').trim(), finalPriceConfirmed: true },
    history: [...it.history, entry('SOURCING_CONFIRMED', actor.merchantId, { at, to: price, note: `Can source at ${price} per unit, expected ${String(details.eta).trim()}.` })],
  }))
  next = patchItem(next, itemId, (it) => applyPrice(it, price, actor.merchantId, at, 'Sourcing price.'))
  return { ok: true, order: next }
}

export function declineSourcing(order, itemId, actor, details = {}, ctx = {}) {
  if (!isMerchant(actor)) return fail('FORBIDDEN', 'Only the assigned merchant can decline an item.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (item.currentMerchantId !== actor.merchantId) return fail('NOT_ASSIGNED', 'This item is not assigned to you.')
  const withdrawable = details.allowAvailable === true && item.sourcingStatus === SOURCING.AVAILABLE && item.fulfilment === 'PENDING'
  if (!withdrawable && ![SOURCING.SOURCING_REQUESTED, SOURCING.REROUTED].includes(item.sourcingStatus)) return fail('INVALID_STATE', 'This item is not waiting for a sourcing decision.')
  if (details.confirmed !== true) return fail('CONFIRMATION_REQUIRED', 'Please confirm that you cannot source this product. It will be offered to another merchant.')
  const at = ctx.at || nowIso()
  const declined = patchItem(order, itemId, (it) => ({
    ...it,
    declinedBy: [...new Set([...it.declinedBy, actor.merchantId])],
    sourcingStatus: SOURCING.REASSIGNMENT_PENDING,
    history: [
      ...it.history,
      entry('SOURCING_DECLINED', actor.merchantId, { at, note: String(details.reason || 'Cannot source this product.') }),
      entry('REASSIGNMENT_PENDING', 'system', { at, from: actor.merchantId, note: 'Looking for another eligible merchant for this item only.' }),
    ],
  }))
  return rerouteItem(declined, itemId, ctx)
}

/* ------------------------------------------------------------------ rerouting */

const catTokens = (name) => nameTokens(String(name).toLowerCase().replace(/\b(merchant|materials|material|accessories|supplies|and)\b/g, ' ').replace(/[^a-z\s]/g, ' '))

// Which of the 30 merchant categories are relevant to this item? From catalogue products that match it
// (stock ignored) plus words shared with a category name. Never invents a category for an unknown material.
export function relevantCategories(item, products = []) {
  const q = { name: item.name, specs: item.specification || '' }
  const fromCatalogue = searchCatalogue(q, products.map((p) => ({ ...p, category: '' })), { useCategory: false })
  const ids = new Set([...fromCatalogue.results, ...fromCatalogue.otherSpecs.map((p) => ({ product: p }))].map((r) => r.product.id))
  const cats = new Set(products.filter((p) => ids.has(p.id)).map((p) => p.category).filter(Boolean))
  const itemTokens = new Set(nameTokens(String(item.name).toLowerCase()))
  for (const c of MERCHANT_CATEGORY_NAMES) if (catTokens(c).some((t) => itemTokens.has(t))) cats.add(c)
  if (item.category && MERCHANT_CATEGORY_NAMES.includes(item.category)) cats.add(item.category)
  return [...cats]
}

// Who gets an unavailable line when the order is placed? The best-ranked ELIGIBLE merchant (60% rule
// already applied by matching) whose categories fit the item, else the best-ranked eligible merchant.
// Returns null when nobody is eligible: the line then waits as AWAITING_MERCHANT. Never invents a merchant.
export function pickInitialAssignee(line, rankedEligibleMerchants = [], products = []) {
  if (!rankedEligibleMerchants.length) return null
  const cats = new Set(relevantCategories({ name: line.name, specification: line.specs || line.specification || '' }, products))
  return rankedEligibleMerchants.find((m) => (m.categories || []).some((c) => cats.has(c))) || rankedEligibleMerchants[0]
}

export function findRerouteCandidates(item, { merchants = [], products = [] } = {}) {
  const cats = new Set(relevantCategories(item, products))
  const q = parseQuery({ name: item.name, specs: item.specification || '' })
  return merchants
    .filter((m) => m.status === 'approved' && m.active !== false)
    .filter((m) => m.id !== item.currentMerchantId && !item.declinedBy.includes(m.id))
    .filter((m) => (m.categories || []).some((c) => cats.has(c)))
    .map((m) => {
      const stocked = products
        .filter((p) => p.merchantId === m.id && p.available !== false && Number(p.stock) >= item.quantity)
        .map((p) => ({ p, r: scoreMatch(q, p, { useCategory: false }) }))
        .filter((x) => x.r.kind === 'exact' || (x.r.kind === 'partial' && x.r.coverage >= 0.6))
        .sort((a, b) => a.p.price - b.p.price)[0]
      if (stocked) return { merchantId: m.id, merchantName: m.name, capability: 'IN_STOCK', price: Number(stocked.p.price), productRef: stocked.p.id, productName: stocked.p.name }
      if (m.acceptsSourcing === true) return { merchantId: m.id, merchantName: m.name, capability: 'SOURCING' }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => (a.capability === b.capability ? (a.price ?? 0) - (b.price ?? 0) || a.merchantName.localeCompare(b.merchantName) : a.capability === 'IN_STOCK' ? -1 : 1))
}

export function rerouteItem(order, itemId, ctx = {}) {
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (item.sourcingStatus !== SOURCING.REASSIGNMENT_PENDING) return fail('NOT_PENDING_REASSIGNMENT', 'This item is not waiting for reassignment (it cannot be rerouted twice).')
  const at = ctx.at || nowIso()
  const candidates = findRerouteCandidates(item, ctx)
  const from = item.currentMerchantId
  if (!candidates.length) {
    return {
      ok: true, rerouted: false, candidates,
      order: patchItem(order, itemId, (it) => ({
        ...it, currentMerchantId: null, sourcingStatus: SOURCING.UNRESOLVED,
        history: [...it.history, entry('NO_ELIGIBLE_MERCHANT', 'system', { at, from, note: 'No other eligible merchant with a relevant category and stock or sourcing capability. Awaiting admin sourcing.' })],
      })),
    }
  }
  const pick = candidates[0]
  let next = patchItem(order, itemId, (it) => ({
    ...it,
    currentMerchantId: pick.merchantId,
    sourcing: null,
    sourcingStatus: pick.capability === 'IN_STOCK' ? SOURCING.AVAILABLE : SOURCING.REROUTED,
    availability: pick.capability === 'IN_STOCK' ? 'IN_STOCK' : 'NOT_IN_STOCK',
    productRef: pick.productRef || null,
    matchedProductName: pick.productName || null,
    history: [...it.history, entry('REROUTED', 'system', { at, from, to: pick.merchantId, note: pick.capability === 'IN_STOCK' ? `New merchant has ${pick.productName} in stock.` : 'New merchant must confirm that they can source it. Nothing is assumed.' })],
  }))
  if (pick.capability === 'IN_STOCK') next = patchItem(next, itemId, (it) => applyPrice({ ...it, unitPrice: it.priceApproval?.status === 'APPROVED' ? it.unitPrice : null }, pick.price, pick.merchantId, at, 'Price from the new merchant.'))
  else next = patchItem(next, itemId, (it) => ({ ...it, unitPrice: it.unitPrice, lineTotal: it.lineTotal }))
  return { ok: true, rerouted: true, to: pick, candidates, order: next }
}

// Staff can place an UNRESOLVED / AWAITING item with a merchant by hand (never one who already declined it).
export function adminAssign(order, itemId, merchantId, actor, ctx = {}) {
  if (!isStaff(actor)) return fail('FORBIDDEN', 'Only Admin or Super Admin can assign an unresolved item.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (![SOURCING.UNRESOLVED, SOURCING.AWAITING_MERCHANT].includes(item.sourcingStatus)) return fail('INVALID_STATE', 'Only unresolved or awaiting items can be assigned by hand.')
  if (item.declinedBy.includes(merchantId)) return fail('ALREADY_DECLINED', 'That merchant already declined this item.')
  const merchant = (ctx.merchants || []).find((m) => m.id === merchantId)
  if (!merchant || merchant.status !== 'approved') return fail('MERCHANT_NOT_ELIGIBLE', 'Choose an approved merchant.')
  const at = ctx.at || nowIso()
  return {
    ok: true,
    order: patchItem(order, itemId, (it) => ({
      ...it, currentMerchantId: merchantId, sourcingStatus: SOURCING.SOURCING_REQUESTED, sourcing: null,
      history: [...it.history, entry('ASSIGNED', actor.name || roleOf(actor), { at, from: it.currentMerchantId, to: merchantId, note: 'Assigned by hand. Merchant must confirm sourcing.' })],
    })),
  }
}

/* ------------------------------------------------------------------ customer: price approval */

const ownsOrder = (order, actor) => !order.customerEmail || !actor?.email || order.customerEmail === actor.email
export function decidePrice(order, itemId, actor, decision, { at = nowIso() } = {}) {
  if (roleOf(actor) !== 'customer') return fail('FORBIDDEN', 'Only the customer can approve or decline a changed price.')
  if (!ownsOrder(order, actor)) return fail('FORBIDDEN', 'This is not your order.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (item.priceApproval?.status !== 'PENDING') return fail('NO_PENDING_PRICE', 'There is no price waiting for your approval.')
  if (decision === 'approve') {
    return { ok: true, order: patchItem(order, itemId, (it) => ({ ...it, priceApproval: { ...it.priceApproval, status: 'APPROVED', decidedAt: at }, history: [...it.history, entry('PRICE_APPROVED', 'customer', { at, to: it.unitPrice, note: 'Customer approved the new price.' })] })) }
  }
  return { ok: true, order: patchItem(order, itemId, (it) => ({ ...it, sourcingStatus: SOURCING.UNRESOLVED, priceApproval: { ...it.priceApproval, status: 'REJECTED', decidedAt: at }, history: [...it.history, entry('PRICE_REJECTED', 'customer', { at, from: it.unitPrice, note: 'Customer declined the proposed price. Item is unresolved and not charged.' })] })) }
}

/* ------------------------------------------------------------------ fulfilment + money (simulated) */

export const isFulfillable = (i) =>
  i.currentMerchantId && [SOURCING.AVAILABLE, SOURCING.SOURCING_CONFIRMED].includes(i.sourcingStatus) && countsAsPriced(i)

export function advanceFulfilment(order, itemId, actor, next, { at = nowIso() } = {}) {
  if (!isMerchant(actor)) return fail('FORBIDDEN', 'Only the assigned merchant can update fulfilment.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (item.currentMerchantId !== actor.merchantId) return fail('NOT_ASSIGNED', 'This item is not assigned to you.')
  if (!isFulfillable(item)) return fail('NOT_FULFILLABLE', 'This item cannot be fulfilled until sourcing is confirmed and the customer has approved the price.')
  const from = FULFILMENT.indexOf(item.fulfilment)
  const to = FULFILMENT.indexOf(next)
  if (to < 0 || to === FULFILMENT.indexOf('ACCEPTED')) return fail('INVALID_STATUS', 'Unknown status. Only the customer can accept delivery.')
  if (to !== from + 1) return fail('INVALID_TRANSITION', `Cannot go from ${item.fulfilment} to ${next}. Statuses move one step at a time.`)
  return { ok: true, order: patchItem(order, itemId, (it) => ({ ...it, fulfilment: next, history: [...it.history, entry('FULFILMENT', actor.merchantId, { at, from: item.fulfilment, to: next })] })) }
}

export function openDispute(order, itemId, actor, reason, { at = nowIso() } = {}) {
  if (roleOf(actor) !== 'customer') return fail('FORBIDDEN', 'Only the customer can report a problem.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (!['DISPATCHED', 'DELIVERED'].includes(item.fulfilment)) return fail('INVALID_STATE', 'You can report a problem once the item is dispatched or delivered.')
  if (!String(reason || '').trim()) return fail('REASON_REQUIRED', 'Describe the problem.')
  return { ok: true, order: patchItem(order, itemId, (it) => ({ ...it, dispute: { status: 'OPEN', reason: String(reason).trim(), openedAt: at, merchantId: it.currentMerchantId, heldAmount: it.unitPrice * it.quantity }, history: [...it.history, entry('DISPUTE_OPENED', 'customer', { at, note: String(reason).trim() })] })) }
}

// Customer accepts a delivered item -> THAT item is settled 95/5 to THAT merchant. Disputed items stay on hold.
export function acceptItem(order, itemId, actor, { at = nowIso() } = {}) {
  if (roleOf(actor) !== 'customer') return fail('FORBIDDEN', 'Only the customer can accept delivery.')
  if (!ownsOrder(order, actor)) return fail('FORBIDDEN', 'This is not your order.')
  const item = findItem(order, itemId)
  if (!item) return fail('NOT_FOUND', 'Item not found.')
  if (item.fulfilment !== 'DELIVERED') return fail('INVALID_STATE', 'You can accept an item once it has been delivered.')
  if (item.dispute?.status === 'OPEN') return fail('ON_HOLD', 'This item has an open problem report. Payment stays on hold until it is resolved.')
  if (!isFulfillable(item)) return fail('NOT_FULFILLABLE', 'This item has no approved price.')
  const s = split(item.unitPrice * item.quantity)
  const ledger = [...(order.ledger || []), { id: `${itemId}-SETTLE`, type: 'SETTLEMENT', itemId, merchantId: item.currentMerchantId, ...s, at, simulated: true }]
  const next = patchItem({ ...order, ledger }, itemId, (it) => ({ ...it, fulfilment: 'ACCEPTED', history: [...it.history, entry('ACCEPTED', 'customer', { at, note: `Settled ${s.merchantShare} to merchant, ${s.commission} commission (simulation).` })] }))
  return { ok: true, order: next, settlement: ledger.at(-1) }
}

export function resolveDispute(order, itemId, actor, outcome, { at = nowIso() } = {}) {
  if (!isStaff(actor)) return fail('FORBIDDEN', 'Only Admin or Super Admin can resolve a dispute.')
  const item = findItem(order, itemId)
  if (item?.dispute?.status !== 'OPEN') return fail('NO_OPEN_DISPUTE', 'There is no open dispute for this item.')
  if (outcome === 'refund') {
    const refund = { id: `${itemId}-REFUND`, type: 'REFUND', itemId, merchantId: item.currentMerchantId, gross: item.unitPrice * item.quantity, merchantShare: 0, commission: 0, at, simulated: true }
    return { ok: true, order: patchItem({ ...order, ledger: [...(order.ledger || []), refund] }, itemId, (it) => ({ ...it, dispute: { ...it.dispute, status: 'REFUNDED', resolvedAt: at }, history: [...it.history, entry('DISPUTE_REFUNDED', roleOf(actor), { at })] })) }
  }
  return { ok: true, order: patchItem(order, itemId, (it) => ({ ...it, dispute: { ...it.dispute, status: 'RELEASED', resolvedAt: at }, history: [...it.history, entry('DISPUTE_RELEASED', roleOf(actor), { at, note: 'Hold released. Customer can now accept.' })] })) }
}

// Money view per merchant: never mixes one merchant's items into another's balance.
export function merchantAllocations(order) {
  const out = {}
  const row = (id) => (out[id] ||= { merchantId: id, settled: { gross: 0, merchantShare: 0, commission: 0 }, pending: { gross: 0, merchantShare: 0, commission: 0 }, held: { gross: 0 }, refunded: 0 })
  for (const l of order.ledger || []) {
    const r = row(l.merchantId)
    if (l.type === 'SETTLEMENT') { r.settled.gross += l.gross; r.settled.merchantShare += l.merchantShare; r.settled.commission += l.commission }
    if (l.type === 'REFUND') r.refunded += l.gross
  }
  for (const i of order.items || []) {
    if (!i.currentMerchantId || !countsAsPriced(i) || ['ACCEPTED'].includes(i.fulfilment)) continue
    const r = row(i.currentMerchantId)
    const gross = i.unitPrice * i.quantity
    if (i.dispute?.status === 'OPEN') { r.held.gross += gross; continue }
    if (i.dispute?.status === 'REFUNDED') continue
    const s = split(gross)
    r.pending.gross += s.gross; r.pending.merchantShare += s.merchantShare; r.pending.commission += s.commission
  }
  return Object.values(out)
}

/* ------------------------------------------------------------------ views (role isolation) */

// What a merchant may see: items currently assigned to them + items that used to be theirs (read-only).
export function itemsForMerchant(order, merchantId) {
  const items = order.items || []
  const current = items.filter((i) => i.currentMerchantId === merchantId)
  const former = items.filter((i) => i.currentMerchantId !== merchantId && i.history.some((h) => h.to === merchantId && ['ASSIGNED', 'REROUTED'].includes(h.type)))
    .map((i) => ({ itemId: i.itemId, name: i.name, specification: i.specification, quantity: i.quantity, unit: i.unit, status: 'No longer assigned to you', history: i.history.filter((h) => h.by === merchantId || h.to === merchantId || h.from === merchantId) }))
  return { current, former }
}
