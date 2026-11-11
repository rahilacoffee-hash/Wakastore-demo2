import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Btn, Card, Demo } from '../components/ui'
const HOME = { customer: '/client/home', merchant: '/merchant/overview', admin: '/admin/overview', 'super-admin': '/admin/overview' }
const ACCTS = [['Customer A', 'customer1@waka.test', 'Has ₦500k demo wallet'], ['Customer B', 'customer2@waka.test', 'Empty wallet — test insufficient balance'], ['Merchant A', 'merchant.a@waka.test', 'BuildRight · 8/10 match'], ['Merchant B', 'merchant.b@waka.test', 'PowerHouse · 6/10 match'], ['Merchant C', 'merchant.c@waka.test', 'Tile District · 4/10 (below 60%)'], ['Pending Merchant', 'merchant.pending@waka.test', 'Awaiting approval'], ['Admin', 'admin@waka.test', 'Operations'], ['Super Admin', 'super@waka.test', 'Sourcing, admins, settings']]
export default function Login() {
  const { login, reset, user } = useStore(), nav = useNavigate()
  const enter = (email) => { const u = login(email, 'waka123'); if (u) nav(HOME[u.role]) }
  return <div className="min-h-screen bg-[#FCEBED] px-4 py-8"><div className="mx-auto max-w-3xl">
    <img src="/logo.webp" alt="WakaStore" className="mb-6 h-10" />
    <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight">Build better, source smarter.<br />Pick a demo role.</h1>
    <p className="mt-2 text-sm text-[#55515A]">Prototype. Payments, wallet, OCR and settlements are all simulated. Password for every account: <b>waka123</b>.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">{ACCTS.map(([n, e, d]) => <button key={e} onClick={() => enter(e)} className="rounded-2xl border border-[#F5D5D9] bg-white p-4 text-left hover:border-[#ED0018]"><b className="font-[Manrope]">{n}</b><div className="text-xs text-[#85818A]">{e}</div><div className="mt-1 text-sm text-[#55515A]">{d}</div></button>)}</div>
    <Card className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><b className="text-sm">Reset demo data</b><p className="text-xs text-[#85818A]">Restores the clean seed dataset.</p></div><div className="flex items-center gap-2"><Demo />{user && <Btn v="ghost" onClick={() => nav(HOME[user.role])}>Continue as {user.name}</Btn>}<Btn v="dark" onClick={reset}>Reset</Btn></div></Card>
  </div></div>
}
