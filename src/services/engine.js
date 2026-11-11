// WakaStore order engine: pure actions (state, input) -> { state, ok, error?, ...result }.
// No React. The UI store just calls these and persists the returned state.
import { matchQuotation, groupSelectionByMerchant } from './matching.js'

const ADMIN_ROLES = ['admin', 'super-admin']
const now = () => new Date().toISOString()
const clone = (s) => structuredClone(s)
const id = (d, p) => `${p}-${++d.seq}`
const fail = (state, error) => ({ state, ok: false, error })
const actor = (d, userId) => d.users.find((u) => u.id === userId)

export const walletBalance = (s, customerId) =>
  s.wallet.filter((t) => t.customerId === customerId && t.status === 'success').reduce((n, t) => n + (t.type === 'credit' ? t.amount : -t.amount), 0)

export const calcTotals = (s, groups) => {
  const subtotal = groups.reduce((n, g) => n + g.items.reduce((m, i) => m + i.quantity * i.unitPrice, 0), 0)
  const fee = Math.round(subtotal * s.settings.feeRate)
  return { subtotal, fee, total: subtotal + fee }
}

function notify(d, { userId, roles, title, message, type, ref, route }) {
  const targets = userId ? [userId] : d.users.filter((u) => roles.includes(u.role)).map((u) => u.id)
  targets.forEach((uid) => d.notifications.unshift({ id: id(d, 'n'), userId: uid, title, message, type, ref, route, createdAt: now(), read: false }))
}
const notifyMerchant = (d, merchantId, o) => { const u = d.users.find((x) => x.merchantId === merchantId); if (u) notify(d, { userId: u.id, ...o }) }
const log = (d, userId, action, entity, details) => { const u = actor(d, userId); d.audit.unshift({ id: id(d, 'AUD'), actorId: userId, actor: u?.name || 'System', role: u?.role || 'system', action, entity, details, date: now() }) }
const timeline = (o, by, event) => o.timeline.push({ at: now(), by, event })

const DEAD = ['Rejected', 'Reassigned', 'Cancelled']
export function deriveOrderStatus(s, order) {
  const pay = s.payments.find((p) => p.id === order.paymentId)
  if (!pay || pay.status !== 'success') return 'Payment pending'
  const live = s.subOrders.filter((x) => x.orderId === order.id && !DEAD.includes(x.status))
  if (!live.length) return s.subOrders.some((x) => x.orderId === order.id && x.status === 'Cancelled') && !s.sourcing.some((c) => c.orderId === order.id && c.status !== 'Resolved') ? 'Cancelled' : 'Awaiting merchant confirmation'
  const all = (list) => live.every((x) => list.includes(x.status))
  if (all(['Completed'])) return order.refundedTotal ? 'Partially refunded' : 'Completed'
  if (all(['Delivered', 'Completed'])) return 'Delivered'
  if (live.some((x) => ['Delivered', 'Completed'].includes(x.status))) return 'Partially delivered'
  if (all(['Awaiting acceptance'])) return 'Confirmed'
  if (live.some((x) => x.status === 'Awaiting acceptance')) return 'Partially accepted'
  if (all(['Ready for dispatch', 'Dispatched'])) return 'Ready for delivery'
  return 'Processing'
}
const refresh = (d, orderId) => { const o = d.orders.find((x) => x.id === orderId); if (o) o.status = deriveOrderStatus(d, o) }

/* ---------- Wallet ---------- */
export function fundWallet(state, { customerId, amount, method = 'card', simulate = 'success' }) {
  if (!(amount > 0)) return fail(state, 'INVALID_AMOUNT')
  const d = clone(state)
  const tx = { id: id(d, 'tx'), customerId, type: 'credit', kind: 'funding', amount, method, ref: `DEMO-FUND-${d.seq}`, date: now(), status: simulate === 'success' ? 'success' : 'failed' }
  d.wallet.push(tx)
  notify(d, { userId: customerId, title: tx.status === 'success' ? 'Wallet funded (demo)' : 'Funding failed (demo)', message: `₦${amount.toLocaleString()} via ${method}`, type: 'wallet', route: '/client/wallet' })
  return { state: d, ok: tx.status === 'success', tx, error: tx.status === 'success' ? undefined : 'FUNDING_FAILED' }
}

