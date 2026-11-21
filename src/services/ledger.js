// One view of "who is owed what" across both order models:
//  - quotation orders (fullOrderRequired): a single merchant, order-level settlement state
//  - cart / item-level orders: per-item acceptance, split 95/5 per accepted item
import { merchantAllocations } from './sourcing.js'

const blank = (merchantId) => ({ merchantId, settled: { gross: 0, merchantShare: 0, commission: 0 }, pending: { gross: 0, merchantShare: 0, commission: 0 }, held: { gross: 0 }, refunded: 0, underReview: false })

export function moneyByMerchant(order) {
  if (!order || order.status === 'Cancelled') return []
  if (order.fullOrderRequired) {
    const row = blank(order.merchantId)
    const materials = Number(order.subtotal) || 0
    const commission = Number(order.platformCommission ?? order.wakastoreFee) || 0
    const proceeds = Number(order.merchantProceeds) || (materials - commission + (Number(order.deliveryFee) || 0))
    const bucket = order.settlementStatus === 'SETTLED' ? row.settled : row.pending
    bucket.gross = materials; bucket.merchantShare = proceeds; bucket.commission = commission
    row.underReview = order.adminReviewStatus === 'UNDER_REVIEW'
    return [row]
  }
  return merchantAllocations(order)
}
