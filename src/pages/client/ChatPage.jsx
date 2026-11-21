import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useAppState } from '../../context/AppStateContext'
import { merchantIdOf } from '../../data/quoteSeed'

export default function ChatPage() {
  const [params] = useSearchParams()
  const quotationId = params.get('quotation') || ''
  const { state, sendChatMessage } = useAppState()
  const session = state.session || {}
  const merchantSessionId = session.role === 'merchant' ? merchantIdOf(state) : null
  const quotation = state.quotations.find((q) => q.id === quotationId)
  const available = quotation ? (quotation.matchedMerchants || []).map((name) => state.merchants.find((m) => m.name === name)).filter(Boolean) : []
  const [merchantId, setMerchantId] = useState(params.get('merchant') || merchantSessionId || available[0]?.id || '')
  const [draft, setDraft] = useState('')
  const activeMerchantId = merchantSessionId || merchantId
  const messages = useMemo(() => (state.messages || []).filter((m) => m.quotationId === quotationId && m.merchantId === activeMerchantId), [state.messages, quotationId, activeMerchantId])
  const submit = (e) => { e.preventDefault(); if (sendChatMessage({ quotationId, merchantId: activeMerchantId, text: draft })) setDraft('') }
  if (!quotation) return <div className="mx-auto max-w-2xl p-6"><p>Quotation conversation not found.</p><Link to={session.role === 'merchant' ? '/merchant/quotations' : '/client/quotations'} className="text-[var(--red)]">Go back</Link></div>
  const merchant = state.merchants.find((m) => m.id === activeMerchantId)
  return <div className="mx-auto flex h-[calc(100dvh-112px)] max-w-3xl flex-col px-3 py-4 sm:px-6">
    <Link to={session.role === 'merchant' ? '/merchant/quotations' : `/client/quotations/${quotationId}`} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={16}/> Back</Link>
    <div className="rounded-t-2xl border border-[var(--line)] bg-[var(--surface)] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[var(--red)]">WakaStore in-app chat · {quotationId}</p><div className="mt-1 flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-lg font-extrabold">{merchant?.name || 'Merchant conversation'}</h1><p className="text-xs text-[var(--muted)]">Discuss availability, exact variations and quotation details.</p></div>{session.role !== 'merchant' && <select aria-label="Choose merchant" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>{available.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}</div></div>
    <div className="flex-1 space-y-3 overflow-y-auto border-x border-[var(--line)] bg-[var(--soft)] p-4">{!messages.length && <div className="mx-auto mt-10 max-w-xs text-center"><div className="font-bold">Start the conversation</div><p className="mt-1 text-sm text-[var(--muted)]">Your messages about this quotation will appear here.</p></div>}{messages.map((m) => { const mine = m.senderRole === session.role; return <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${mine ? 'bg-[var(--red)] text-white' : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]'}`}><p className="mb-1 text-[10px] font-bold opacity-75">{m.senderName}</p><p className="whitespace-pre-wrap text-sm">{m.text}</p><p className="mt-1 text-right text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div> })}</div>
    <form onSubmit={submit} className="flex gap-2 rounded-b-2xl border border-[var(--line)] bg-[var(--surface)] p-3"><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-3 text-sm outline-none focus:border-[var(--red)]"/><button disabled={!draft.trim() || !activeMerchantId} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--red)] text-white disabled:opacity-40" aria-label="Send message"><Send size={17}/></button></form>
  </div>
}