/* ---------- Quotation ---------- */
export function submitQuotation(state, { customerId, name, lines }) {
  const clean = (lines || []).filter((l) => l.name?.trim())
  if (!clean.length) return fail(state, 'EMPTY_QUOTATION')
  if (clean.some((l) => !(Number(l.quantity) > 0))) return fail(state, 'INVALID_QUANTITY')
  const d = clone(state)
  const items = clean.map((l, i) => ({ ...l, id: l.id || `line-${i + 1}`, quantity: Number(l.quantity) }))
  const match = matchQuotation(items, d.merchants, d.products, d.settings.threshold)
  const q = { id: id(d, 'QT'), customerId, name: name || 'Untitled quotation', items, createdAt: now(),
    status: match.quotationNeedsSourcing ? 'Needs sourcing' : 'Awaiting customer selection',
    matchSnapshot: match.results.map((r) => ({ merchantId: r.merchant.id, percentage: r.percentage, eligible: r.eligible })) }
  d.quotations.unshift(q)
  notify(d, { userId: customerId, title: 'Quotation submitted', message: `${q.id}: ${match.eligible.length} eligible merchant(s) found`, type: 'quotation', ref: q.id, route: `/client/quotations/${q.id}` })
  notify(d, { roles: ADMIN_ROLES, title: 'New quotation', message: `${q.id} with ${items.length} lines`, type: 'quotation', ref: q.id, route: '/admin/quotations' })
  if (match.quotationNeedsSourcing) {
    const c = { id: id(d, 'SRC'), quotationId: q.id, customerId, items: items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, specs: i.specs })), reason: 'No merchant reached the matching threshold', status: 'Open', notes: [], createdAt: now() }
    d.sourcing.unshift(c)
    notify(d, { roles: ['super-admin'], title: 'Sourcing case', message: `${c.id} needs manual sourcing`, type: 'sourcing', ref: c.id, route: '/admin/sourcing' })
  }
  return { state: d, ok: true, quotation: q, match }
}

