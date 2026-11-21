import { CANONICAL_UNITS } from "../../../services/ai/materialParser";

export const UNITS = CANONICAL_UNITS;
export const fieldCls =
  "h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--red)]";
export const cardCls = "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4";
export const MAX_FILES = 6;
export const MAX_FILE_MB = 10;
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const newRow = (over = {}) => ({
  id: `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  name: "", quantity: "", unit: "", specs: "", notes: "",
  confidence: 1, flags: [], needsReview: false, confirmed: true,
  ...over,
});

// Extraction result item -> editable review row. Flagged lines start unconfirmed.
export const toRow = (item) => ({
  id: item.id,
  name: item.name || "",
  quantity: item.quantity ?? "",
  unit: item.unit || "",
  specs: item.specs || "",
  notes: item.notes || "",
  confidence: item.confidence ?? 1,
  flags: item.flags || [],
  needsReview: Boolean(item.needsReview),
  confirmed: !item.needsReview,
});

export const rowProblems = (r) => {
  let p = [];
  if (!r.name.trim()) p.push("Enter a material name.");
  if (!(Number(r.quantity) > 0)) p.push("Enter a quantity above zero.");
  if (r.needsReview && !r.confirmed) p.push("Check this line and confirm it.");
  return p;
};

export const formatBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
