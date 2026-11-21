import { Check, Loader2, Sparkles } from "lucide-react";

export default function ExtractionProgress({ progress }) {
  let steps = progress?.steps || [];
  let current = progress?.step ?? 0;
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center" role="status" aria-live="polite">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--blush)] text-[var(--red)]"><Sparkles size={26} /></span>
      <h2 className="mt-3 text-lg font-extrabold">Extracting your materials</h2>
      <p className="text-sm text-[var(--muted)]">AI demo · nothing is sent anywhere</p>
      <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-[var(--soft)]">
        <div className="h-full bg-[var(--red)] transition-all duration-500" style={{ width: `${progress?.percent ?? 5}%` }} />
      </div>
      <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 ${i > current ? "text-[var(--muted)]" : "font-semibold"}`}>
            {i < current ? <Check size={16} className="text-emerald-600" /> : i === current ? <Loader2 size={16} className="animate-spin text-[var(--red)]" /> : <span className="h-4 w-4 rounded-full border border-[var(--line)]" />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