/* ---------- Checkout ---------- */
// groups: [{ merchantId, items:[{ productId, name, unit, quantity, unitPrice }] }]  (from groupSelectionByMerchant or cart)
export function checkout(state, { customerId, groups, paymentMethod, simulate = 'success', idempotencyKey, address, quotationId }) {
  if (idempotencyKey && state.idem[idempotencyKey]) return { state, ok: state.idem[idempotencyKey].ok, duplicate: true, ...state.idem[idempotencyKey] }
  if (!groups?.length || !address) return fail(state, 'INCOMPLETE_CHECKOUT')
  const d = clone(state)
  const { subtotal, fee, total } = calcTotals(d, groups)
  for (const g of groups) for (const it of g.items) {
    const p = d.products.find((x) => x.id === it.productId)
    if (!p || !p.available || p.stock < it.quantity) return fail(state, `OUT_OF_STOCK:${it.name}`)
  }
  const pay = { id: id(d, 'PAY'), ref: `DEMO-PAY-${d.seq}`, customerId, method: paymentMethod, amount: total, status: 'pending', quotationId, createdAt: now() }
  d.payments.unshift(pay)
  const done = (r) => { if (idempotencyKey) d.idem[idempotencyKey] = { ok: r.ok, error: r.error, orderId: r.orderId, receiptId: r.receiptId }; return { state: d, ...r } }

  if (paymentMethod === 'wallet' && walletBalance(d, customerId) < total) {
    pay.status = 'failed'; pay.failure = 'INSUFFICIENT_BALANCE'
    notify(d, { userId: customerId, title: 'Payment failed', message: 'Insufficient demo wallet balance', type: 'payment', route: '/client/wallet' })
    return done({ ok: false, error: 'INSUFFICIENT_BALANCE' })
  }
  if (simulate !== 'success') {
    pay.status = 'failed'; pay.failure = 'SIMULATED_DECLINE'
    notify(d, { userId: customerId, title: 'Payment failed (demo)', message: `${paymentMethod} payment was declined`, type: 'payment', route: '/client/checkout' })
    notify(d, { roles: ADMIN_ROLES, title: 'Failed payment', message: `${pay.ref} (${paymentMethod})`, type: 'payment', ref: pay.id, route: '/admin/payments' })
    return done({ ok: false, error: 'PAYMENT_FAILED' })
  }
  pay.status = 'success'
  const order = { id: id(d, 'ORD'), ref: `WK-${d.seq}`, customerId, quotationId, paymentId: pay.id, paymentRef: pay.ref, subtotal, fee, total, address, createdAt: now(), refundedTotal: 0, status: 'Confirmed', timeline: [] }
  timeline(order, 'System', 'Payment successful'); timeline(order, 'System', 'Order created')
  d.orders.unshift(order)
  groups.forEach((g) => {
    g.items.forEach((it) => { d.products.find((p) => p.id === it.productId).stock -= it.quantity })
    const sub = { id: id(d, 'SUB'), orderId: order.id, merchantId: g.merchantId, status: 'Awaiting acceptance', items: g.items.map((i) => ({ ...i, lineTotal: i.quantity * i.unitPrice })), subtotal: g.items.reduce((n, i) => n + i.quantity * i.unitPrice, 0), timeline: [] }
    timeline(sub, 'System', 'Assigned to merchant'); d.subOrders.push(sub)
    notifyMerchant(d, g.merchantId, { title: 'New order', message: `${order.ref}: ${sub.items.length} item(s)`, type: 'order', ref: sub.id, route: '/merchant/orders' })
  })
  if (paymentMethod === 'wallet') d.wallet.push({ id: id(d, 'tx'), customerId, type: 'debit', kind: 'payment', amount: total, ref: pay.ref, orderId: order.id, date: now(), status: 'success' })
  const receipt = { id: id(d, 'RCP'), number: `RCP-${d.seq}`, orderId: order.id, paymentId: pay.id, createdAt: now(), disclaimer: 'Prototype receipt — payment is simulated and no real funds were transferred.' }
  d.receipts.push(receipt)
  const q = d.quotations.find((x) => x.id === quotationId); if (q) { q.status = 'Converted to order'; q.orderId = order.id }
  refresh(d, order.id)
  notify(d, { userId: customerId, title: 'Order placed', message: `${order.ref} · ₦${total.toLocaleString()} (demo)`, type: 'order', ref: order.id, route: `/client/orders/${order.id}` })
  notify(d, { roles: ADMIN_ROLES, title: 'New order', message: `${order.ref} across ${groups.length} merchant(s)`, type: 'order', ref: order.id, route: '/admin/orders' })
  return done({ ok: true, orderId: order.id, receiptId: receipt.id })
}

/* ---------- Merchant fulfilment ---------- */
const NEXT = { Accepted: ['Preparing'], Preparing: ['Ready for dispatch'], 'Ready for dispatch': ['Dispatched'], Dispatched: ['Delivered'] }

