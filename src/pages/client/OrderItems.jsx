import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Truck } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import { formatNaira } from "../../utils/formatters";
import { COMMISSION, countsAsPriced, merchantAllocations, orderTotals, SOURCING } from "../../services/sourcing";

let STATUS_TEXT = {
  AVAILABLE: ["In stock", "bg-emerald-50 text-emerald-800"],
  OUT_OF_STOCK: ["Not in stock", "bg-amber-100 text-amber-900"],
  SOURCING_REQUESTED: ["Waiting for the merchant to confirm sourcing", "bg-amber-100 text-amber-900"],
  SOURCING_CONFIRMED: ["Sourcing confirmed", "bg-emerald-50 text-emerald-800"],
  SOURCING_DECLINED: ["Merchant could not source it", "bg-amber-100 text-amber-900"],
  REASSIGNMENT_PENDING: ["Finding another merchant", "bg-amber-100 text-amber-900"],
  REROUTED: ["Moved to another merchant, awaiting their confirmation", "bg-amber-100 text-amber-900"],
  AWAITING_MERCHANT: ["Awaiting merchant", "bg-amber-100 text-amber-900"],
  UNRESOLVED: ["Unresolved: needs manual sourcing", "bg-[#FCEBED] text-[#B90013]"],
};

function Item({ order, item }) {
  let { state, decideItemPrice, acceptOrderItem, reportItemProblem } = useAppState();
  let [msg, setMsg] = useState("");
  let [reporting, setReporting] = useState(false);
  let [reason, setReason] = useState("");
  let nameOf = (id) => state.merchants.find((m) => m.id === id)?.name || "a merchant";
  let [label, tone] = STATUS_TEXT[item.sourcingStatus] || [item.sourcingStatus, "bg-[var(--soft)]"];
  let rerouted = item.currentMerchantId !== item.originalMerchantId || item.history.some((h) => h.type === "REROUTED");
  let pending = item.priceApproval?.status === "PENDING";
  let declinedPrice = item.priceApproval?.status === "REJECTED";
  let run = (r) => setMsg(r.ok ? "" : r.error);

  return (
    <li className={`rounded-2xl border p-4 ${item.sourcingStatus === "UNRESOLVED" ? "border-[#F5D5D9] bg-[#FFF7F8]" : "border-[var(--line)] bg-[var(--surface)]"}`} data-item={item.itemId}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold">{item.name}{item.specification ? ` · ${item.specification}` : ""}</p>
          <p className="text-sm text-[var(--muted)]">{item.quantity} {item.unit || "units"}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{declinedPrice ? "You declined the price" : label}</span>
      </div>

      <p className="mt-2 text-sm">
        <b>Supplier:</b> {item.currentMerchantId ? nameOf(item.currentMerchantId) : "Not assigned yet"}
        {rerouted && item.originalMerchantId && item.currentMerchantId !== item.originalMerchantId && (
          <span className="ml-1 rounded-full bg-[var(--blush)] px-2 py-0.5 text-xs font-bold text-[var(--red)]">Rerouted from {nameOf(item.originalMerchantId)}</span>
        )}
      </p>
      {item.matchedProductName && <p className="text-xs text-[var(--muted)]">Supplied as: {item.matchedProductName}</p>}
      {item.sourcing && <p className="text-xs text-[var(--muted)]">Expected: {item.sourcing.eta}{item.sourcing.supplier ? ` · Source: ${item.sourcing.supplier}` : ""}{item.sourcing.notes ? ` · ${item.sourcing.notes}` : ""}</p>}

      <p className="mt-2 text-sm">
        {item.unitPrice == null
          ? <span className="text-[var(--muted)]">Price: pending. Not charged yet.</span>
          : <>Price: {formatNaira(item.unitPrice)} × {item.quantity} = <b>{formatNaira(item.unitPrice * item.quantity)}</b>{pending ? <span className="text-amber-800"> (not charged until you approve)</span> : null}</>}
      </p>

      {pending && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          <p className="flex items-center gap-2 font-bold"><AlertTriangle size={16} /> New price needs your approval</p>
          <p className="mt-1">{item.priceApproval.previousPrice == null ? "First price for this item" : `Was ${formatNaira(item.priceApproval.previousPrice)} per unit`}; now <b>{formatNaira(item.priceApproval.proposedPrice)}</b> per unit. Your order total does not change until you approve.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="primary min-h-11" onClick={() => run(decideItemPrice(order.id, item.itemId, "approve"))}>Approve price</button>
            <button type="button" className="secondary min-h-11" onClick={() => run(decideItemPrice(order.id, item.itemId, "reject"))}>Decline</button>
          </div>
        </div>
      )}

      {item.dispute?.status === "OPEN" && <p className="mt-2 rounded-lg bg-[var(--soft)] p-2 text-sm"><b>Problem reported:</b> {item.dispute.reason}. Payment for this item is on hold.</p>}
      {countsAsPriced(item) && !["SOURCING_REQUESTED", "REROUTED"].includes(item.sourcingStatus) && (
        <p className="mt-2 flex items-center gap-2 text-sm"><Truck size={15} /> Fulfilment: <b>{item.fulfilment.charAt(0) + item.fulfilment.slice(1).toLowerCase()}</b></p>
      )}
      {item.fulfilment === "DELIVERED" && !item.dispute && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="primary min-h-11" onClick={() => run(acceptOrderItem(order.id, item.itemId))}><CheckCircle2 size={16} /> I received this and it is correct</button>
          <button type="button" className="secondary min-h-11" onClick={() => setReporting(!reporting)}>Report a problem</button>
        </div>
      )}
      {item.fulfilment === "DELIVERED" && item.dispute?.status === "RELEASED" && (
        <button type="button" className="primary mt-2 min-h-11" onClick={() => run(acceptOrderItem(order.id, item.itemId))}>Hold released. Accept this item</button>
      )}
      {reporting && (
        <div className="mt-2 space-y-2">
          <textarea className="w-full rounded-xl border border-[var(--line)] p-3 text-sm" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What is wrong with this item?" aria-label="Problem description" />
          <button type="button" className="primary min-h-11" onClick={() => { let r = reportItemProblem(order.id, item.itemId, reason); run(r); if (r.ok) setReporting(false); }}>Send report and hold payment</button>
        </div>
      )}
      {msg && <p role="alert" className="mt-2 text-sm font-semibold text-[var(--red)]">{msg}</p>}

      <details className="mt-2 text-xs text-[var(--muted)]">
        <summary className="cursor-pointer font-semibold">History ({item.history.length})</summary>
        <ol className="mt-1 space-y-1">
          {item.history.map((h, i) => (
            <li key={i}><Clock3 size={11} className="mr-1 inline" />{new Date(h.at).toLocaleString("en-GB")} · {h.type.replace(/_/g, " ").toLowerCase()}{h.from || h.to ? ` (${h.from && typeof h.from === "string" && h.from.startsWith("m") ? nameOf(h.from) : h.from ?? ""}${h.from != null && h.to != null ? " → " : ""}${h.to && typeof h.to === "string" && h.to.startsWith("m") ? nameOf(h.to) : h.to ?? ""})` : ""}{h.note ? `. ${h.note}` : ""}</li>
          ))}
        </ol>
      </details>
    </li>
  );
}

