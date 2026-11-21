import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, PackageSearch } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { formatNaira } from "../utils/formatters";
import { FULFILMENT, countsAsPriced, itemsForMerchant, merchantAllocations, SOURCING } from "../services/sourcing";

let inputCls = "h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--red)]";
let NEXT_LABEL = { PREPARING: "Mark as preparing", READY: "Mark as ready", DISPATCHED: "Mark as dispatched", DELIVERED: "Mark as delivered" };

function SourcingDecision({ order, item }) {
  let { confirmItemSourcing, declineItemSourcing } = useAppState();
  let [canSource, setCanSource] = useState(false);
  let [form, setForm] = useState({ price: "", eta: "", supplier: "", notes: "", finalPriceConfirmed: false });
  let [declining, setDeclining] = useState(false);
  let [reason, setReason] = useState("");
  let [error, setError] = useState("");
  let set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  let line = Number(form.price) > 0 ? Number(form.price) * item.quantity : 0;

  function confirm() {
    let r = confirmItemSourcing(order.id, item.itemId, { confirmed: canSource, price: form.price, eta: form.eta, supplier: form.supplier, notes: form.notes, finalPriceConfirmed: form.finalPriceConfirmed });
    setError(r.ok ? "" : r.error);
  }
  function decline() {
    let r = declineItemSourcing(order.id, item.itemId, { confirmed: true, reason });
    setError(r.ok ? "" : r.error);
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="flex items-start gap-3 rounded-xl border border-amber-300 bg-white p-3 text-[15px] font-bold">
        <input type="checkbox" checked={canSource} onChange={(e) => setCanSource(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--red)]" />
        I can source this product.
      </label>
      {canSource && (
        <div className="space-y-3 rounded-xl bg-white p-3">
          <label className="block text-sm font-bold">Sourcing price per {item.unit || "unit"} (₦)
            <input className={`${inputCls} mt-1 h-14 text-2xl font-extrabold`} inputMode="decimal" value={form.price} onChange={set("price")} placeholder="0" aria-label={`Sourcing price for ${item.name}`} />
          </label>
          <p className="text-sm">{item.quantity} × {Number(form.price) > 0 ? formatNaira(Number(form.price)) : "—"} = <b>{formatNaira(line)}</b></p>
          <label className="block text-sm font-bold">Expected availability / timeframe
            <input className={`${inputCls} mt-1`} value={form.eta} onChange={set("eta")} placeholder="e.g. 3 days" aria-label="Expected timeframe" />
          </label>
          <label className="block text-sm font-bold">Supplier or sourcing notes
            <input className={`${inputCls} mt-1`} value={form.supplier} onChange={set("supplier")} placeholder="Where will you source it?" aria-label="Supplier" />
          </label>
          <label className="block text-sm font-bold">Notes for the customer (optional)
            <input className={`${inputCls} mt-1`} value={form.notes} onChange={set("notes")} aria-label="Sourcing notes" />
          </label>
          <label className="flex items-start gap-3 text-sm font-semibold">
            <input type="checkbox" checked={form.finalPriceConfirmed} onChange={(e) => setForm({ ...form, finalPriceConfirmed: e.target.checked })} className="mt-0.5 h-5 w-5 accent-[var(--red)]" />
            I confirm this is my final price.
          </label>
          <button type="button" className="primary min-h-12 w-full" onClick={confirm}>Confirm sourcing</button>
        </div>
      )}
      {!declining ? (
        <button type="button" className="secondary min-h-12 w-full" onClick={() => setDeclining(true)}>Cannot source this product</button>
      ) : (
        <div className="space-y-2 rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
          <p className="font-bold">Are you sure?</p>
          <p className="text-[var(--muted)]">Only this product will be offered to another eligible merchant. Your other items in this order stay with you.</p>
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" aria-label="Reason" />
          <div className="flex gap-2">
            <button type="button" className="primary min-h-12 flex-1" onClick={decline}>Yes, I cannot source it</button>
            <button type="button" className="secondary min-h-12" onClick={() => setDeclining(false)}>Keep it</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-[var(--red)]">{error}</p>}
    </div>
  );
}

function MyItem({ order, item }) {
  let { advanceItemFulfilment, declineItemSourcing } = useAppState();
  let [error, setError] = useState("");
  let [withdrawing, setWithdrawing] = useState(false);
  let awaiting = [SOURCING.SOURCING_REQUESTED, SOURCING.REROUTED].includes(item.sourcingStatus);
  let next = FULFILMENT[FULFILMENT.indexOf(item.fulfilment) + 1];
  let canAdvance = countsAsPriced(item) && [SOURCING.AVAILABLE, SOURCING.SOURCING_CONFIRMED].includes(item.sourcingStatus) && next && next !== "ACCEPTED";
  let pendingApproval = item.priceApproval?.status === "PENDING";

  return (
    <li className={`rounded-2xl p-4 ${awaiting ? "border-2 border-amber-400 bg-amber-50" : "border border-[var(--line)] bg-[var(--surface)]"}`} data-item={item.itemId}>
      <p className="text-lg font-extrabold">{item.name}{item.specification ? ` · ${item.specification}` : ""}</p>
      <p className="text-sm">Requested quantity: <b>{item.quantity} {item.unit || "units"}</b></p>
      {awaiting && (
        <>
          <p className="mt-1 flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle size={16} /> Availability: Not currently in stock{item.sourcingStatus === SOURCING.REROUTED ? " (rerouted to you; the previous merchant could not source it)" : ""}</p>
          <SourcingDecision order={order} item={item} />
        </>
      )}
      {!awaiting && item.sourcing && (
        <p className="mt-1 text-sm">Sourcing confirmed at <b>{formatNaira(item.sourcing.price)}</b> per {item.unit || "unit"}, expected {item.sourcing.eta}. <span className="text-xs text-[var(--muted)]">Confirmed {new Date(item.sourcing.confirmedAt).toLocaleString("en-GB")}{item.sourcing.supplier ? ` · ${item.sourcing.supplier}` : ""}</span></p>
      )}
      {!awaiting && !item.sourcing && item.unitPrice != null && <p className="mt-1 text-sm">In stock · {formatNaira(item.unitPrice)} per {item.unit || "unit"} · line total <b>{formatNaira(item.unitPrice * item.quantity)}</b></p>}
      {pendingApproval && <p className="mt-2 rounded-lg bg-amber-100 p-2 text-sm font-semibold text-amber-900"><Clock3 size={14} className="mr-1 inline" />Waiting for the customer to approve this price. You can start once they do.</p>}
      {item.dispute?.status === "OPEN" && <p className="mt-2 rounded-lg bg-[var(--soft)] p-2 text-sm"><b>Customer reported a problem:</b> {item.dispute.reason}. Payment for this item is on hold.</p>}
      {item.sourcingStatus === SOURCING.UNRESOLVED && <p className="mt-2 text-sm font-semibold text-[var(--red)]">Customer declined the price. This item is unresolved.</p>}
      {countsAsPriced(item) && !awaiting && <p className="mt-2 text-sm">Fulfilment: <b>{item.fulfilment.charAt(0) + item.fulfilment.slice(1).toLowerCase()}</b></p>}
      {canAdvance && (
        <button type="button" className="primary mt-2 min-h-12" onClick={() => { let r = advanceItemFulfilment(order.id, item.itemId, next); setError(r.ok ? "" : r.error); }}>
          <CheckCircle2 size={16} /> {NEXT_LABEL[next]}
        </button>
      )}
      {item.sourcingStatus === SOURCING.AVAILABLE && item.fulfilment === "PENDING" && !pendingApproval && (
        !withdrawing
          ? <button type="button" className="secondary ml-2 mt-2 min-h-12" onClick={() => setWithdrawing(true)}>Cannot supply this item</button>
          : <div className="mt-2 rounded-xl border border-[var(--line)] p-3 text-sm"><p className="font-bold">Only this item will be offered to another merchant.</p><div className="mt-2 flex gap-2"><button type="button" className="primary min-h-11" onClick={() => { let r = declineItemSourcing(order.id, item.itemId, { confirmed: true, allowAvailable: true, reason: "Merchant cannot supply" }); setError(r.ok ? "" : r.error); }}>Yes, reroute this item</button><button type="button" className="secondary min-h-11" onClick={() => setWithdrawing(false)}>Keep it</button></div></div>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-[var(--red)]">{error}</p>}
    </li>
  );
}

export default function MerchantOrderItems({ order, merchantId }) {
  let { state } = useAppState();
  if (!order.items?.every((i) => i.itemId)) return null;
  let { current, former } = itemsForMerchant(order, merchantId);
  let mine = merchantAllocations(order).find((a) => a.merchantId === merchantId);
  // Unavailable items first and prominent.
  let sorted = [...current].sort((a, b) => Number([SOURCING.SOURCING_REQUESTED, SOURCING.REROUTED].includes(b.sourcingStatus)) - Number([SOURCING.SOURCING_REQUESTED, SOURCING.REROUTED].includes(a.sourcingStatus)));
  void state;
  return (
    <div className="space-y-3">
      {sorted.length > 0 && <ul className="space-y-3" aria-label="Items assigned to you">{sorted.map((i) => <MyItem key={i.itemId} order={order} item={i} />)}</ul>}
      {mine && (mine.pending.gross > 0 || mine.settled.gross > 0 || mine.held.gross > 0) && (
        <p className="rounded-xl bg-[var(--soft)] p-3 text-xs"><b>Your share of this order (SIMULATION):</b> settled {formatNaira(mine.settled.merchantShare)} · pending {formatNaira(mine.pending.merchantShare)}{mine.held.gross ? ` · on hold ${formatNaira(mine.held.gross)}` : ""}. 95% to you, 5% WakaStore, only for your own items, only after the customer accepts.</p>
      )}
      {former.length > 0 && (
        <div className="rounded-xl border border-dashed border-[var(--line)] p-3">
          <p className="flex items-center gap-2 text-sm font-bold"><PackageSearch size={15} /> History: no longer assigned to you</p>
          <ul className="mt-1 space-y-1 text-sm text-[var(--muted)]">{former.map((f) => <li key={f.itemId}>{f.quantity} {f.unit} · {f.name}. Rerouted to another merchant.</li>)}</ul>
        </div>
      )}
    </div>
  );
}
