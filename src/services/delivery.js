// Delivery methods and fees (PROTOTYPE rate card: replace with merchant / WakaRider quotes from the backend).
export const DELIVERY_METHODS = [
  { id: 'merchant_delivery', label: 'Merchant delivery', blurb: 'The merchant delivers to your address.' },
  { id: 'customer_collection', label: 'Pickup from merchant', blurb: 'Collect from the merchant store. No delivery fee.' },
  { id: 'wakarider', label: 'WakaRider', blurb: 'WakaRider collects and delivers. Same city or state only.' },
]
export const DEFAULT_RATE_CARD = {
  merchant: { sameCity: 3500, sameState: 6000, otherState: 12000 },
  wakarider: { sameCity: 2500, sameState: 5500, otherState: null }, // null = not offered
  extraMerchantStop: 1500, // each additional merchant the order is collected from
}
const ALIAS = { fct: 'abuja', 'federal capital territory': 'abuja', 'abuja fct': 'abuja' }
export const normPlace = (s = '') => {
  const t = String(s).toLowerCase().replace(/\bstate\b/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  return ALIAS[t] || t
}
const mentions = (haystack, needle) => { const n = normPlace(needle); return Boolean(n) && normPlace(haystack).includes(n) }

// Worst (furthest) zone across all merchants the order is collected from.
export function zoneFor(address = {}, merchants = []) {
  const rank = { sameCity: 0, sameState: 1, otherState: 2 }
  let worst = 'sameCity'
  for (const m of merchants) {
    const where = `${m.address || ''} ${m.city || ''} ${m.state || ''}`
    let z = 'otherState'
    if (mentions(where, address.city)) z = 'sameCity'
    else if (mentions(where, address.state) || (normPlace(address.state) === 'abuja' && /abuja|fct/i.test(where))) z = 'sameState'
    if (rank[z] > rank[worst]) worst = z
  }
  return worst
}

export function quoteDelivery({ method: rawMethod = 'merchant_delivery', address = {}, merchants = [], rateCard = DEFAULT_RATE_CARD } = {}) {
  const method = rawMethod === 'merchant_delivery' ? 'merchant' : rawMethod === 'customer_collection' ? 'pickup' : rawMethod
  const stops = Math.max(1, merchants.length)
  if (method === 'pickup') return { method, available: true, fee: 0, zone: null, stops, note: 'Collect from each merchant store.' }
  if (!address.city || !address.state) return { method, available: false, fee: 0, zone: null, stops, note: 'Enter your city and state to see the delivery fee.' }
  const zone = zoneFor(address, merchants)
  const base = rateCard[method]?.[zone]
  if (base == null) return { method, available: false, fee: 0, zone, stops, note: `${method === 'wakarider' ? 'WakaRider' : 'This method'} does not serve this distance. Choose merchant delivery.` }
  const fee = base + (stops - 1) * (rateCard.extraMerchantStop || 0)
  return { method, available: true, fee, zone, stops, note: `${zone === 'sameCity' ? 'Same city' : zone === 'sameState' ? 'Same state' : 'Other state'} rate${stops > 1 ? `, ${stops} merchant stops` : ''}. Demo rate card.` }
}
