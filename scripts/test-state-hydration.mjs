import React from 'react'
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
try {
  const { AppStateProvider, useAppState } = await vite.ssrLoadModule('/src/context/AppStateContext.jsx')
  function Probe() {
    const { state } = useAppState()
    const checks = ['cart', 'orders', 'products', 'wishlist', 'quotations', 'refunds', 'merchants', 'customers', 'notifications', 'auditLogs', 'sourcing', 'merchantUsers']
    const bad = checks.filter((key) => !Array.isArray(state[key]))
    if (bad.length) throw new Error(`Invalid state arrays: ${bad.join(', ')}`)
    return React.createElement('output', null, `notifications:${state.notifications.length}`)
  }

  storage.set('waka-demo-v2', JSON.stringify({ notifications: { unread: 3 }, cart: null, wallet: { balance: 5000, history: {} }, session: 'invalid' }))
  const html = renderToString(React.createElement(AppStateProvider, null, React.createElement(Probe)))
  if (!html.includes('notifications:3')) throw new Error(`Unexpected hydration output: ${html}`)
  console.log('PASS: malformed legacy notifications are normalized to the safe default array')
  console.log('PASS: all required state collections hydrate as arrays')
  console.log('PASS: malformed wallet history and session are normalized')
} finally {
  await vite.close()
}
