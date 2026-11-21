import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, Wrench } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import { SMARTFIXER_JOBS, jobToLines, procurementTimeline } from "../../services/smartfixer";

const card = "rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5";

/* The status SmartFixer receives for a linked procurement. Derived from the live quotation and order so it cannot drift. */
export function SmartFixerStatusCard({ quotation }) {
  const { state, updateState } = useAppState();
  const job = SMARTFIXER_JOBS.find((j) => j.id === quotation.smartfixerJobId);
  const offers = (state.merchantQuotes || []).filter((m) => m.quotationId === quotation.id);
  const order = (state.orders || []).find((o) => o.id === quotation.orderId);
  const { steps, exception } = procurementTimeline({ quotation, offers, order });
  const last = [...steps].reverse().find((s) => s.done);
  const share = (on) => updateState((prev) => ({ ...prev, quotations: prev.quotations.map((q) => (q.id === quotation.id ? { ...q, fixerCanView: on } : q)) }));
  return (
    <section className={card} aria-label="SmartFixer procurement status">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[var(--red)]"><Wrench size={14} /> SmartFixer job {quotation.smartfixerJobId}</p>
          <h2 className="mt-1 text-lg font-extrabold">{job?.title || "Linked job"}{job ? ` · ${job.location}` : ""}</h2>
        </div>
        {exception && <span className="rounded-full bg-[var(--blush)] px-3 py-1 text-xs font-bold text-[var(--red)]">Exception needs attention</span>}
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.key} className={`flex items-center gap-2 rounded-xl p-2.5 text-sm ${s.done ? "bg-emerald-50 text-emerald-900" : "bg-[var(--soft)] text-[var(--muted)]"}`}>
            {s.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}{s.label}
          </li>
        ))}
      </ol>
      <label className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--soft)] p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={Boolean(quotation.fixerCanView)} onChange={(e) => share(e.target.checked)} />
        <span><b>Let {job?.fixer || "the fixer"} see this procurement status in SmartFixer</b><br />
          <span className="text-xs text-[var(--muted)]">{quotation.fixerCanView ? `Shared. Fixer view: "${last ? last.label : "Not started"}". They can see whether materials are ordered, delivered and accepted, but not prices or payment details.` : "Not shared. Only you can see this status."}</span></span>
      </label>
      <p className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]"><ExternalLink size={13} /> Return to the SmartFixer job to track the repair or construction work. (Prototype: SmartFixer is not connected, so there is no live link.)</p>
    </section>
  );
}

/* Customer picks a SmartFixer job whose materials are approved; the list is imported as-is. */
export default function SmartFixerImport() {
  const { state, createQuotationFull } = useAppState();
  const navigate = useNavigate();
  const linked = (jobId) => (state.quotations || []).find((q) => q.smartfixerJobId === jobId);
  const start = (job) => {
    const id = createQuotationFull({ name: `${job.title} · ${job.id}`, items: jobToLines(job), deliveryLocation: job.location, source: "smartfixer", smartfixerJobId: job.id });
    if (id) navigate(`/client/quotations/${id}`);
  };
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-28 pt-5 sm:px-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--red)]">SmartFixer</p>
        <h1 className="mt-1 text-3xl font-black">Procure materials for your jobs</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Materials your fixer has prepared and you approved in SmartFixer come across with their quantities and specifications intact. You do not retype anything. (Prototype: these jobs are sample data.)</p>
      </div>
      {SMARTFIXER_JOBS.map((job) => {
        const q = linked(job.id);
        const ready = job.status === "Materials approved";
        return (
          <section key={job.id} className={card}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="text-lg font-extrabold">{job.title} <span className="text-sm font-semibold text-[var(--muted)]">· {job.id}</span></h2><p className="text-xs text-[var(--muted)]">{job.location} · Fixer: {job.fixer}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{job.status}</span>
            </div>
            <div className="mt-3 divide-y divide-[var(--line)] text-sm">
              {job.materials.map((m, i) => <div key={i} className="flex justify-between gap-3 py-1.5"><span>{m.name}{m.specs ? ` · ${m.specs}` : ""}</span><b>{m.quantity} {m.unit}</b></div>)}
            </div>
            <div className="mt-4">
              {q ? <Link to={`/client/quotations/${q.id}`} className="inline-block rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-bold">View procurement · {q.id}</Link>
                : ready ? <button onClick={() => start(job)} className="rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white">Procure these materials in WakaStore</button>
                : <p className="text-xs text-[var(--muted)]">Waiting for you to approve the material list in SmartFixer.</p>}
            </div>
            {q && <div className="mt-4"><SmartFixerStatusCard quotation={q} /></div>}
          </section>
        );
      })}
    </div>
  );
}
