import { seedState } from '../src/data/seed.js'
import { registerCustomer, registerMerchant } from '../src/services/accounts.js'
import { reviewMerchant, notificationsFor } from '../src/services/engine.js'
import { matchQuotation } from '../src/services/matching.js'
let s = seedState(), bad = 0; const t = (n, c) => { if (!c) { bad++; console.log('FAIL', n) } else console.log('ok  ', n) }
t('bad email rejected', registerCustomer(s, { name: 'A', email: 'nope', password: 'secret1' }).error === 'EMAIL_INVALID')
t('short password rejected', registerCustomer(s, { name: 'A', email: 'a@b.co', password: '123' }).error === 'PASSWORD_SHORT')
t('duplicate email rejected', registerCustomer(s, { name: 'A', email: 'CUSTOMER1@waka.test', password: 'secret1' }).error === 'EMAIL_TAKEN')
let r = registerCustomer(s, { name: 'New Buyer', email: 'Buyer@Test.com', password: 'secret1' }); s = r.state
t('customer created, lowercase email, active, welcome notification', r.ok && r.user.email === 'buyer@test.com' && r.user.status === 'active' && notificationsFor(s, r.user.id).length === 1)
const m = { ownerName: 'Tunde', email: 'shop@test.com', password: 'secret1', phone: '0800', businessName: 'Tunde Cement', address: 'Kubwa, Abuja', categories: [] }
t('merchant needs a category', registerMerchant(s, m).error === 'CATEGORY_REQUIRED')
r = registerMerchant(s, { ...m, categories: ['Cement Merchant'] }); s = r.state
t('merchant created as pending + admins and super notified', r.ok && r.merchant.status === 'pending' && notificationsFor(s, 'u-ad').length === 1 && notificationsFor(s, 'u-sa').length === 1)
t('pending merchant takes no part in matching', !matchQuotation([{ id: 'l', name: 'Cement', quantity: 1, unit: 'bags' }], s.merchants, s.products).results.some((x) => x.merchant.id === r.merchant.id))
s = reviewMerchant(s, { actorId: 'u-ad', merchantId: r.merchant.id, decision: 'approve' }).state
t('admin approval works for self-registered merchant + merchant notified', s.merchants.find((x) => x.id === r.merchant.id).status === 'approved' && notificationsFor(s, r.user.id).length === 2)
t('state JSON-safe', !!JSON.parse(JSON.stringify(s)))
console.log(bad ? 'FAILED' : 'all passed'); process.exit(bad ? 1 : 0)
