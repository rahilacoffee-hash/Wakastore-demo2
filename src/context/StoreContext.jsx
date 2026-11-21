import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { seedState } from '../data/seed'
import { migrateCategories } from '../utils/migrateCategories'

const KEY = 'waka-v3', SKEY = 'waka-v3-session', CKEY = 'waka-v3-cart'
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

const MSG = {
  INSUFFICIENT_BALANCE: 'Insufficient demo wallet balance — fund your wallet first.',
  PAYMENT_FAILED: 'Simulated payment failed. No order was created.',
  REASON_REQUIRED: 'A reason is required.', FORBIDDEN: 'You are not allowed to do that.',
  EMPTY_QUOTATION: 'Add at least one material.', INVALID_QUANTITY: 'Every quantity must be greater than zero.',
  INCOMPLETE_CHECKOUT: 'Add a delivery address first.', INVALID_TRANSITION: 'That step is not allowed yet.',
  NOT_ELIGIBLE: 'Not eligible yet.', FUNDING_FAILED: 'Simulated funding failed.',
  EMAIL_INVALID: 'Enter a valid email address.', PASSWORD_SHORT: 'Password must be at least 6 characters.', EMAIL_TAKEN: 'That email is already registered. Try signing in.',
  NAME_REQUIRED: 'Enter your name.', BUSINESS_REQUIRED: 'Enter your business name.', PHONE_REQUIRED: 'Enter a phone number.', ADDRESS_REQUIRED: 'Enter your business address.', CATEGORY_REQUIRED: 'Pick at least one category.'
}
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => { const s = read(KEY, null); return s?.seq ? migrateCategories(s) : seedState() })
  const ref = useRef(state)
  const [uid, setUid] = useState(() => localStorage.getItem(SKEY))
  const [cart, setCartState] = useState(() => read(CKEY, []))
  const [toast, setToast] = useState(null)
  const timer = useRef()

  useEffect(() => { ref.current = state; localStorage.setItem(KEY, JSON.stringify(state)) }, [state])
  useEffect(() => localStorage.setItem(CKEY, JSON.stringify(cart)), [cart])

  const flash = useCallback((text, bad) => { setToast({ text, bad }); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 3200) }, [])
  const commit = (s) => { ref.current = s; setState(s) }

  // run(engineFn, input): applies an engine action to the latest state and persists it.
  const run = useCallback((fn, input, okMsg) => {
    const r = fn(ref.current, input)
    if (r.state !== ref.current) commit(r.state)
    if (!r.ok && r.error) flash(MSG[r.error] || r.error.replace('OUT_OF_STOCK:', 'Out of stock: '), true)
    else if (r.ok && okMsg) flash(okMsg)
    return r
  }, [flash])
  const mutate = useCallback((fn, okMsg) => { const d = structuredClone(ref.current); fn(d); commit(d); if (okMsg) flash(okMsg) }, [flash])

  const login = (email, password) => {
    const u = ref.current.users.find((x) => x.email === email && x.password === password)
    if (!u) return false
    localStorage.setItem(SKEY, u.id); setUid(u.id); return u
  }
  const logout = () => { localStorage.removeItem(SKEY); setUid(null) }
  const reset = () => { localStorage.removeItem(SKEY); setUid(null); setCartState([]); commit(seedState()); flash('Demo data reset') }
  const user = state.users.find((u) => u.id === uid) || null

  return (
    <Ctx.Provider value={{ state, user, run, mutate, login, logout, reset, cart, setCart: setCartState, flash }}>
      {children}
      {toast && <div role="status" className={`fixed bottom-24 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg md:bottom-8 print:hidden ${toast.bad ? 'bg-[#B90013]' : 'bg-[#171717]'}`}>{toast.text}</div>}
    </Ctx.Provider>
  )
}