// One coordinated order, shown item by item with the merchant responsible for each.
export default function OrderItems({ order }) {
  let { state } = useAppState();
  if (!order.items?.length || !order.items.every((i) => i.itemId)) return null;
  let t = orderTotals(order, 0.025);
  let alloc = merchantAllocations(order);
  let nameOf = (id) => state.merchants.find((m) => m.id === id)?.name || "Merchant";
  return (
    <section className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5" aria-label="Materials in this order">
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--muted)]">One order · {order.subOrders?.length || 0} merchant{order.subOrders?.length === 1 ? "" : "s"}</p>
      <h2 className="mt-1 text-lg font-extrabold">Your materials, item by item</h2>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        {t.pendingApprovalCount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{t.pendingApprovalCount} price{t.pendingApprovalCount === 1 ? "" : "s"} awaiting your approval ({formatNaira(t.pendingApprovalAmount)})</span>}
        {t.unpricedCount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{t.unpricedCount} unpriced</span>}
        {t.unresolvedCount > 0 && <span className="rounded-full bg-[#FCEBED] px-2.5 py-1 text-[#B90013]">{t.unresolvedCount} unresolved</span>}
      </div>
      <ul className="mt-3 space-y-3">{order.items.map((item) => <Item key={item.itemId} order={order} item={item} />)}</ul>
      {alloc.length > 0 && (
        <div className="mt-4 rounded-xl bg-[var(--soft)] p-3 text-xs">
          <p className="font-bold">Payment split per merchant (SIMULATION, no real money). {COMMISSION.merchant}% merchant / {COMMISSION.platform}% WakaStore, settled item by item after you accept.</p>
          <ul className="mt-1 space-y-0.5">
            {alloc.map((a) => (
              <li key={a.merchantId}>{nameOf(a.merchantId)}: settled {formatNaira(a.settled.merchantShare)} · pending {formatNaira(a.pending.merchantShare)}{a.held.gross ? ` · on hold ${formatNaira(a.held.gross)}` : ""}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export { SOURCING };
