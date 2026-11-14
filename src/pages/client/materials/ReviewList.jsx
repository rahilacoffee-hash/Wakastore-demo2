import { AlertTriangle, ArrowLeft, Check, Merge, Plus, Send, Trash2 } from "lucide-react";
import { findDuplicates } from "../../../services/ai/materialParser";
import { searchCatalogue } from "../../../services/productSearch";
import { useAppState } from "../../../context/AppStateContext";
import { UNITS, cardCls, fieldCls, newRow, rowProblems } from "./shared";

let SOURCE_LABEL = { upload: "Uploaded document", paste: "Pasted text", manual: "Typed in" };

function CatalogueHint({ row, products, onUse }) {
  if (row.name.trim().length < 2) return null;
  let r = searchCatalogue({ name: row.name, specs: row.specs }, products);
  if (r.exact.length) return <p className="text-xs font-semibold text-emerald-700">In catalogue: {r.exact[0].product.name}{r.exact.length > 1 ? ` (+${r.exact.length - 1} more)` : ""}</p>;
  let top = r.results[0];
  if (top) return (
    <p className="text-xs">
      <span className="text-[var(--muted)]">{top.kind === "suggestion" ? "Did you mean " : "Closest catalogue product: "}</span>
      <button type="button" onClick={() => onUse(top.product)} className="font-bold text-[var(--red)] underline">{top.product.name}</button>
      <span className="text-[var(--muted)]">? Tap to use it. Nothing changes unless you tap.</span>
    </p>
  );
  return (
    <p className="text-xs text-[var(--muted)]">
      Not in the catalogue{r.otherSpecs.length ? ` in that size (other sizes: ${r.otherSpecs.map((p) => p.name).join(", ")})` : ""}. It stays in your request as a custom material and merchants will say if they can supply or source it.
    </p>
  );
}

