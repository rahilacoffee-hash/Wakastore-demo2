import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, ClipboardList, MapPin, Phone, Store } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import ProductTile from "../../components/ui/ProductTile";

export default function Storefront() {
  let { id } = useParams();
  let { state } = useAppState();
  let [cat, setCat] = useState("");
  let merchant = (state.merchants || []).find((m) => m.id === id);

  if (!merchant || merchant.status !== "approved") {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Store not available</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">This merchant is not currently trading on WakaStores.</p>
        <Link to="/client/explore" className="mt-5 inline-flex h-12 items-center rounded-xl bg-[var(--red)] px-5 font-bold text-white">
          Back to Explore
        </Link>
      </div>
    );
  }

  let all = (state.products || []).filter((p) => p.merchantId === id && p.available !== false && !p.archived);
  let cats = [...new Set(all.map((p) => p.category))];
  let list = all.filter((p) => !cat || p.category === cat);

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-6 lg:px-0">
      <section className="relative overflow-hidden rounded-b-[32px] bg-[linear-gradient(180deg,#B90013_0%,#ED0018_100%)] px-5 pb-8 pt-[max(18px,env(safe-area-inset-top))] text-white sm:px-8 lg:rounded-[28px] lg:px-12 lg:pt-10">
        <Link to="/client/explore" aria-label="Back to Explore" className="grid h-11 w-11 place-items-center rounded-full bg-white/15 lg:hidden">
          <ArrowLeft size={20} />
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-[var(--red)]">
            <Store size={30} />
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-[Manrope] text-2xl font-black tracking-[-.03em] sm:text-3xl">
              <span className="truncate">{merchant.name}</span>
              <BadgeCheck size={22} className="shrink-0" aria-label="Verified merchant" />
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
              <MapPin size={14} /> {merchant.address}
            </p>
          </div>
        </div>
        {merchant.description && <p className="mt-4 max-w-2xl text-[15px] leading-6 text-white/90">{merchant.description}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {merchant.contact && (
            <a href={`tel:${merchant.contact.replace(/\s/g, "")}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#171717]">
              <Phone size={16} /> Call {merchant.contact}
            </a>
          )}
          <Link to="/client/quotations/new" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/50 px-4 text-sm font-bold">
            <ClipboardList size={16} /> Request a quotation
          </Link>
        </div>
      </section>

      <div className="px-5 pt-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [all.length, "Products"],
            [cats.length, "Categories"],
            [merchant.approvedAt || "—", "Verified since"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-[var(--soft)] px-2 py-3">
              <p className="truncate text-lg font-extrabold">{v}</p>
              <p className="text-xs text-[var(--muted)]">{l}</p>
            </div>
          ))}
        </div>

        <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]" role="group" aria-label="Store categories">
          {["", ...cats].map((c) => (
            <button key={c || "all"} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={`h-10 shrink-0 rounded-full border px-4 text-sm font-bold ${cat === c ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--line)] bg-[var(--surface)]"}`}>
              {c || "All"}
            </button>
          ))}
        </div>

        {list.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => <ProductTile key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            This merchant has no listed products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
