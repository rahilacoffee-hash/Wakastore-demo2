import assert from 'node:assert/strict'
import { withSeedExtras, merchantIdOf, autoApproveAt, AUTO_APPROVE_MS } from '../src/data/quoteSeed.js'

// What a fresh browser looks like after normalizeState(): missing arrays become [] (truthy!)
const merchants = [
  { id: 'm-101', status: 'approved' }, { id: 'm-102', status: 'approved' },
  { id: 'm-103', status: 'pending' }, { id: 'm-104', status: 'rejected' }, { id: 'm-105', status: 'suspended' },
]
const fresh = withSeedExtras({ products: [], merchants, merchantUsers: [] })

// 1. Every demo merchant login resolves to its merchant (this was "couldn't find this merchant account")
const demo = { 'merchant@waka.test': 'm-101', 'powerhouse@waka.test': 'm-102', 'pending@waka.test': 'm-103', 'rejected@waka.test': 'm-104', 'colourcraft@waka.test': 'm-106' }
for (const [email, id] of Object.entries(demo)) {
  assert.equal(merchantIdOf({ ...fresh, session: { role: 'merchant', email } }), id, `${email} must map to ${id}`)
}

// 2. Merchants who registered keep their login, and merging twice never duplicates
const registered = { id: 'mu-1799', merchantId: 'm-1799', name: 'New Co', email: 'new@co.test', password: 'x' }
const withReg = withSeedExtras({ products: [], merchants: [...merchants, { id: 'm-1799', status: 'pending' }], merchantUsers: [registered] })
assert(withReg.merchantUsers.some((u) => u.id === 'mu-1799'), 'Registered merchant user must be kept')
assert.equal(merchantIdOf({ ...withReg, session: { role: 'merchant', email: 'new@co.test' } }), 'm-1799')
assert.equal(withSeedExtras(withReg).merchantUsers.length, withReg.merchantUsers.length, 'Merging twice must not duplicate users')

// 3. Auto-approve (demo) applies ONLY to freshly self-registered, never-rejected pending merchants
const t0 = '2026-11-12T10:00:00.000Z'
assert.equal(autoApproveAt({ status: 'pending', submittedAt: t0 }), Date.parse(t0) + 20000)
assert.equal(AUTO_APPROVE_MS, 20000)
assert.equal(autoApproveAt({ id: 'm-103', status: 'pending' }), null, 'Seeded pending merchants stay pending for the admin demo')
assert.equal(autoApproveAt({ status: 'pending', submittedAt: t0, rejectedAt: t0 }), null, 'Previously rejected merchants wait for admin review')
assert.equal(autoApproveAt({ status: 'approved', submittedAt: t0 }), null)
assert.equal(autoApproveAt({ status: 'rejected', submittedAt: t0 }), null)
assert.equal(autoApproveAt({ status: 'suspended', submittedAt: t0 }), null)
assert.equal(autoApproveAt({ status: 'pending', submittedAt: 'garbage' }), null)
assert.equal(autoApproveAt(undefined), null)

console.log('WakaStore merchant demo tests passed (demo logins always seeded; 20s auto-approve only for new sign-ups).')
