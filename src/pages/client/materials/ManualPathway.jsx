import { useMemo, useState } from "react";
import { ListPlus, Plus, Search, X } from "lucide-react";
import { COMMON_MATERIALS } from "../../../data/commonMaterials";
import { searchCatalogue } from "../../../services/productSearch";
import { MARKET_CATEGORIES } from "../../../constants/marketCategories";
import { UNITS, fieldCls, cardCls, newRow } from "./shared";

let blank = { name: "", quantity: "", unit: "", specs: "", notes: "" };

export default function ManualPathway({ onDone, initialName = "" }) {
  let [form, setForm] = useState({ ...blank, name: initialName });
  let [category, setCategory] = useState("");
  let [query, setQuery] = useState("");
  let [staged, setStaged] = useState([]);
  let [error, setError] = useState("");

  let matches = useMemo(() => {
    let q = query.trim().toLowerCase();
    if (!q && !category) return [];
    let pool = COMMON_MATERIALS.filter((m) => !category || m.category === category).map((m) => ({ ...m, name: `${m.name} ${m.specs}`.trim(), specs: "", __orig: m }));
    if (!q) return pool.slice(0, 8).map((m) => m.__orig);
    return searchCatalogue(q, pool, { limit: 8 }).results.map((r) => r.product.__orig);
  }, [query, category]);

  function pick(m) {
    setForm({ ...form, name: m.name, unit: m.unit, specs: m.specs });
    setQuery("");
    setError("");
  }
  function add() {
    if (!form.name.trim()) return setError("Enter or choose a material.");
    if (!(Number(form.quantity) > 0)) return setError("Enter a quantity above zero.");
    setStaged([...staged, newRow({ ...form, name: form.name.trim() })]);
    setForm(blank);
    setError("");
  }
  let set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold">Type in your materials</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Search common materials or type your own, then add quantity and unit.</p>
      </div>

      <div className={`${cardCls} space-y-3`}>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label="Category">
          {[{ name: "", short: "All" }, ...MARKET_CATEGORIES].map((c) => (
            <button key={c.name || "all"} type="button" aria-pressed={category === c.name} onClick={() => setCategory(c.name)}
              className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold ${category === c.name ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--line)]"}`}>
              {c.short}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input className={`${fieldCls} pl-10`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search materials (cement, iron rod, tile…)" aria-label="Search materials" />
        </div>
        {matches.length > 0 && (
          <ul className="max-h-56 divide-y divide-[var(--line)] overflow-y-auto rounded-xl border border-[var(--line)]" aria-label="Matching materials">
            {matches.map((m, i) => (
              <li key={`${m.name}-${m.specs}-${i}`}>
                <button type="button" onClick={() => pick(m)} className="flex min-h-12 w-full items-center justify-between gap-2 px-3 text-left text-sm">
                  <span className="font-semibold">{m.name}{m.specs ? ` ${m.specs}` : ""}</span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">{m.category}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {(query.trim() || category) && !matches.length && <p className="text-sm text-[var(--muted)]">No common match. Type the material name below instead.</p>}

        <input className={fieldCls} value={form.name} onChange={set("name")} placeholder="Material name" aria-label="Material name" />
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} type="number" inputMode="decimal" min="0" value={form.quantity} onChange={set("quantity")} placeholder="Quantity" aria-label="Quantity" />
          <select className={fieldCls} value={form.unit} onChange={set("unit")} aria-label="Unit">
            <option value="">Any unit</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <input className={fieldCls} value={form.specs} onChange={set("specs")} placeholder="Specification (e.g. 12mm, 50kg)" aria-label="Specification" />
        <input className={fieldCls} value={form.notes} onChange={set("notes")} placeholder="Notes (optional)" aria-label="Notes" />
        {error && <p role="alert" className="text-sm font-semibold text-[var(--red)]">{error}</p>}
        <button type="button" onClick={add} className="secondary min-h-12 w-full"><Plus size={18} /> Add to list</button>
      </div>

      {staged.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">Your list ({staged.length})</h3>
          <ul className="space-y-2">
            {staged.map((r) => (
              <li key={r.id} className={`${cardCls} flex items-center gap-3 !p-3`}>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-bold">{r.name}{r.specs ? ` · ${r.specs}` : ""}</p>
                  <p className="text-[var(--muted)]">{r.quantity} {r.unit || "(any unit)"}</p>
                </div>
                <button type="button" aria-label={`Remove ${r.name}`} onClick={() => setStaged(staged.filter((x) => x.id !== r.id))} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] text-[var(--red)]"><X size={16} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" disabled={!staged.length} onClick={() => onDone(staged)} className="primary min-h-12 w-full disabled:opacity-50">
        <ListPlus size={18} /> Review my list ({staged.length})
      </button>
    </div>
  );
}