export function merchantRespond(state, { subId, merchantId, action, reason }) {
  const sub = state.subOrders.find((x) => x.id === subId)
  if (!sub || sub.merchantId !== merchantId) return fail(state, 'FORBIDDEN')
  if (sub.status !== 'Awaiting acceptance') return fail(state, 'INVALID_STATE')
  const d = clone(state); const s = d.subOrders.find((x) => x.id === subId); const order = d.orders.find((x) => x.id === s.orderId)
  const mName = d.merchants.find((m) => m.id === merchantId).name
  if (action === 'accept') {
    s.status = 'Accepted'; timeline(s, mName, 'Accepted'); timeline(order, mName, 'Merchant accepted')
    notify(d, { userId: order.customerId, title: 'Merchant accepted', message: `${mName} accepted ${order.ref}`, type: 'order', ref: order.id, route: `/client/orders/${order.id}` })
    refresh(d, order.id); return { state: d, ok: true }
  }
  if (!reason?.trim()) return fail(state, 'REASON_REQUIRED')
  s.status = 'Rejected'; s.rejectionReason = reason.trim(); timeline(s, mName, `Rejected: ${reason.trim()}`); timeline(order, mName, 'Merchant rejected a sub-order')
  s.items.forEach((it) => { d.products.find((p) => p.id === it.productId).stock += it.quantity }) // release reservation
  notify(d, { roles: ADMIN_ROLES, title: 'Merchant rejected order', message: `${mName} · ${order.ref}: ${reason.trim()}`, type: 'order', ref: s.id, route: '/admin/orders' })

  const moved = {}; const orphans = []
  const others = d.merchants.filter((m) => m.id !== merchantId)
  s.items.forEach((it) => {
    const line = { id: it.productId, name: it.name, quantity: it.quantity, unit: it.unit }
    // approved merchants only (matchQuotation filters), full quantity in stock, cheapest wins
    const best = matchQuotation([line], others, d.products, 0).results
      .filter((r) => r.matched.length && !r.matched[0].partial)
      .sort((x, y) => x.matched[0].unitPrice - y.matched[0].unitPrice)[0]
    if (!best) return orphans.push(it)
    const pick = best.matched[0]
    ;(moved[best.merchant.id] ||= []).push({ productId: pick.product.id, name: pick.product.name, unit: pick.product.unit, quantity: it.quantity, unitPrice: pick.unitPrice, lineTotal: it.quantity * pick.unitPrice })
  })
  Object.entries(moved).forEach(([mid, items]) => {
    items.forEach((i) => { d.products.find((p) => p.id === i.productId).stock -= i.quantity })
    const sub2 = { id: id(d, 'SUB'), orderId: order.id, merchantId: mid, status: 'Awaiting acceptance', items, subtotal: items.reduce((n, i) => n + i.lineTotal, 0), reassignedFrom: s.id, timeline: [] }
    timeline(sub2, 'System', `Reassigned from ${mName}`); d.subOrders.push(sub2)
    notifyMerchant(d, mid, { title: 'Reassigned order', message: `${order.ref}: ${items.length} item(s)`, type: 'order', ref: sub2.id, route: '/merchant/orders' })
    timeline(order, 'System', `Reassigned to ${d.merchants.find((m) => m.id === mid).name}`)
  })
  if (Object.keys(moved).length) notify(d, { userId: order.customerId, title: 'Items reassigned', message: `${order.ref}: another merchant will fulfil the rejected items`, type: 'order', ref: order.id, route: `/client/orders/${order.id}` })
  if (orphans.length) {
    const c = { id: id(d, 'SRC'), orderId: order.id, subOrderId: s.id, customerId: order.customerId, items: orphans.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })), reason: `Rejected by ${mName}; no eligible merchant with stock`, status: 'Open', notes: [], createdAt: now() }
    d.sourcing.unshift(c)
    notify(d, { roles: ['super-admin'], title: 'Sourcing case', message: `${c.id}: ${orphans.length} item(s) for ${order.ref}`, type: 'sourcing', ref: c.id, route: '/admin/sourcing' })
    notify(d, { userId: order.customerId, title: 'Sourcing in progress', message: `We are sourcing ${orphans.length} item(s) for ${order.ref}; the rest of your order is unaffected`, type: 'order', ref: order.id, route: `/client/orders/${order.id}` })
  }
  refresh(d, order.id)
  return { state: d, ok: true, reassigned: Object.keys(moved), sourcingItems: orphans.length }
}