export default function ReviewList({ source, label, warnings, rows, setRows, meta, setMeta, onBack, onSubmit, submitting }) {
  let { state } = useAppState();
  let confirmedAll = meta.confirmedAll;
  let problems = rows.map(rowProblems);
  let blocking = problems.reduce((n, p) => n + (p.length ? 1 : 0), 0);
  let dupGroups = findDuplicates(rows.map((r) => ({ ...r, name: r.name || "", unit: r.unit || "", specs: r.specs || "" })));
  let flaggedCount = rows.filter((r) => r.needsReview && !r.confirmed).length;
  let canSubmit = rows.length > 0 && blocking === 0 && confirmedAll && !submitting;

  function patch(id, changes) {
    setRows(rows.map((r) => {
      if (r.id !== id) return r;
      let next = { ...r, ...changes };
      // Editing a flagged line counts as the customer checking it, once it is complete.
      if (r.needsReview && !("confirmed" in changes) && next.name.trim() && Number(next.quantity) > 0) next.confirmed = true;
      return next;
    }));
  }
  function mergeGroup(group) {
    let items = group.map((i) => rows[i]);
    let sameUnit = items.every((r) => (r.unit || "") === (items[0].unit || ""));
    if (!sameUnit || items.some((r) => !(Number(r.quantity) > 0))) return;
    let total = items.reduce((n, r) => n + Number(r.quantity), 0);
    let keepId = items[0].id;
    let drop = new Set(items.slice(1).map((r) => r.id));
    setRows(rows.filter((r) => !drop.has(r.id)).map((r) => (r.id === keepId ? { ...r, quantity: total, confirmed: true, flags: r.flags.filter((f) => f !== "DUPLICATE") } : r)));
  }

  return (
    <div className="space-y-4">
      <div>
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-[var(--muted)]"><ArrowLeft size={16} /> Change how I add materials</button>
        <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">Review your list</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{SOURCE_LABEL[source] || "Materials"} · {rows.length} item{rows.length === 1 ? "" : "s"}. Check every line before you send it to merchants.</p>
      </div>

      {label && <p className="rounded-xl bg-[var(--soft)] p-3 text-xs leading-5 text-[var(--muted)]">{label}</p>}

      {(warnings.length > 0 || flaggedCount > 0) && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="status" aria-label="Extraction warnings">
          <p className="flex items-center gap-2 font-extrabold"><AlertTriangle size={17} /> {flaggedCount ? `${flaggedCount} line${flaggedCount === 1 ? "" : "s"} need your confirmation` : "Please note"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.slice(0, 8).map((w, i) => <li key={`${w.code}-${i}`}>{w.message}</li>)}
          </ul>
        </section>
      )}

      {dupGroups.map((g) => {
        let first = rows[g[0]];
        let canMerge = g.every((i) => (rows[i].unit || "") === (first.unit || "") && Number(rows[i].quantity) > 0);
        return (
          <div key={g.join("-")} className={`${cardCls} flex flex-wrap items-center justify-between gap-2 !p-3 text-sm`}>
            <span><b>{first.name || "Item"}</b> appears {g.length} times.</span>
            {canMerge ? (
              <button type="button" onClick={() => mergeGroup(g)} className="secondary min-h-10 px-3"><Merge size={15} /> Add quantities together</button>
            ) : <span className="text-xs text-[var(--muted)]">Check quantities or units, then merge by hand.</span>}
          </div>
        );
      })}

      <ul className="space-y-3">
        {rows.map((r, idx) => {
          let flagged = r.needsReview && !r.confirmed;
          let low = r.confidence < 0.7;
          return (
            <li key={r.id} className={`rounded-2xl border p-4 ${flagged ? "border-amber-400 bg-amber-50/60" : "border-[var(--line)] bg-[var(--surface)]"}`} aria-label={`Material ${idx + 1}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">Item {idx + 1}</span>
                <div className="flex items-center gap-2">
                  {r.needsReview && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.confirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-900"}`}>
                      {r.confirmed ? "Confirmed" : low ? "Unclear · check" : "Check this"}
                    </span>
                  )}
                  <button type="button" aria-label={`Remove item ${idx + 1}`} onClick={() => setRows(rows.filter((x) => x.id !== r.id))} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] text-[var(--red)]"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="grid gap-3">
                <input className={fieldCls} value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} placeholder="Material name" aria-label={`Material name ${idx + 1}`} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={`${fieldCls} ${!(Number(r.quantity) > 0) ? "border-amber-500" : ""}`} type="number" inputMode="decimal" min="0" value={r.quantity} onChange={(e) => patch(r.id, { quantity: e.target.value })} placeholder="Quantity" aria-label={`Quantity ${idx + 1}`} />
                  <select className={fieldCls} value={r.unit} onChange={(e) => patch(r.id, { unit: e.target.value })} aria-label={`Unit ${idx + 1}`}>
                    <option value="">Any unit</option>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <input className={fieldCls} value={r.specs} onChange={(e) => patch(r.id, { specs: e.target.value })} placeholder="Specification (e.g. 12mm, 50kg)" aria-label={`Specification ${idx + 1}`} />
                <input className={fieldCls} value={r.notes} onChange={(e) => patch(r.id, { notes: e.target.value })} placeholder="Notes (optional)" aria-label={`Notes ${idx + 1}`} />
                <CatalogueHint row={r} products={state.products || []} onUse={(p) => patch(r.id, { name: p.name, specs: "", unit: r.unit || p.unit || "" })} />
              </div>
              {flagged && (
                <button type="button" disabled={!r.name.trim() || !(Number(r.quantity) > 0)} onClick={() => patch(r.id, { confirmed: true })} className="secondary mt-3 min-h-11 w-full disabled:opacity-50">
                  <Check size={16} /> This line is correct
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={() => setRows([...rows, newRow()])} className="secondary min-h-12 w-full"><Plus size={18} /> Add another material</button>

      <div className={`${cardCls} space-y-3`}>
        <h3 className="font-extrabold">Request details</h3>
        <input className={fieldCls} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} placeholder="Name this list (e.g. 3-bedroom bungalow)" aria-label="List name" />
        <input className={fieldCls} value={meta.deliveryLocation} onChange={(e) => setMeta({ ...meta, deliveryLocation: e.target.value })} placeholder="Delivery location (e.g. Gwarinpa, Abuja)" aria-label="Delivery location" />
        <label className="block text-sm font-bold">Needed by (optional)
          <input type="date" className={`${fieldCls} mt-1`} value={meta.neededBy} onChange={(e) => setMeta({ ...meta, neededBy: e.target.value })} />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm font-semibold">
        <input type="checkbox" checked={confirmedAll} onChange={(e) => setMeta({ ...meta, confirmedAll: e.target.checked })} className="mt-0.5 h-5 w-5 accent-[var(--red)]" />
        I have checked every line and the quantities, units and specifications are correct.
      </label>

      {blocking > 0 && <p role="alert" className="text-sm font-semibold text-[var(--red)]">{blocking} line{blocking === 1 ? " needs" : "s need"} attention: {problems.flat().filter((v, i, a) => a.indexOf(v) === i).join(" ")}</p>}
      <button type="button" disabled={!canSubmit} onClick={onSubmit} className="primary min-h-14 w-full text-base disabled:opacity-50">
        <Send size={18} /> {submitting ? "Sending…" : "Send to matching merchants"}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">Merchants quote their own prices. AI never sets prices or stock.</p>
    </div>
  );
}
