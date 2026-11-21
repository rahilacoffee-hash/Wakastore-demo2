// Delivery records for notifications (PROTOTYPE: channel outcomes are simulated; production records the provider's response).
const IMPORTANT = /payment|paid|dispatch|deliver|dispute|settle|refund|expired|failed|order placed|price/i
const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

export function channelsFor(n) {
  return IMPORTANT.test(`${n.title} ${n.detail || n.message || ''}`) ? ['in-app', 'push', 'sms'] : ['in-app', 'push']
}
export function buildLogEntries(n, at = new Date().toISOString()) {
  const audience = n.recipientMerchantId ? 'merchant' : n.userId ? 'user' : 'customer'
  return channelsFor(n).map((channel) => {
    const failed = channel === 'sms' ? hash(`${n.id}:sms`) % 5 === 0 : channel === 'push' ? hash(`${n.id}:push`) % 11 === 0 : false
    return {
      id: `${n.id}:${channel}`, notificationId: n.id, title: n.title, audience, channel, at, attempts: 1,
      status: failed ? 'failed' : 'delivered',
      reason: failed ? (channel === 'sms' ? 'SMS provider timeout (simulated)' : 'Device token expired (simulated)') : '',
    }
  })
}
export const retryEntry = (e, at = new Date().toISOString()) => ({ ...e, status: 'delivered', reason: '', attempts: (e.attempts || 1) + 1, retriedAt: at })
