import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import { MARKET_CATEGORIES } from "../../constants/marketCategories";
import ProductTile from "../../components/ui/ProductTile";

let SORTS = [
  ["recommended", "Recommended"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
  ["name", "Name: A to Z"],
];

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="aspect-[1.2/1] bg-[var(--soft)]" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/2 rounded bg-[var(--soft)]" />
            <div className="h-4 w-4/5 rounded bg-[var(--soft)]" />
            <div className="h-4 w-1/3 rounded bg-[var(--soft)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Explore() {
  let { state } = useAppState();
  let [params, setParams] = useSearchParams();
  let [text, setText] = useState(params.get("search") || "");
  let [sheet, setSheet] = useState(false);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    let t = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => setText(params.get("search") || ""), [params]);

  let category = params.get("category") || "";
  let merchantId = params.get("merchant") || "";
  let min = params.get("min") || "";
  let max = params.get("max") || "";
  let availability = params.get("availability") || "in";
  let sort = params.get("sort") || "recommended";
  let term = (params.get("search") || "").trim().toLowerCase();

  let merchants = (state.merchants || []).filter((m) => m.status === "approved");
  let merchantName = (p) => merchants.find((m) => m.id === p.merchantId)?.name || p.merchant || "";

  function patch(changes) {
    let next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  }

  let results = useMemo(() => {
    let list = (state.products || []).filter((p) => {
      let m = (state.merchants || []).find((x) => x.id === p.merchantId);
      if (m && m.status !== "approved") return false;
      if (p.archived || p.available === false) return false;
      if (availability === "in" && !(Number(p.stock ?? 1) > 0)) return false;
      if (category && p.category !== category) return false;
      if (merchantId && p.merchantId !== merchantId) return false;
      if (min !== "" && Number(p.price) < Number(min)) return false;
      if (max !== "" && Number(p.price) > Number(max)) return false;
      if (term) {
        let hay = `${p.name} ${p.description || ""} ${p.brand || ""} ${p.category} ${merchantName(p)}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.products, state.merchants, category, merchantId, min, max, availability, sort, term]);

  let activeFilters = [merchantId, min, max, availability !== "in" ? availability : ""].filter(Boolean).length;
  let field = "h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--red)]";

  function clearAll() {
    setText("");
    setParams({}, { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-6 pt-[max(18px,env(safe-area-inset-top))] sm:px-8 lg:px-0">
      <h1 className="font-[Manrope] text-3xl font-black tracking-[-.04em]">Explore</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Compare materials from verified merchants.</p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          patch({ search: text.trim() });
        }}
      >
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3">
          <Search size={19} className="shrink-0 text-[var(--muted)]" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search materials or merchants"
            aria-label="Search marketplace"
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          {text && (
            <button type="button" aria-label="Clear search" onClick={() => { setText(""); patch({ search: "" }); }}>
              <X size={18} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--red)] text-white"
          aria-label="Open filters"
        >
          <SlidersHorizontal size={20} />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#171717] px-1 text-[11px] font-bold">
              {activeFilters}
            </span>
          )}
        </button>
      </form>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]" role="group" aria-label="Filter by category">
        {[{ name: "" , label: "All" }, ...MARKET_CATEGORIES.map((c) => ({ name: c.name, label: c.name }))].map((c) => (
          <button
            key={c.label}
            type="button"
            aria-pressed={category === c.name}
            onClick={() => patch({ category: c.name })}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm font-bold ${
              category === c.name
                ? "border-[var(--red)] bg-[var(--red)] text-white"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm" aria-live="polite">
        <span>
          <strong>{loading ? "…" : results.length}</strong> product{results.length === 1 ? "" : "s"}
        </span>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Sort
          <select value={sort} onChange={(e) => patch({ sort: e.target.value === "recommended" ? "" : e.target.value })} className="h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-sm">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        {loading ? (
          <Skeleton />
        ) : results.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {results.map((p) => <ProductTile key={p.id || p.name} product={p} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center">
            <h2 className="text-lg font-extrabold">No materials match</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
              Try fewer filters, or send us your materials list and merchants will quote for you.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button type="button" onClick={clearAll} className="h-12 rounded-xl border border-[var(--line)] px-5 text-sm font-bold">
                Clear filters
              </button>
              <Link to="/client/quotations/new" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--red)] px-5 text-sm font-bold text-white">
                Request a quotation <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/45 sm:items-center sm:justify-center" onClick={() => setSheet(false)} role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Filters</h2>
              <button type="button" aria-label="Close filters" onClick={() => setSheet(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--soft)]">
                <X size={19} />
              </button>
            </div>
            <label className="block text-sm font-bold">
              Merchant
              <select value={merchantId} onChange={(e) => patch({ merchant: e.target.value })} className={`${field} mt-2`}>
                <option value="">All merchants</option>
                {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold">
                Min price (₦)
                <input inputMode="numeric" value={min} onChange={(e) => patch({ min: e.target.value.replace(/\D/g, "") })} className={`${field} mt-2`} placeholder="0" />
              </label>
              <label className="block text-sm font-bold">
                Max price (₦)
                <input inputMode="numeric" value={max} onChange={(e) => patch({ max: e.target.value.replace(/\D/g, "") })} className={`${field} mt-2`} placeholder="Any" />
              </label>
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-bold">Availability</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[["in", "In stock only"], ["all", "Include out of stock"]].map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={availability === v} onClick={() => patch({ availability: v === "in" ? "" : v })} className={`h-12 rounded-xl border text-sm font-bold ${availability === v ? "border-[var(--red)] bg-[var(--blush)] text-[var(--red)]" : "border-[var(--line)]"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { patch({ merchant: "", min: "", max: "", availability: "" }); }} className="h-12 flex-1 rounded-xl border border-[var(--line)] font-bold">
                Reset
              </button>
              <button type="button" onClick={() => setSheet(false)} className="h-12 flex-[1.4] rounded-xl bg-[var(--red)] font-bold text-white">
                Show {results.length} result{results.length === 1 ? "" : "s"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