export function advanceSubOrder(state, { subId, merchantId, status, tracking }) {
  const sub = state.subOrders.find((x) => x.id === subId)
  if (!sub || sub.merchantId !== merchantId) return fail(state, 'FORBIDDEN')
  if (!(NEXT[sub.status] || []).includes(status)) return fail(state, 'INVALID_TRANSITION')
  const d = clone(state); const s = d.subOrders.find((x) => x.id === subId); const order = d.orders.find((x) => x.id === s.orderId)
  s.status = status; if (status === 'Dispatched') s.tracking = tracking || `DEMO-TRK-${d.seq}`
  timeline(s, 'Merchant', status); timeline(order, d.merchants.find((m) => m.id === merchantId).name, status)
  notify(d, { userId: order.customerId, title: `Order update: ${status}`, message: `${order.ref} · ${d.merchants.find((m) => m.id === merchantId).name}`, type: 'delivery', ref: order.id, route: `/client/orders/${order.id}` })
  refresh(d, order.id); return { state: d, ok: true }
}

export function confirmReceipt(state, { subId, customerId }) {
  const sub = state.subOrders.find((x) => x.id === subId); const order = sub && state.orders.find((o) => o.id === sub.orderId)
  if (!order || order.customerId !== customerId || sub.status !== 'Delivered') return fail(state, 'INVALID_STATE')
  const d = clone(state); d.subOrders.find((x) => x.id === subId).status = 'Completed'; refresh(d, order.id); return { state: d, ok: true }
}

/* ---------- Refunds ---------- */
export function requestRefund(state, { customerId, subId, items, reason, details }) {
  const sub = state.subOrders.find((x) => x.id === subId); const order = sub && state.orders.find((o) => o.id === sub.orderId)
  if (!order || order.customerId !== customerId) return fail(state, 'FORBIDDEN')
  if (!['Dispatched', 'Delivered', 'Completed'].includes(sub.status)) return fail(state, 'NOT_ELIGIBLE')
  if (!reason?.trim() || !items?.length) return fail(state, 'INCOMPLETE')
  const d = clone(state); let amount = 0
  const lines = items.map((r) => { const it = sub.items.find((i) => i.productId === r.productId); const q = Math.min(r.quantity, it.quantity); amount += q * it.unitPrice; return { productId: it.productId, name: it.name, quantity: q, unitPrice: it.unitPrice } })
  const rf = { id: id(d, 'RF'), orderId: order.id, subOrderId: subId, merchantId: sub.merchantId, customerId, items: lines, amount, reason, details, status: 'Submitted', createdAt: now() }
  d.refunds.unshift(rf)
  notify(d, { roles: ADMIN_ROLES, title: 'Refund request', message: `${rf.id} · ${order.ref} · ₦${amount.toLocaleString()}`, type: 'refund', ref: rf.id, route: '/admin/refunds' })
  notify(d, { userId: customerId, title: 'Refund submitted', message: rf.id, type: 'refund', ref: rf.id, route: '/client/orders' })
  return { state: d, ok: true, refund: rf }
}

export function decideRefund(state, { actorId, refundId, decision, reason }) {
  const a = actor(state, actorId); if (!a || !ADMIN_ROLES.includes(a.role)) return fail(state, 'FORBIDDEN')
  const rf = state.refunds.find((r) => r.id === refundId); if (!rf) return fail(state, 'NOT_FOUND')
  const d = clone(state); const r = d.refunds.find((x) => x.id === refundId)
  if (decision === 'reject') { if (!reason?.trim()) return fail(state, 'REASON_REQUIRED'); r.status = 'Rejected'; r.decisionReason = reason }
  else if (decision === 'approve' && ['Submitted', 'Under review'].includes(r.status)) r.status = 'Approved'
  else if (decision === 'process' && r.status === 'Approved' && !r.walletTxId) {
    const tx = { id: id(d, 'tx'), customerId: r.customerId, type: 'credit', kind: 'refund', amount: r.amount, ref: `DEMO-RF-${d.seq}`, orderId: r.orderId, refundId: r.id, date: now(), status: 'success' }
    d.wallet.push(tx); r.walletTxId = tx.id; r.status = 'Refunded'
    const o = d.orders.find((x) => x.id === r.orderId); o.refundedTotal += r.amount; timeline(o, a.name, `Refund ${r.id} processed`); refresh(d, o.id)
  } else return fail(state, 'INVALID_STATE')
  log(d, actorId, `Refund ${r.status.toLowerCase()}`, r.id, reason || '')
  notify(d, { userId: r.customerId, title: `Refund ${r.status.toLowerCase()}`, message: `${r.id}${reason ? ': ' + reason : ''}`, type: 'refund', ref: r.id, route: '/client/wallet' })
  return { state: d, ok: true }
}

