// Extra demo inventory so quotation matching is testable (80% / 60% / 40%), plus merchant logins.
// Merged into saved state by id, so existing localStorage data is kept.
import { CATEGORY_MERCHANTS, CATEGORY_PRODUCTS } from './categoryProducts.js'

const mergeById = (a = [], b = []) => [...a, ...b.filter((x) => !a.some((y) => y.id === x.id))]

const EXTRA_MERCHANTS = [{ id: 'm-106', name: 'ColourCraft Store', status: 'approved', contact: '+234 801 000 0006', address: 'Wuse II, Abuja', description: 'Paints, tiles, doors and finishes.', categories: ['Paint Merchant', 'Tiles Merchant', 'Doors, Locks & Hardware Merchant'], approvedAt: '2026-10-06', rejectionReason: '' }]
const MERCHANT_USERS = [
  { id: 'mu-1', merchantId: 'm-101', name: 'BuildRight Supplies', email: 'merchant@waka.test', password: 'waka123' },
  { id: 'mu-2', merchantId: 'm-103', name: 'Prime Plumbing Hub', email: 'pending@waka.test', password: 'waka123' },
  { id: 'mu-3', merchantId: 'm-104', name: 'Tile District', email: 'rejected@waka.test', password: 'waka123' },
  { id: 'mu-4', merchantId: 'm-102', name: 'PowerHouse Electrical', email: 'powerhouse@waka.test', password: 'waka123' },
  { id: 'mu-5', merchantId: 'm-106', name: 'ColourCraft Store', email: 'colourcraft@waka.test', password: 'waka123' }
]
// id, merchantId, merchant, name, category, unit, price, stock
const ROWS = [
  ['x-101', 'm-101', 'BuildRight Supplies', 'Longspan Roofing Sheet', 'Roofing Materials & Accessories Merchant', 'sheet', 18500, 60],
  ['x-102', 'm-101', 'BuildRight Supplies', 'Tile Adhesive 25kg', 'Tile Adhesive & Grout Merchant', 'bag', 6500, 120],
  ['x-103', 'm-101', 'BuildRight Supplies', 'Binding Wire', 'Iron Rods & Reinforcement Materials Merchant', 'roll', 22000, 40],
  ['x-104', 'm-101', 'BuildRight Supplies', '2.5mm Single Core Cable', 'Electrical Materials Merchant', 'roll', 48500, 30],
  ['x-105', 'm-101', 'BuildRight Supplies', 'PVC Pressure Pipe 4in', 'Plumbing Materials Merchant', 'piece', 7400, 60],
  ['x-106', 'm-101', 'BuildRight Supplies', 'Emulsion Paint 20L', 'Paint Merchant', 'bucket', 32000, 25],
  ['x-107', 'm-102', 'PowerHouse Electrical', 'Dangote Cement 50kg', 'Cement Merchant', 'bag', 10500, 150],
  ['x-108', 'm-102', 'PowerHouse Electrical', 'Tile Adhesive 25kg', 'Tile Adhesive & Grout Merchant', 'bag', 6200, 80],
  ['x-109', 'm-102', 'PowerHouse Electrical', 'PVC Pressure Pipe 4in', 'Plumbing Materials Merchant', 'piece', 7100, 90],
  ['x-110', 'm-102', 'PowerHouse Electrical', 'Roofing Sheet', 'Roofing Materials & Accessories Merchant', 'sheet', 18000, 8],
  ['x-111', 'm-102', 'PowerHouse Electrical', 'Flush Door', 'Doors, Locks & Hardware Merchant', 'piece', 46000, 25],
  ['x-112', 'm-106', 'ColourCraft Store', 'Ceramic Tile 60x60', 'Tiles Merchant', 'box', 14000, 300],
  ['x-113', 'm-106', 'ColourCraft Store', 'Flush Door', 'Doors, Locks & Hardware Merchant', 'piece', 45000, 30],
  ['x-114', 'm-106', 'ColourCraft Store', 'Dangote Cement 50kg', 'Cement Merchant', 'bag', 11000, 20]
]

export function withSeedExtras(s) {
  const img = (cat) => s.products.find((p) => p.category === cat)?.image || s.products[0]?.image
  const extra = ROWS.map(([id, merchantId, merchant, name, category, unit, price, stock]) => ({ id, merchantId, merchant, name, category, unit, price, stock, available: true, image: img(category) }))
  const merchants = mergeById(mergeById(s.merchants, EXTRA_MERCHANTS), CATEGORY_MERCHANTS).map((m) => (m.id === 'm-104' && m.status === 'rejected' && !m.rejectedAt ? { ...m, rejectedAt: '2026-11-06T09:00:00Z' } : m))
  return {
    ...s,
    // Demo merchants can source items they do not stock (they still have to confirm each one).
    // Self-registered merchants (submittedAt set) start with this OFF until they switch it on.
    merchants: merchants.map((m) => (m.submittedAt ? m : { ...m, acceptsSourcing: m.acceptsSourcing ?? true })),
    products: mergeById(mergeById(s.products, extra), CATEGORY_PRODUCTS),
    // Merge by id (NOT `s.merchantUsers || MERCHANT_USERS`): normalizeState fills a missing list with [],
    // which is truthy, so the demo merchant logins were never created and demo sign-in hit "couldn't find this merchant account".
    merchantUsers: mergeById(s.merchantUsers || [], MERCHANT_USERS.filter((u) => merchants.some((m) => m.id === u.merchantId))),
    pendingQuotationId: s.pendingQuotationId ?? null
  }
}
// Demo mode: a merchant who registered themselves (submittedAt set, never rejected) is approved
// automatically AUTO_APPROVE_MS after applying. Seeded pending merchants are left for the admin demo.
export const AUTO_APPROVE_MS = 20000
export const autoApproveAt = (m) => {
  if (!m || m.status !== 'pending' || m.rejectedAt || !m.submittedAt) return null
  const t = Date.parse(m.submittedAt)
  return Number.isFinite(t) ? t + AUTO_APPROVE_MS : null
}

// Which merchant is signed in (new sign-ups carry merchantId; demo logins are looked up by email).
// Validate a saved merchantId first, since browser storage can outlive a reset
// of the merchant list. In that case, fall back to the account's email mapping.
export const merchantIdOf = (state) => {
  const directId = state.session?.merchantId
  if ((state.merchants || []).some((merchant) => merchant.id === directId)) return directId

  return (state.merchantUsers || []).find((user) => user.email === state.session?.email)?.merchantId || null
}
