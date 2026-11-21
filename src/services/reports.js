// Marketplace reports for the admin: KPIs, merchant ranking, response times, category coverage.
import { categories } from '../constants/categories.js'
import { moneyByMerchant } from './ledger.js'
const HOUR = 3600e3
const ms = (iso) => { const t = Date.parse(iso); return Number.isFinite(t) ? t : null }
const isDone = (o) => ['Completed'].includes(o.status) || o.customerAcceptanceStatus === 'ACCEPTED' || Boolean(o.items?.length && o.items.every((i) => i.fulfilment === 'ACCEPTED'))
const disputed = (o) => o.adminReviewStatus === 'UNDER_REVIEW' || o.status === 'Disputed' || (o.items || []).some((i) => i.dispute)

export function computeReports(state) {
  const merchants = state.merchants || [], orders = state.orders || [], quotations = state.quotations || [], quotes = state.merchantQuotes || []
  const byId = Object.fromEntries(quotations.map((q) => [q.id, q]))
  const responseHours = quotes.map((m) => { const a = ms(byId[m.quotationId]?.createdAt), b = ms(m.submittedAt); return a != null && b != null ? Math.max(0, (b - a) / HOUR) : null }).filter((x) => x != null)
  const avg = (xs) => xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null
  const money = orders.flatMap((o) => moneyByMerchant(o))
  const gmv = orders.filter((o) => o.status !== 'Cancelled').reduce((n, o) => n + Number(o.subtotal || 0), 0)
  const commissionEarned = money.reduce((n, a) => n + a.settled.commission, 0)
  const kpis = {
    merchantsTotal: merchants.length,
    merchantsApproved: merchants.filter((m) => m.status === 'approved').length,
    merchantsActive: merchants.filter((m) => m.status === 'approved' && m.active !== false).length,
    requests: quotations.length,
    requestsMatched: quotations.filter((q) => (q.matchedMerchants || []).length > 0).length,
    avgResponseHours: avg(responseHours),
    ordersCompleted: orders.filter(isDone).length,
    ordersDisputed: orders.filter(disputed).length,
    ordersFailed: orders.filter((o) => o.status === 'Cancelled').length,
    gmv, commissionEarned,
  }
  const ranking = merchants.filter((m) => m.status === 'approved').map((m) => {
    const invited = quotations.filter((q) => (q.matchedMerchants || []).includes(m.name))
    const mine = quotes.filter((x) => x.merchantId === m.id)
    const hrs = mine.map((x) => { const a = ms(byId[x.quotationId]?.createdAt), b = ms(x.submittedAt); return a != null && b != null ? Math.max(0, (b - a) / HOUR) : null }).filter((x) => x != null)
    const mOrders = orders.filter((o) => (o.items || []).some((i) => i.currentMerchantId === m.id) || (o.subOrders || []).some((s) => s.merchantId === m.id))
    const disputes = mOrders.filter(disputed).length
    const responseRate = invited.length ? Math.min(1, mine.length / invited.length) : null
    const avgHrs = avg(hrs)
    const speed = avgHrs == null ? null : 1 - Math.min(avgHrs / 24, 1)
    const clean = mOrders.length ? 1 - disputes / mOrders.length : null
    const parts = [[responseRate, 0.4], [speed, 0.3], [clean, 0.3]].filter(([v]) => v != null)
    const w = parts.reduce((n, [, x]) => n + x, 0)
    const score = w ? Math.round(parts.reduce((n, [v, x]) => n + v * x, 0) / w * 100) : null
    return { merchantId: m.id, name: m.name, invited: invited.length, quoted: mine.length, responseRate, avgResponseHours: avgHrs, orders: mOrders.length, disputes, score }
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const coverage = categories.map((c) => ({
    name: c.name,
    merchants: merchants.filter((m) => m.status === 'approved' && m.active !== false && (m.categories || []).includes(c.name)).length,
    inStock: (state.products || []).filter((p) => p.category === c.name && p.available !== false && p.stock > 0).length,
  }))
  return { kpis, ranking, coverage }
}