/* ---------- Admin ---------- */
export const addWorkingDays = (from, n, holidays = []) => { const x = new Date(from); while (n > 0) { x.setDate(x.getDate() + 1); const day = x.getDay(); if (day !== 0 && day !== 6 && !holidays.includes(x.toISOString().slice(0, 10))) n-- } return x.toISOString() }

export function reviewMerchant(state, { actorId, merchantId, decision, reason }) {
  const a = actor(state, actorId); if (!a || !ADMIN_ROLES.includes(a.role)) return fail(state, 'FORBIDDEN')
  if (['reject', 'suspend'].includes(decision) && !reason?.trim()) return fail(state, 'REASON_REQUIRED')
  const d = clone(state); const m = d.merchants.find((x) => x.id === merchantId); if (!m) return fail(state, 'NOT_FOUND')
  const map = { approve: 'approved', reject: 'rejected', suspend: 'suspended', reactivate: 'approved' }
  m.status = map[decision]; m.statusReason = reason || ''
  if (decision === 'reject') m.canResubmitAfter = addWorkingDays(new Date(), d.settings.resubmitWorkingDays, d.settings.holidays)
  log(d, actorId, `Merchant ${m.status}`, m.name, reason || '')
  notifyMerchant(d, m.id, { title: `Application ${m.status}`, message: reason || 'Your status was updated', type: 'merchant', route: '/merchant/overview' })
  return { state: d, ok: true }
}

export function removeProduct(state, { actorId, productId, reason }) {
  const a = actor(state, actorId); if (!a || !ADMIN_ROLES.includes(a.role)) return fail(state, 'FORBIDDEN')
  if (!reason?.trim()) return fail(state, 'REASON_REQUIRED')
  const p = state.products.find((x) => x.id === productId); if (!p) return fail(state, 'NOT_FOUND')
  const d = clone(state); d.products = d.products.filter((x) => x.id !== productId)
  log(d, actorId, 'Product removed', p.name, reason)
  notifyMerchant(d, p.merchantId, { title: 'Product removed by admin', message: `${p.name}: ${reason}`, type: 'moderation', route: '/merchant/products' })
  return { state: d, ok: true }
}

export const markRead = (state, userId, notifId) => { const d = clone(state); d.notifications.forEach((n) => { if (n.userId === userId && (!notifId || n.id === notifId)) n.read = true }); return { state: d, ok: true } }
export const notificationsFor = (s, userId) => s.notifications.filter((n) => n.userId === userId)
export const subOrdersForMerchant = (s, merchantId) => s.subOrders.filter((x) => x.merchantId === merchantId)
export { groupSelectionByMerchant }

/* ---------- Generic admin / super-admin action (role-checked, audited) ---------- */
export function adminAction(state, { actorId, superOnly, action, entity, details, apply }) {
  const a = actor(state, actorId)
  if (!a || !(superOnly ? a.role === 'super-admin' : ADMIN_ROLES.includes(a.role))) return fail(state, 'FORBIDDEN')
  const d = clone(state)
  apply(d, { notify: (o) => notify(d, o), id: (p) => id(d, p) })
  log(d, actorId, action, entity, details || '')
  return { state: d, ok: true }
}
