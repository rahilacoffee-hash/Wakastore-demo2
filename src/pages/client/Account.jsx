import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Heart, LogOut, MapPin, Moon, PackageCheck, Trash2, UserRound, WalletCards } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import { useTheme } from "../../context/ThemeContext";
import { formatNaira } from "../../utils/formatters";

let field = "h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--red)]";
let card = "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4";
let EMPTY = { label: "Home", recipient: "", phone: "", street: "", city: "", state: "" };

export default function Account() {
  let { state, saveAddress, removeAddress, toggleSaved, signOut, notify } = useAppState();
  let { theme, toggleTheme } = useTheme();
  let navigate = useNavigate();
  let [form, setForm] = useState(EMPTY);
  let [adding, setAdding] = useState(false);
  let [err, setErr] = useState("");
  let session = state.session || {};
  let profile = (state.customers || []).find((c) => c.email && c.email === session.email) || {};
  let unread = (state.notifications || []).filter((n) => !n.recipientMerchantId && !n.seen).length;
  let initials = (session.name || "G").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  function submit(e) {
    e.preventDefault();
    if (!form.recipient.trim() || !form.phone.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim()) {
      setErr("Recipient, phone, street, city and state are required.");
      return;
    }
    saveAddress(form);
    setForm(EMPTY);
    setAdding(false);
    setErr("");
    notify("Address saved");
  }
  function logout() {
    signOut();
    navigate("/welcome", { replace: true });
  }
  let set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-5 pb-6 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
      <h1 className="font-[Manrope] text-3xl font-black tracking-[-.04em]">Account</h1>

      <section className={`${card} flex items-center gap-4`} aria-label="Profile">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--red)] text-xl font-extrabold text-white">{initials}</span>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{session.name || "Guest"}</p>
          <p className="truncate text-sm text-[var(--muted)]">{session.email || "Not signed in"}</p>
          {profile.phone && <p className="text-sm text-[var(--muted)]">{profile.phone}</p>}
        </div>
      </section>

      <nav className={`${card} divide-y divide-[var(--line)] !p-0`} aria-label="Account shortcuts">
        {[
          ["/client/orders", PackageCheck, "Order history", ""],
          ["/client/wallet", WalletCards, "WakaWallet (demo)", ""],
          ["/client/notifications", Bell, "Notifications", unread ? `${unread} new` : ""],
        ].map(([to, Icon, label, tag]) => (
          <Link key={to} to={to} className="flex min-h-14 items-center gap-3 px-4">
            <Icon size={20} className="text-[var(--red)]" />
            <span className="flex-1 text-[15px] font-semibold">{label}</span>
            {tag && <span className="rounded-full bg-[var(--red)] px-2 py-0.5 text-xs font-bold text-white">{tag}</span>}
            <ChevronRight size={17} className="text-[var(--muted)]" />
          </Link>
        ))}
      </nav>

      <section id="addresses" className={card} aria-label="Delivery addresses">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><MapPin size={19} className="text-[var(--red)]" /> Addresses</h2>
          <button type="button" onClick={() => setAdding(!adding)} className="h-10 rounded-xl border border-[var(--line)] px-3 text-sm font-bold">
            {adding ? "Cancel" : "Add address"}
          </button>
        </div>
        {adding && (
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <input className={field} placeholder="Label (Home, Site…)" value={form.label} onChange={set("label")} aria-label="Label" />
            <input className={field} placeholder="Recipient name" value={form.recipient} onChange={set("recipient")} aria-label="Recipient" />
            <input className={field} placeholder="Phone" inputMode="tel" value={form.phone} onChange={set("phone")} aria-label="Phone" />
            <input className={field} placeholder="Street address" value={form.street} onChange={set("street")} aria-label="Street" />
            <div className="grid grid-cols-2 gap-3">
              <input className={field} placeholder="City" value={form.city} onChange={set("city")} aria-label="City" />
              <input className={field} placeholder="State" value={form.state} onChange={set("state")} aria-label="State" />
            </div>
            {err && <p role="alert" className="text-sm font-semibold text-[var(--red)]">{err}</p>}
            <button className="h-12 rounded-xl bg-[var(--red)] font-bold text-white">Save address</button>
          </form>
        )}
        {state.addresses.length ? (
          <ul className="mt-4 space-y-2">
            {state.addresses.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-xl bg-[var(--soft)] p-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold">{a.label} · {a.recipient}</p>
                  <p className="text-[var(--muted)]">{a.street}, {a.city}, {a.state}</p>
                  <p className="text-[var(--muted)]">{a.phone}</p>
                </div>
                <button type="button" aria-label={`Remove ${a.label} address`} onClick={() => removeAddress(a.id)} className="grid h-10 w-10 place-items-center rounded-xl text-[var(--red)]">
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !adding && <p className="mt-3 text-sm text-[var(--muted)]">No saved addresses yet.</p>
        )}
      </section>

      <section id="saved" className={card} aria-label="Saved products">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Heart size={19} className="text-[var(--red)]" /> Saved products</h2>
        {state.wishlist.length ? (
          <ul className="mt-3 space-y-2">
            {state.wishlist.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-[var(--soft)] p-2.5">
                <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <Link to={`/client/product/${encodeURIComponent(p.id)}`} className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-bold">{p.name}</span>
                  <span className="text-sm text-[var(--muted)]">{formatNaira(p.price)}</span>
                </Link>
                <button type="button" aria-label={`Remove ${p.name} from saved`} onClick={() => toggleSaved(p)} className="grid h-10 w-10 place-items-center rounded-xl text-[var(--red)]">
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">Tap the heart on a product to save it here.</p>
        )}
      </section>

      <section className={card} aria-label="Settings">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><UserRound size={19} className="text-[var(--red)]" /> Settings</h2>
        <button type="button" onClick={toggleTheme} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-xl bg-[var(--soft)] px-3 text-left text-[15px] font-semibold">
          <Moon size={19} />
          <span className="flex-1">Dark mode</span>
          <span className="text-sm text-[var(--muted)]">{theme === "dark" ? "On" : "Off"}</span>
        </button>
      </section>

      <button type="button" onClick={logout} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#171717] font-bold text-white">
        <LogOut size={19} /> Log out
      </button>
    </div>
  );
}
