import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardPaste, ListPlus, UploadCloud } from "lucide-react";
import { useAppState } from "../../../context/AppStateContext";
import UploadPathway from "./UploadPathway";
import PastePathway from "./PastePathway";
import ManualPathway from "./ManualPathway";
import ReviewList from "./ReviewList";
import { toRow } from "./shared";

let TABS = [
  { id: "upload", label: "Upload", icon: UploadCloud, hint: "Photo or PDF" },
  { id: "paste", label: "Paste", icon: ClipboardPaste, hint: "Copy and paste" },
  { id: "manual", label: "Type in", icon: ListPlus, hint: "Search and add" },
];

export default function MaterialListBuilder() {
  let { createQuotationFull } = useAppState();
  let navigate = useNavigate();
  let [params] = useSearchParams();
  let initial = TABS.some((t) => t.id === params.get("mode")) ? params.get("mode") : "upload";
  let [tab, setTab] = useState(initial);
  let [review, setReview] = useState(null); // { source, label, warnings }
  let [rows, setRows] = useState([]);
  let [meta, setMeta] = useState({ name: "", deliveryLocation: "", neededBy: "", confirmedAll: false });
  let [submitting, setSubmitting] = useState(false);

  function fromExtraction(result, source) {
    setRows(result.items.map(toRow));
    setReview({ source, label: result.label, warnings: result.warnings });
    setMeta((m) => ({ ...m, confirmedAll: false }));
    window.scrollTo?.({ top: 0 });
  }
  function fromManual(items) {
    setRows(items);
    setReview({ source: "manual", label: "", warnings: [] });
    setMeta((m) => ({ ...m, confirmedAll: false }));
    window.scrollTo?.({ top: 0 });
  }
  function submit() {
    setSubmitting(true);
    let id = createQuotationFull({
      name: meta.name,
      deliveryLocation: meta.deliveryLocation,
      neededBy: meta.neededBy,
      source: review.source,
      items: rows.map((r) => ({ id: r.id, name: r.name.trim(), quantity: Number(r.quantity), unit: r.unit, specs: r.specs.trim(), notes: r.notes.trim(), category: "", brand: "" })),
    });
    navigate(`/client/quotations/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
      {!review ? (
        <>
          <h1 className="font-[Manrope] text-3xl font-black tracking-[-.04em]">Get a quotation</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Send your materials list once. Merchants that can supply at least 60% of it will quote.</p>
          <div role="tablist" aria-label="How do you want to add materials?" className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-[var(--soft)] p-1.5">
            {TABS.map(({ id, label, icon: Icon, hint }) => (
              <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold transition ${tab === id ? "bg-[var(--surface)] text-[var(--red)] shadow-sm" : "text-[var(--muted)]"}`}>
                <Icon size={18} /> {label}
                <span className="hidden text-[11px] font-medium sm:block">{hint}</span>
              </button>
            ))}
          </div>
          <div className="mt-5" role="tabpanel">
            {tab === "upload" && <UploadPathway onExtracted={fromExtraction} />}
            {tab === "paste" && <PastePathway onExtracted={fromExtraction} />}
            {tab === "manual" && <ManualPathway onDone={fromManual} initialName={params.get("material") || ""} />}
          </div>
        </>
      ) : (
        <ReviewList source={review.source} label={review.label} warnings={review.warnings} rows={rows} setRows={setRows} meta={meta} setMeta={setMeta} onBack={() => setReview(null)} onSubmit={submit} submitting={submitting} />
      )}
    </div>
  );
}
