import { useMemo, useState } from "react";
import { CircleDollarSign, FileText, KeyRound, PackageCheck, Settings as SettingsIcon, ShieldAlert, Store, Users, WalletCards } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { formatNaira } from "../utils/formatters";
import { computeReports } from "../services/reports";
import { moneyByMerchant } from "../services/ledger";
import { DEFAULT_RATE_CARD } from "../services/delivery";
import { card, pill, GOOD, WARN, BAD, NEUTRAL, Head, Stat, Empty } from "./AdminPages";

const field = "w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm";
const btn = "rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold";
const primary = "rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white";
const audit = (prev, action, entity, details) => ({ id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, actor: prev.session?.name || "Super Admin", action, entity, date: new Date().toLocaleString("en-NG"), details });
const tempPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = typeof crypto !== "undefined" && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(10)) : Array.from({ length: 10 }, () => Math.floor(Math.random() * 256));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

/* ------------------------------------------------------------------ Overview */
export function SuperOverview() {
  const { state } = useAppState();
  const { kpis } = useMemo(() => computeReports(state), [state]);
  const money = (state.orders || []).flatMap((o) => moneyByMerchant(o));
  const pending = money.reduce((n, a) => n + a.pending.merchantShare, 0);
  const failedLogins = (state.auditLogs || []).filter((l) => /failed admin login/i.test(l.action)).length;
  const live = (state.quotations || []).filter((q) => !String(q.status).startsWith("Paid")).length;
  return (
    <div className="space-y-5">
      <Head eyebrow="Super Admin" title="Platform overview" note="Platform-wide view. Operational work (orders, disputes, merchants) stays with admins; configuration, admin accounts and financial oversight live here." />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Customers" value={(state.customers || []).length} Icon={Users} />
        <Stat label="Merchants" value={`${kpis.merchantsApproved} / ${kpis.merchantsTotal}`} Icon={Store} note={`${(state.merchants || []).filter((m) => m.status === "suspended").length} suspended`} />
        <Stat label="Active requests" value={live} Icon={FileText} />
        <Stat label="Orders" value={(state.orders || []).length} Icon={PackageCheck} note={`${kpis.ordersDisputed} under review or disputed`} />
        <Stat label="Transaction volume" value={formatNaira(kpis.gmv)} Icon={WalletCards} />
        <Stat label="Commission earned" value={formatNaira(kpis.commissionEarned)} Icon={CircleDollarSign} />
        <Stat label="Pending settlements" value={formatNaira(pending)} Icon={CircleDollarSign} />
        <Stat label="Failed admin logins" value={failedLogins} Icon={ShieldAlert} />
      </div>
      <section className={card}>
        <h2 className="text-lg font-extrabold">Recent admin activity</h2>
        {!(state.auditLogs || []).length ? <div className="mt-3"><Empty>No activity recorded yet.</Empty></div> : (
          <div className="mt-3 divide-y divide-[var(--line)] text-sm">
            {state.auditLogs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><b>{l.actor}</b> · {l.action}</span><span className="text-xs text-[var(--muted)]">{l.entity} · {l.date}</span></div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Admin accounts */
export function AdminTeam() {
  const { state, updateState } = useAppState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [shown, setShown] = useState(null); // credentials are displayed once, right after creation or reset
  const admins = state.adminUsers || [];

  const create = () => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return setError("Enter the admin's full name.");
    if (!/^\S+@\S+\.\S+$/.test(e)) return setError("Enter a valid email address.");
    if (admins.some((a) => a.email === e) || ["admin@waka.test", "superadmin@waka.test"].includes(e)) return setError("An admin account with this email already exists.");
    const pw = tempPassword();
    updateState((prev) => ({ ...prev, adminUsers: [{ id: `adm-${Date.now()}`, name: name.trim(), email: e, role: "admin", status: "active", password: pw, mustChange: true, createdAt: new Date().toISOString(), createdBy: prev.session?.name || "Super Admin" }, ...prev.adminUsers], auditLogs: [audit(prev, "Created admin account", e, "Temporary password generated. Must be changed on first login."), ...prev.auditLogs] }));
    setShown({ email: e, password: pw, reason: "Account created" });
    setName(""); setEmail(""); setError("");
  };
  const setStatus = (a, status) => updateState((prev) => ({ ...prev, adminUsers: prev.adminUsers.map((x) => (x.id === a.id ? { ...x, status } : x)), auditLogs: [audit(prev, status === "suspended" ? "Suspended admin account" : "Reactivated admin account", a.email, ""), ...prev.auditLogs] }));
  const reset = (a) => {
    const pw = tempPassword();
    updateState((prev) => ({ ...prev, adminUsers: prev.adminUsers.map((x) => (x.id === a.id ? { ...x, password: pw, mustChange: true } : x)), auditLogs: [audit(prev, "Reset admin credentials", a.email, "New temporary password generated."), ...prev.auditLogs] }));
    setShown({ email: a.email, password: pw, reason: "Credentials reset" });
  };
  return (
    <div className="space-y-5">
      <Head eyebrow="Super Admin" title="Admin accounts" note="Only Super Admin creates admins. A temporary password is generated by the system and the admin must change it on first login. Prototype only: passwords are kept in browser storage." />
      <section className={card}>
        <h2 className="text-lg font-extrabold">Create admin</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input className={field} placeholder="Full name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} />
          <input className={field} placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
          <button onClick={create} className={primary}>Create admin</button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-bold text-[var(--red)]">{error}</p>}
        {shown && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <b>{shown.reason}.</b> Share these credentials securely. The password is shown once.
            <div className="mt-1 font-mono">{shown.email} · {shown.password}</div>
            <button onClick={() => setShown(null)} className={`${btn} mt-2`}>I have copied it</button>
          </div>
        )}
      </section>
      <section className={card}>
        <h2 className="text-lg font-extrabold">Accounts</h2>
        <div className="mt-3 divide-y divide-[var(--line)] text-sm">
          {[{ id: "d1", name: "Admin User", email: "admin@waka.test", status: "active", builtin: true }, { id: "d2", name: "Super Admin Team", email: "superadmin@waka.test", status: "active", builtin: true, role: "super-admin" }, ...admins].map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div><b>{a.name}</b><div className="text-xs text-[var(--muted)]">{a.email} · {a.role === "super-admin" ? "Super Admin" : "Admin"}{a.builtin ? " · built-in demo account" : a.mustChange ? " · must change password" : ""}</div></div>
              <div className="flex items-center gap-2">
                <span className={pill(a.status === "active" ? GOOD : BAD)}>{a.status}</span>
                {!a.builtin && <>
                  <button onClick={() => setStatus(a, a.status === "active" ? "suspended" : "active")} className={btn}>{a.status === "active" ? "Suspend" : "Reactivate"}</button>
                  <button onClick={() => reset(a)} className={btn}><KeyRound size={12} className="mr-1 inline" />Reset</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Platform settings */
const RULES = [
  ["feeRate", "Commission (% of materials, from the merchant)", (s) => +(s.feeRate * 100).toFixed(2), (v) => v / 100, 0, 30],
  ["threshold", "Matching threshold (% of distinct lines)", (s) => s.threshold, (v) => v, 1, 100],
  ["invitationHours", "Merchant invitation window (hours)", (s) => s.invitationHours, (v) => v, 1, 168],
  ["quoteValidHours", "Quotation validity (hours)", (s) => s.quoteValidHours, (v) => v, 1, 336],
];
export function PlatformSettings() {
  const { state, updateState } = useAppState();
  const s = state.settings;
  const [draft, setDraft] = useState(() => Object.fromEntries(RULES.map(([k, , show]) => [k, String(show(s))])));
  const [rates, setRates] = useState(() => JSON.parse(JSON.stringify(s.deliveryRates || DEFAULT_RATE_CARD)));
  const [multi, setMulti] = useState(Boolean(s.multiMerchant));
  const [msg, setMsg] = useState("");
  const [bad, setBad] = useState(false);

  const save = () => {
    const next = {};
    for (const [k, label, , toStore, min, max] of RULES) {
      const n = Number(draft[k]);
      if (!Number.isFinite(n) || n < min || n > max) { setBad(true); return setMsg(`${label}: enter a number between ${min} and ${max}.`); }
      next[k] = toStore(n);
    }
    const numRate = (v) => (v === "" || v === null ? null : Number(v));
    const cleanRates = { merchant: {}, wakarider: {}, extraMerchantStop: Number(rates.extraMerchantStop) || 0 };
    for (const m of ["merchant", "wakarider"]) for (const z of ["sameCity", "sameState", "otherState"]) {
      const v = numRate(rates[m][z]);
      if (v !== null && (!Number.isFinite(v) || v < 0)) { setBad(true); return setMsg("Delivery rates must be 0 or more. Leave blank to not offer a method for that distance."); }
      cleanRates[m][z] = v;
    }
    updateState((prev) => {
      const changes = Object.entries({ ...next, multiMerchant: multi }).filter(([k, v]) => prev.settings[k] !== v).map(([k, v]) => `${k}: ${prev.settings[k]} → ${v}`);
      const rateChanged = JSON.stringify(prev.settings.deliveryRates) !== JSON.stringify(cleanRates);
      if (rateChanged) changes.push("delivery rate card updated");
      return { ...prev, settings: { ...prev.settings, ...next, multiMerchant: multi, deliveryRates: cleanRates }, auditLogs: changes.length ? [audit(prev, "Changed platform settings", "settings", changes.join("; ")), ...prev.auditLogs] : prev.auditLogs };
    });
    setBad(false); setMsg("Saved. New values apply to new requests and orders; existing quotations and orders keep their original terms.");
  };
  const rateInput = (m, z) => <input className={field} inputMode="numeric" placeholder="not offered" value={rates[m][z] ?? ""} onChange={(e) => setRates((r) => ({ ...r, [m]: { ...r[m], [z]: e.target.value } }))} />;
  return (
    <div className="space-y-5">
      <Head eyebrow="Super Admin" title="Platform settings" note="Business-critical settings. Every change is recorded in the audit log." />
      <section className={card}>
        <h2 className="text-lg font-extrabold">Commercial rules</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {RULES.map(([k, label]) => (
            <label key={k} className="text-xs font-semibold">{label}<input className={`${field} mt-1`} inputMode="decimal" value={draft[k]} onChange={(e) => { setDraft((d) => ({ ...d, [k]: e.target.value })); setMsg(""); }} /></label>
          ))}
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--soft)] p-3 text-sm">
          <input type="checkbox" className="mt-1" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
          <span><b>Allow item-level rerouting to other merchants</b><br /><span className="text-xs text-[var(--muted)]">Launch rule is OFF: one merchant per order. When on, an item a merchant cannot supply on a cart order can be offered to another eligible merchant.</span></span>
        </label>
      </section>
      <section className={card}>
        <h2 className="text-lg font-extrabold">Delivery rate card (demo)</h2>
        <p className="text-xs text-[var(--muted)]">Naira per order by distance between the customer and the merchant. Replace with live merchant and WakaRider quotes in production.</p>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[460px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[.1em] text-[var(--muted)]"><tr><th className="py-2">Method</th><th>Same city</th><th>Same state</th><th>Other state</th></tr></thead>
          <tbody>{[["merchant", "Merchant delivery"], ["wakarider", "WakaRider"]].map(([m, l]) => (
            <tr key={m} className="border-t border-[var(--line)]"><td className="py-2 font-bold">{l}</td>{["sameCity", "sameState", "otherState"].map((z) => <td key={z} className="pr-2">{rateInput(m, z)}</td>)}</tr>
          ))}</tbody>
        </table></div>
        <label className="mt-3 block max-w-xs text-xs font-semibold">Extra charge per additional merchant stop<input className={`${field} mt-1`} inputMode="numeric" value={rates.extraMerchantStop ?? 0} onChange={(e) => setRates((r) => ({ ...r, extraMerchantStop: e.target.value }))} /></label>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} className={primary}><SettingsIcon size={14} className="mr-1 inline" />Save settings</button>
        {msg && <p role={bad ? "alert" : "status"} className={`text-sm font-bold ${bad ? "text-[var(--red)]" : "text-emerald-700"}`}>{msg}</p>}
      </div>
    </div>
  );
}
