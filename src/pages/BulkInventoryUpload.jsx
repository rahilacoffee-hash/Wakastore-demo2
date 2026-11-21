import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { merchantIdOf } from "../data/quoteSeed";
import { parseCsv, validateTable, TEMPLATE_CSV } from "../services/inventoryImport";
import { MERCHANT_CATEGORY_NAMES } from "../constants/categories";
import { formatNaira } from "../utils/formatters";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=700&q=80";

export default function BulkInventoryUpload() {
  const { state, addProduct, notify } = useAppState();
  const merchantId = merchantIdOf(state);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const readFile = async (file) => {
    setResult(null); setProblem(""); if (!file) return;
    setFileName(file.name); setBusy(true);
    try {
      let table;
      if (/\.csv$/i.test(file.name) || file.type === "text/csv") table = parseCsv(await file.text());
      else if (/\.xlsx$/i.test(file.name)) { const { readSheet } = await import("read-excel-file/browser"); table = await readSheet(file); }
      else { setProblem("Upload a .csv or .xlsx file. (Older .xls files: save as .xlsx or .csv first.)"); return; }
      const existing = state.products.filter((p) => p.merchantId === merchantId && !p.archived).map((p) => ({ name: p.name, unit: p.unit }));
      setResult(validateTable(table, { categories: MERCHANT_CATEGORY_NAMES, existing }));
    } catch { setProblem("We could not read that file. Check that it is a valid .csv or .xlsx file and try again."); }
    finally { setBusy(false); }
  };
  const importAll = () => {
    const merchantName = state.merchants.find((m) => m.id === merchantId)?.name || "Merchant";
    result.valid.forEach((r, i) => addProduct({ id: `p-${Date.now()}-${i}`, merchant: merchantName, merchantId, name: r.name, description: [r.brand, r.specs].filter(Boolean).join(" · "), brand: r.brand, category: r.category, unit: r.unit, price: r.price, stock: r.stock, available: r.stock > 0, image: DEFAULT_IMAGE, importedAt: new Date().toISOString() }));
    notify(`${result.valid.length} product${result.valid.length === 1 ? "" : "s"} imported.`, "success");
    setResult(null); setFileName("");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "wakastore-inventory-template.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-extrabold"><FileSpreadsheet size={18} /> Bulk upload (Excel or CSV)</h3>
        <button type="button" onClick={download} className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold">Download template</button>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">Columns: name, category, unit, price, stock (required); brand, specs (optional). Category must be one of the 30 official merchant categories. You stay responsible for keeping prices and stock current.</p>
      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--line)] p-3 text-sm font-bold">
        <Upload size={16} /> {fileName || "Choose a .csv or .xlsx file"}
        <input type="file" aria-label="Inventory file" accept=".csv,.xlsx,text/csv" className="sr-only" onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {busy && <p className="mt-2 text-sm text-[var(--muted)]">Reading file…</p>}
      {problem && <p role="alert" className="mt-2 text-sm font-bold text-[var(--red)]">{problem}</p>}
      {result?.headerProblems.length > 0 && <p role="alert" className="mt-2 text-sm font-bold text-[var(--red)]">{result.headerProblems.join(". ")}. Use the template for the exact headings.</p>}
      {result && !result.headerProblems.length && (
        <div className="mt-3 space-y-3 text-sm">
          <p><b>{result.valid.length}</b> ready to import · <b className={result.errors.length ? "text-[var(--red)]" : ""}>{result.errors.length}</b> with problems</p>
          {result.errors.length > 0 && <ul className="max-h-40 space-y-1 overflow-auto rounded-xl bg-[var(--blush)] p-3 text-xs text-[var(--red)]">{result.errors.map((e) => <li key={e.row}>Row {e.row}: {e.message}</li>)}</ul>}
          {result.valid.length > 0 && <div className="max-h-40 overflow-auto rounded-xl bg-[var(--soft)] p-3 text-xs">{result.valid.slice(0, 20).map((r, i) => <div key={i} className="flex justify-between gap-2"><span>{r.name} · {r.unit}</span><span>{formatNaira(r.price)} · {r.stock} in stock</span></div>)}{result.valid.length > 20 && <p className="mt-1 text-[var(--muted)]">…and {result.valid.length - 20} more</p>}</div>}
          <button type="button" disabled={!result.valid.length} onClick={importAll} className="rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Import {result.valid.length} valid product{result.valid.length === 1 ? "" : "s"}{result.errors.length ? " (skip the rest)" : ""}</button>
        </div>
      )}
    </section>
  );
}
