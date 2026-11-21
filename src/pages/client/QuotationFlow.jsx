import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  MessageSquare,
  PackageCheck,
  Phone,
  ShieldCheck,
  Clock3,
  Truck,
  Store,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import { matchQuotation } from "../../services/matching";
import { formatNaira } from "../../utils/formatters";
import PaymentSimulator from "../../components/PaymentSimulator";
import { SmartFixerStatusCard } from "./SmartFixer";

export { default as NewQuotationFlow } from "./materials/MaterialListBuilder";

const DELIVERY_OPTIONS = [
  {
    id: "merchant_delivery",
    label: "Merchant delivery",
    detail: "The selected merchant arranges delivery.",
    icon: Truck,
  },
  {
    id: "customer_collection",
    label: "Customer collection",
    detail: "Collect the complete order from the merchant.",
    icon: Store,
  },
  {
    id: "wakarider",
    label: "WakaRider",
    detail: "WakaStore delivery network, where available.",
    icon: PackageCheck,
  },
];
const expiryText = (value) => {
  const ms = Date.parse(value || 0) - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m left`;
};
const offerSubtotal = (offer) =>
  (offer.items || []).reduce(
    (sum, item) =>
      sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  );
const offerTotal = (offer) =>
  offerSubtotal(offer) + Number(offer.deliveryFee || 0);

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    state,
    selectMerchantQuote,
    approveMerchantQuotation,
    payQuotation,
    notify,
    attemptPayment,
  } = useAppState();
  const [deliveryMethod, setDeliveryMethod] = useState("merchant_delivery");
  const [outcome, setOutcome] = useState("success"); // demo: forces the simulated provider response
  const [payError, setPayError] = useState("");
  const q = state.quotations.find((item) => item.id === id);
  const matched = useMemo(
    () =>
      q
        ? matchQuotation(
            q.items,
            state.merchants,
            state.products,
            Number(state.settings?.threshold ?? 60),
          )
        : null,
    [q, state.merchants, state.products],
  );
  if (!q)
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        Quotation not found.{" "}
        <Link to="/client/quotations" className="text-[var(--red)]">
          Back to quotations
        </Link>
      </div>
    );

  const merchants = matched?.eligible || [];
  const rawOffers = (state.merchantQuotes || []).filter(
    (offer) => offer.quotationId === q.id,
  );
  const now = Date.now();
  const offers = rawOffers
    .map((offer) => ({
      ...offer,
      expired: Date.parse(offer.validUntil || 0) <= now,
      complete:
        (offer.items || []).length === q.items.length &&
        q.items.every((line) => {
          const item = offer.items.find((x) => x.lineId === line.id);
          return (
            item &&
            ["CAN_SUPPLY", "CAN_SOURCE"].includes(item.supplyStatus) &&
            Number(item.quantity) === Number(line.quantity)
          );
        }),
    }))
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? -1 : 1;
      if (a.expired !== b.expired) return a.expired ? 1 : -1;
      return (
        offerTotal(a) - offerTotal(b) ||
        Date.parse(a.submittedAt) - Date.parse(b.submittedAt)
      );
    });
  const validOffers = offers.filter(
    (offer) => offer.complete && !offer.expired,
  );
  const bestOffers = validOffers.slice(0, 2);
  const otherOffers = validOffers.slice(2);
  const selected = rawOffers.find(
    (offer) => offer.id === q.selectedMerchantQuoteId,
  );
  const selectedIsExpired =
    selected && Date.parse(selected.validUntil || 0) <= now;
  const activeDeliveryMethod = q.selectedDeliveryMethod || deliveryMethod;
  const selectedDeliveryFee =
    selected && activeDeliveryMethod === "customer_collection"
      ? 0
      : Number(selected?.deliveryFee || 0);
  const selectedTotal = selected
    ? offerSubtotal(selected) + selectedDeliveryFee
    : 0;
  const selectedMerchant = state.merchants.find(
    (m) => m.id === selected?.merchantId,
  );
  const contact = String(selectedMerchant?.contact || "").replace(/\D/g, "");
  const invitationDeadline = q.merchantResponseDeadlineAt;
  const responseExpired =
    invitationDeadline && Date.parse(invitationDeadline) <= now;
  const handlePay = () => {
    setPayError("");
    const paid = attemptPayment({
      key: `QPAY-${q.id}`,
      kind: "quotation",
      ref: q.id,
      amount: selectedTotal,
      method: "card",
      outcome,
    });
    if (!paid.ok) {
      setPayError(paid.error);
      return;
    }
    const orderId = payQuotation(q.id);
    if (orderId) navigate(`/client/orders/${orderId}`);
    else
      notify(
        "This quotation is incomplete or expired. Please select a valid offer.",
        "error",
      );
  };
  const selectOffer = (offer) => {
    if (!selectMerchantQuote(q.id, offer.id)) {
      notify(
        "This quotation has expired or does not cover the complete materials list.",
        "error",
      );
      return;
    }
    setDeliveryMethod("merchant_delivery");
  };
  const renderOffer = (offer, rank) => {
    const isSelected = selected?.id === offer.id;
    const subtotal = offerSubtotal(offer);
    const delivery = Number(offer.deliveryFee || 0);
    return (
      <article
        key={offer.id}
        className={`rounded-2xl border bg-[var(--surface)] p-4 ${isSelected ? "border-[var(--red)] ring-1 ring-[var(--red)]" : "border-[var(--line)]"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {rank && (
                <span className="rounded-full bg-[var(--blush)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--red)]">
                  #{rank} · {rank <= 2 ? "Top offer" : "Other offer"}
                </span>
              )}
              <b>{offer.merchantName}</b>
              {isSelected && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  Selected
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Submitted {new Date(offer.submittedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <b className="text-xl">{formatNaira(offerTotal(offer))}</b>
            <p className="text-[10px] text-[var(--muted)]">
              Materials + quoted delivery
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-[var(--soft)] p-3 text-xs">
            <span className="text-[var(--muted)]">Materials subtotal</span>
            <b className="mt-1 block">{formatNaira(subtotal)}</b>
          </div>
          <div className="rounded-xl bg-[var(--soft)] p-3 text-xs">
            <span className="text-[var(--muted)]">Delivery charge</span>
            <b className="mt-1 block">{formatNaira(delivery)}</b>
          </div>
        </div>
        <div className="mt-3 divide-y divide-[var(--line)]">
          {q.items.map((line) => {
            const item = offer.items.find((x) => x.lineId === line.id);
            return (
              <div
                key={`${offer.id}-${line.id}`}
                className="flex flex-wrap items-start justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <b>{item?.variation || line.name}</b>
                  <p className="text-xs text-[var(--muted)]">
                    {line.quantity} {line.unit} ·{" "}
                    {item?.supplyStatus === "CAN_SOURCE"
                      ? `Merchant will source · ${item.sourcingTime}`
                      : "Merchant has in stock"}
                  </p>
                  {line.specs && (
                    <p className="text-xs text-[var(--muted)]">
                      Requested: {line.specs}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-right text-xs font-bold">
                  {formatNaira(item?.unitPrice || 0)} / {line.unit || "unit"}
                  <br />
                  <span className="font-medium text-[var(--muted)]">
                    {formatNaira(
                      Number(item?.unitPrice || 0) * Number(line.quantity),
                    )}{" "}
                    line total
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} /> Valid for {expiryText(offer.validUntil)}
          </span>
          <span>
            {offer.deliveryEstimate || "Fulfilment estimate not provided"}
          </span>
        </div>
        {offer.notes && (
          <p className="mt-2 rounded-lg bg-[var(--soft)] p-2 text-xs">
            {offer.notes}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
         
          <Link
            to={`/client/messages?quotation=${q.id}&merchant=${offer.merchantId}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2.5 text-xs font-bold"
          >
            <MessageSquare size={15} /> Chat with merchant
          </Link>

          {!isSelected && (
            <button
              disabled={
                offer.expired ||
                !offer.complete ||
                q.status === "Paid — funds pending acceptance"
              }
              onClick={() => selectOffer(offer)}
              className="flex-1 rounded-xl bg-[var(--red)] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Select this complete offer
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-28 pt-5 sm:px-7">
      <Link
        to="/client/quotations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={16} /> All quotations
      </Link>
      {q.smartfixerJobId && <SmartFixerStatusCard quotation={q} />}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--red)]">
              Quotation request · {q.id}
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{q.name}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              <MapPin size={14} className="mr-1 inline" />
              {q.deliveryLocation || "Delivery location not specified"} ·{" "}
              {q.items.length} requested materials
            </p>
          </div>
          <span className="rounded-full bg-[var(--blush)] px-3 py-1.5 text-xs font-bold text-[var(--red)]">
            {q.status}
          </span>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {q.items.map((line) => (
            <div key={line.id} className="rounded-xl bg-[var(--soft)] p-3">
              <b className="text-sm">{line.name}</b>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {line.quantity} {line.unit}
                {line.specs ? ` · ${line.specs}` : ""}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--soft)] p-3 text-xs">
          <Clock3 size={15} className="text-[var(--red)]" />
          <b>Merchant response window:</b>
          <span>
            {responseExpired
              ? "Closed"
              : `24-hour deadline · ${expiryText(invitationDeadline)}`}
          </span>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-3xl font-extrabold">Invited merchants</h2>
          <p className="text-sm text-[var(--muted)]">
            Every merchant with inventory coverage of at least 60% of your
            distinct requested product lines was invited. Inventory coverage
            does not guarantee stock or fulfilment.
          </p>
        </div>
        {!merchants.length ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            No merchant currently meets the 60% threshold. Your request remains
            saved for admin review.
          </div>
        ) : (
          merchants.map(({ merchant, percentage }) => {
            const offer = rawOffers.find((x) => x.merchantId === merchant.id);
            const merchantContact = String(merchant.contact || "").replace(
              /\D/g,
              "",
            );
            const whatsappText = encodeURIComponent(
              `Hello ${merchant.name}, I have a WakaStore quotation request ${q.id} for ${q.items.map((x) => `${x.quantity} ${x.unit} ${x.name}`).join(", ")}. Please submit a complete quotation in WakaStore.`,
            );
            return (
              <div
                key={merchant.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{merchant.name}</b>
                    <span className="rounded-full bg-[var(--soft)] px-2 py-1 text-[10px] font-bold">
                      {Math.round(percentage)}% inventory match
                    </span>
                    {offer && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        Quotation received
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {merchant.address ||
                      "Merchant location available on profile"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/client/messages?quotation=${q.id}&merchant=${merchant.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold"
                  >
                    <MessageSquare size={15} /> In-app chat
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-3xl font-extrabold">Merchant Response</h2>
          <p className="text-sm text-[var(--muted)]">
            Only complete, unexpired offers are rankable. The two lowest total
            quotations appear first; other valid offers remain available to
            compare.
          </p>
        </div>
        {!validOffers.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center">
            <MessageCircle className="mx-auto text-[var(--muted)]" />
            <p className="mt-2 font-bold">Waiting for complete quotations</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Merchants have 24 hours to respond. Each submitted quotation is
              valid for 48 hours.
            </p>
          </div>
        ) : (
          <>
            {bestOffers.map((offer, index) => renderOffer(offer, index + 1))}
            {otherOffers.length > 0 && (
              <details className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <summary className="cursor-pointer text-sm font-bold">
                  View {otherOffers.length} other valid quotation
                  {otherOffers.length > 1 ? "s" : ""}
                </summary>
                <div className="mt-3 space-y-3">
                  {otherOffers.map((offer, index) =>
                    renderOffer(offer, index + 3),
                  )}
                </div>
              </details>
            )}
          </>
        )}
        {offers.filter((offer) => offer.expired).length > 0 && (
          <p className="text-xs text-[var(--muted)]">
            {offers.filter((offer) => offer.expired).length} quotation(s) have
            expired and can no longer be selected.
          </p>
        )}
      </section>

      {selected && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--red)]" />
            <h2 className="text-lg font-extrabold">
              Confirm your complete order
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The selected merchant is responsible for supplying or sourcing every
            material and fulfilling the complete requested quantity. WakaStore
            will not split this order across other merchants.
          </p>
          <div className="mt-3 rounded-xl bg-[var(--soft)] p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span>Selected merchant</span>
              <b>{selected.merchantName}</b>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span>Materials subtotal</span>
              <b>{formatNaira(offerSubtotal(selected))}</b>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span>Delivery charge</span>
              <b>{formatNaira(selected.deliveryFee || 0)}</b>
            </div>
            <div className="mt-2 flex justify-between gap-3 border-t border-[var(--line)] pt-2">
              <b>Total payable</b>
              <b>{formatNaira(offerTotal(selected))}</b>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              No extra 5% fee is added to your bill. WakaStore's commission is
              deducted from the merchant's accepted materials proceeds after
              customer acceptance.
            </p>
          </div>
          {q.merchantConfirmedAt ? (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <b>Merchant confirmed the complete order.</b>
              <p>Choose how you want to receive your materials.</p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Awaiting final confirmation from {selected.merchantName}.
            </div>
          )}
          {q.merchantConfirmedAt && !q.customerApprovedAt && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-bold">Choose fulfilment method</h3>
              {DELIVERY_OPTIONS.map(
                ({ id: method, label, detail, icon: Icon }) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${deliveryMethod === method ? "border-[var(--red)] bg-[var(--blush)]" : "border-[var(--line)]"}`}
                  >
                    <input
                      type="radio"
                      name="quotation-delivery"
                      checked={activeDeliveryMethod === method}
                      onChange={() => setDeliveryMethod(method)}
                      className="mt-1 accent-[var(--red)]"
                    />
                    <Icon size={18} className="mt-0.5 text-[var(--red)]" />
                    <span>
                      <b className="block text-sm">{label}</b>
                      <span className="text-xs text-[var(--muted)]">
                        {detail}
                      </span>
                    </span>
                  </label>
                ),
              )}
              <button
                onClick={() => approveMerchantQuotation(q.id, deliveryMethod)}
                className="mt-2 w-full rounded-xl bg-[var(--red)] px-4 py-3 text-sm font-bold text-white"
              >
                Approve complete quotation
              </button>
            </div>
          )}
          {q.customerApprovedAt &&
            q.status !== "Paid — funds pending acceptance" && (
              <div className="mt-3">
                <PaymentSimulator value={outcome} onChange={setOutcome} />
                {payError && (
                  <p
                    role="alert"
                    className="mt-2 rounded-xl bg-[var(--blush)] p-3 text-sm font-bold text-[var(--red)]"
                  >
                    {payError} Your order has not been created.
                  </p>
                )}
                <button
                  onClick={handlePay}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--red)] px-4 py-3 text-sm font-bold text-white"
                >
                  <PackageCheck size={17} /> Pay securely (demo) ·{" "}
                  {formatNaira(selectedTotal)}
                </button>
              </div>
            )}
          {q.status === "Paid — funds pending acceptance" && (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="mr-1 inline" size={16} /> Payment
              verified. Funds are pending until complete delivery and customer
              acceptance. Order {q.orderId}.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
