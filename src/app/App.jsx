import { useEffect } from 'react'
import { ThemeProvider } from '../context/ThemeContext'
import { AppStateProvider, useAppState } from '../context/AppStateContext'
import AppRouter from './router'

function Toast() {
  const { state, ensureToastCleared } = useAppState()
  const toast = state.toast
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(ensureToastCleared, 3200)
    return () => window.clearTimeout(timer)
  }, [toast, ensureToastCleared])
  if (!toast) return null
  return <div role="status" aria-live="polite" className={`fixed bottom-24 left-1/2 z-[100] max-w-[92vw] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg md:bottom-8 ${toast.type === 'error' ? 'bg-[#B90013]' : 'bg-[#171717]'}`}>{toast.message}</div>
}

export default function App() { return <ThemeProvider><AppStateProvider><AppRouter /><Toast /></AppStateProvider></ThemeProvider> }
