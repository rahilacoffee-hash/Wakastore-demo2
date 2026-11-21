import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { merchantIdOf } from "../data/quoteSeed";

export const REQUIRED_DOCS = [
  { type: "cac", label: "Business registration (CAC certificate)" },
  { type: "owner-id", label: "Owner's valid ID" },
  { type: "address", label: "Proof of business address" },
  { type: "bank", label: "Settlement bank account confirmation" },
];
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = /\.(pdf|png|jpe?g)$/i;
const tone = { Submitted: "bg-amber-100 text-amber-900", Verified: "bg-emerald-100 text-emerald-800", "Needs correction": "bg-[var(--blush)] text-[var(--red)]", Missing: "bg-[var(--soft)] text-[var(--muted)]" };
const docOf = (merchant, type) => (merchant?.documents || []).find((d) => d.type === type);
export const docsSummary = (merchant) => ({ verified: REQUIRED_DOCS.filter((d) => docOf(merchant, d.type)?.status === "Verified").length, submitted: REQUIRED_DOCS.filter((d) => docOf(merchant, d.type)).length, total: REQUIRED_DOCS.length });

const setDocs = (updateState, merchantId, fn) => updateState((prev) => ({ ...prev, merchants: prev.merchants.map((m) => (m.id === merchantId ? { ...m, documents: fn(m.documents || []) } : m)) }));

/* Merchant: upload the verification documents admin needs before approval. Only file metadata is stored in this prototype. */
export function MerchantDocuments() {
  const { state, updateState } = useAppState();
  const merchantId = merchantIdOf(state);
  const merchant = state.merchants.find((m) => m.id === merchantId);
  const [errors, setErrors] = useState({});
  const upload = (type, file) => {
    if (!file) return;
    if (!OK_TYPES.test(file.name)) return setErrors((e) => ({ ...e, [type]: "Upload a PDF, PNG or JPG file." }));
    if (file.size > MAX_BYTES) return setErrors((e) => ({ ...e, [type]: "The file is larger than 5 MB." }));
    setErrors((e) => ({ ...e, [type]: "" }));
    setDocs(updateState, merchantId, (docs) => [...docs.filter((d) => d.type !== type), { type, fileName: file.name, size: file.size, uploadedAt: new Date().toISOString(), status: "Submitted", note: "" }]);
  };
  const s = docsSummary(merchant);
  return (
    <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <h3 className="flex items-center gap-2 text-lg font-extrabold"><FileCheck2 size={18} /> Verification documents</h3>
      <p className="mt-1 text-xs text-[var(--muted)]">{s.verified} of {s.total} verified. An admin reviews these before your store is approved. (Prototype: file names are recorded, files are not stored.)</p>
      <div className="mt-3 divide-y divide-[var(--line)]">
        {REQUIRED_DOCS.map(({ type, label }) => {
          const d = docOf(merchant, type);
          const status = d?.status || "Missing";
          return (
            <div key={type} className="py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><b>{label}</b><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${tone[status]}`}>{status}</span></div>
              {d && <p className="text-xs text-[var(--muted)]">{d.fileName} · {(d.size / 1024).toFixed(0)} KB</p>}
              {d?.status === "Needs correction" && d.note && <p className="mt-1 rounded-lg bg-[var(--blush)] p-2 text-xs text-[var(--red)]">Admin: {d.note}</p>}
              {d?.status !== "Verified" && <label className="mt-2 inline-block cursor-pointer rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold">{d ? "Replace file" : "Upload file"}<input type="file" aria-label={`Upload ${label}`} accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(e) => { upload(type, e.target.files?.[0]); e.target.value = ""; }} /></label>}
              {errors[type] && <p role="alert" className="mt-1 text-xs font-bold text-[var(--red)]">{errors[type]}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* Admin: verify each document or ask for a correction. */
export function MerchantDocumentReview({ merchant }) {
  const { updateState } = useAppState();
  const [notes, setNotes] = useState({});
  const s = docsSummary(merchant);
  const review = (type, status, note = "") => {
    setDocs(updateState, merchant.id, (docs) => docs.map((d) => (d.type === type ? { ...d, status, note, reviewedAt: new Date().toISOString() } : d)));
    updateState((prev) => ({ ...prev, auditLogs: [{ id: `audit-${Date.now()}-${type}`, actor: prev.session?.name || "Admin", action: status === "Verified" ? "Verified merchant document" : "Requested document correction", entity: `${merchant.name} · ${type}`, date: new Date().toLocaleString("en-NG"), details: note || "" }, ...prev.auditLogs] }));
  };
  return (
    <details className="mt-3 rounded-xl bg-[var(--soft)] p-3 text-sm">
      <summary className="cursor-pointer font-bold">Documents: {s.submitted} of {s.total} submitted · {s.verified} verified</summary>
      <div className="mt-2 space-y-2">
        {REQUIRED_DOCS.map(({ type, label }) => {
          const d = docOf(merchant, type);
          return (
            <div key={type} className="rounded-lg bg-[var(--surface)] p-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tone[d?.status || "Missing"]}`}>{d?.status || "Missing"}</span></div>
              {d && <p className="text-xs text-[var(--muted)]">{d.fileName} · uploaded {new Date(d.uploadedAt).toLocaleDateString("en-NG")}</p>}
              {d && d.status !== "Verified" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => review(type, "Verified")} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Verify</button>
                  <input aria-label={`Correction note for ${label}`} value={notes[type] || ""} onChange={(e) => setNotes((n) => ({ ...n, [type]: e.target.value }))} placeholder="What needs correcting?" className="min-w-[140px] flex-1 rounded-lg border border-[var(--line)] px-2 py-1 text-xs" />
                  <button type="button" disabled={!(notes[type] || "").trim()} onClick={() => review(type, "Needs correction", notes[type].trim())} className="rounded-lg border border-[var(--line)] px-3 py-1 text-xs font-bold disabled:opacity-50">Request correction</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
