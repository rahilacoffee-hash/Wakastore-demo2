// Sign-up logic (pure). Demo only: passwords are stored in localStorage in plain text. Never do this in production.
const fail = (state, error) => ({ state, ok: false, error })
const norm = (e = '') => String(e).trim().toLowerCase()
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e)
const note = (d, userId, title, message, route) => d.notifications.unshift({ id: `n-${++d.seq}`, userId, title, message, type: 'account', route, createdAt: new Date().toISOString(), read: false })

function check(state, { email, password }) {
  if (!emailOk(norm(email))) return 'EMAIL_INVALID'
  if ((password || '').length < 6) return 'PASSWORD_SHORT'
  if (state.users.some((u) => u.email === norm(email))) return 'EMAIL_TAKEN'
  return null
}

export function registerCustomer(state, { name, email, phone, password }) {
  if (!name?.trim()) return fail(state, 'NAME_REQUIRED')
  const err = check(state, { email, password }); if (err) return fail(state, err)
  const d = structuredClone(state)
  const user = { id: `c-${++d.seq}`, role: 'customer', name: name.trim(), email: norm(email), password, phone: (phone || '').trim(), status: 'active' }
  d.users.push(user)
  note(d, user.id, 'Welcome to WakaStore', 'Fund your demo wallet, then submit a materials list to compare merchants.', '/client/home')
  return { state: d, ok: true, user }
}

export function registerMerchant(state, { ownerName, email, password, phone, businessName, address, description, categories }) {
  if (!businessName?.trim()) return fail(state, 'BUSINESS_REQUIRED')
  if (!ownerName?.trim()) return fail(state, 'NAME_REQUIRED')
  if (!phone?.trim()) return fail(state, 'PHONE_REQUIRED')
  if (!address?.trim()) return fail(state, 'ADDRESS_REQUIRED')
  if (!categories?.length) return fail(state, 'CATEGORY_REQUIRED')
  const err = check(state, { email, password }); if (err) return fail(state, err)
  const d = structuredClone(state)
  const merchant = { id: `m-${++d.seq}`, name: businessName.trim(), status: 'pending', address: address.trim(), contact: phone.trim(), description: (description || '').trim(), categories: [...categories], appliedAt: new Date().toISOString() }
  const user = { id: `u-${++d.seq}`, role: 'merchant', merchantId: merchant.id, name: ownerName.trim(), email: norm(email), password }
  d.merchants.push(merchant); d.users.push(user)
  note(d, user.id, 'Application received', 'An admin will review your business. You can list products once approved.', '/merchant/overview')
  d.users.filter((u) => ['admin', 'super-admin'].includes(u.role)).forEach((a) => d.notifications.unshift({ id: `n-${++d.seq}`, userId: a.id, title: 'New merchant application', message: `${merchant.name} applied (${merchant.categories.length} categories)`, type: 'merchant', ref: merchant.id, route: '/admin/merchants', createdAt: new Date().toISOString(), read: false }))
  return { state: d, ok: true, user, merchant }
}
