import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  MapPin,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import OrderItems from "./OrderItems";
import { formatNaira } from "../../utils/formatters";

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--red)]";
const card = "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4";
const DELIVERY_FEE = 3500;

export function Cart() {
  const { state, updateQuantity, removeFromCart, feeRate } = useAppState(),
    navigate = useNavigate();
  const subtotal = state.cart.reduce((a, x) => a + x.price * x.quantity, 0),
    fee = Math.round(subtotal * feeRate);
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <h1 className="text-2xl font-bold">Your cart</h1>
      {!state.cart.length ? (
        <div className="mt-8 rounded-3xl bg-[var(--blush)] p-8 text-center">
          <ShoppingBag className="mx-auto text-[var(--red)]" />
          <h2 className="mt-3 text-lg font-bold">Your cart is empty</h2>
          <Link className="text-link mx-auto mt-3" to="/client/explore">
            Explore materials <ArrowRight />
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_290px]">
          <div className="space-y-3">
            {state.cart.map((item) => (
              <div
                className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
                key={item.id}
              >
                <img
                  className="h-20 w-20 rounded-xl object-cover"
                  src={item.image || undefined}
                  alt={item.name}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">{item.name}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {item.merchant} · Ref: {item.id}
                  </p>
                  <b className="mt-2 block text-sm">
                    {item.kind === "sourcing" ? "Price to be confirmed by the merchant" : `${formatNaira(item.price)} / ${item.unit}`}
                  </b>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[var(--red)]"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                  <div className="flex items-center rounded-lg bg-[var(--soft)]">
                    <button
                      className="p-2"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <b className="w-6 text-center text-sm">{item.quantity}</b>
                    <button
                      className="p-2"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-2xl bg-[var(--ink)] p-5 text-white">
            <h2 className="font-bold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <p className="flex justify-between">
                <span>Materials subtotal</span>
                <b>{formatNaira(subtotal)}</b>
              </p>
              <p className="flex justify-between">
                <span>WakaStore fee (5%)</span>
                <b>{formatNaira(fee)}</b>
              </p>
              <p className="flex justify-between">
                <span>Delivery</span>
                <b>{formatNaira(DELIVERY_FEE)}</b>
              </p>
            </div>
            <div className="mt-4 flex justify-between border-t border-white/15 pt-4 font-bold">
              <span>Total</span>
              <span>{formatNaira(subtotal + fee + DELIVERY_FEE)}</span>
            </div>
            <button
              className="primary mt-5 w-full"
              onClick={() => navigate("/client/checkout")}
            >
              Continue to address <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

export function Checkout() {
  const { state, createOrder, feeRate } = useAppState(),
    navigate = useNavigate(),
    [method, setMethod] = useState("wallet"),
    [address, setAddress] = useState({
      fullName: state.session?.name || "",
      phone: "",
      street: "",
      city: "",
      state: "",
      landmark: "",
      deliveryNote: "",
    }),
    [error, setError] = useState("");
  const subtotal = state.cart.reduce((a, x) => a + x.price * x.quantity, 0),
    fee = Math.round(subtotal * feeRate),
    total = subtotal + fee + DELIVERY_FEE;
  const set = (key, value) => setAddress((a) => ({ ...a, [key]: value }));
  if (!state.cart.length) return <Cart />;
  const placeOrder = () => {
    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.street.trim() ||
      !address.city.trim() ||
      !address.state.trim()
    )
      return setError(
        "Complete your name, phone number, street, city and state before continuing.",
      );
    if (method === "wallet" && Number(state.wallet?.balance || 0) < total)
      return setError(
        `Insufficient wallet balance. You need ${formatNaira(total)}.`,
      );
    const id = createOrder(method, address, DELIVERY_FEE);
    if (!id)
      return setError(
        "We could not create this order. Please review your cart and try again.",
      );
    navigate(`/client/orders/${id}`);
  };
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-5">
        <span className="eyebrow">CHECKOUT · STEP 1 OF 2</span>
        <h1 className="mt-1 text-2xl font-bold">Delivery address</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tell us where to deliver your building materials.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className={`${card} space-y-3`}>
          <h2 className="flex items-center gap-2 font-bold">
            <MapPin size={18} /> Delivery information
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Recipient name
              <input
                className={`${field} mt-1`}
                value={address.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Full name"
              />
            </label>
            <label className="text-xs font-semibold">
              Phone number
              <input
                className={`${field} mt-1`}
                value={address.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="080..."
                inputMode="tel"
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2">
              Street address
              <input
                className={`${field} mt-1`}
                value={address.street}
                onChange={(e) => set("street", e.target.value)}
                placeholder="House number, street, estate"
              />
            </label>
            <label className="text-xs font-semibold">
              City / town
              <input
                className={`${field} mt-1`}
                value={address.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Abuja"
              />
            </label>
            <label className="text-xs font-semibold">
              State
              <input
                className={`${field} mt-1`}
                value={address.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. FCT"
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2">
              Landmark (optional)
              <input
                className={`${field} mt-1`}
                value={address.landmark}
                onChange={(e) => set("landmark", e.target.value)}
                placeholder="Nearby landmark"
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2">
              Delivery instructions (optional)
              <textarea
                className={`${field} mt-1`}
                rows={2}
                value={address.deliveryNote}
                onChange={(e) => set("deliveryNote", e.target.value)}
                placeholder="Access instructions, preferred delivery time..."
              />
            </label>
          </div>
        </section>
        <aside className={`${card} h-fit`}>
          <h2 className="font-bold">Payment & summary</h2>
          {["wallet", "card", "bank transfer"].map((x) => (
            <label
              className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--line)] p-3 text-sm capitalize"
              key={x}
            >
              <input
                type="radio"
                checked={method === x}
                onChange={() => setMethod(x)}
              />
              {x}
              {x === "wallet" && (
                <span className="ml-auto text-xs text-[var(--muted)]">
                  Balance {formatNaira(state.wallet?.balance || 0)}
                </span>
              )}
            </label>
          ))}
          <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
            <p className="flex justify-between">
              <span>Materials</span>
              <b>{formatNaira(subtotal)}</b>
            </p>
            <p className="flex justify-between">
              <span>WakaStore fee</span>
              <b>{formatNaira(fee)}</b>
            </p>
            <p className="flex justify-between">
              <span>Delivery fee</span>
              <b>{formatNaira(DELIVERY_FEE)}</b>
            </p>
            <p className="flex justify-between border-t border-[var(--line)] pt-3 text-base font-extrabold">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </p>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Demo checkout: no live card or bank payment is processed. A receipt
            is generated after successful simulation.
          </p>
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-[var(--red)]"
            >
              {error}
            </p>
          )}
          <button className="primary mt-4 w-full" onClick={placeOrder}>
            Place order · {formatNaira(total)}
          </button>
        </aside>
      </div>
    </div>
  );
}

const receiptText = (order) =>
  [
    "WAKASTORE — PAYMENT RECEIPT",
    `Receipt ID: ${order.receiptId || `WKR-${String(order.id).replace("WK-", "")}`}`,
    `Order ID: ${order.id}`,
    `Date: ${order.date}`,
    `Payment: ${order.paymentMethod || "—"}`,
    "",
    "DELIVERY ADDRESS",
    order.deliveryAddress?.fullName || "—",
    order.deliveryAddress?.phone || "—",
    [
      order.deliveryAddress?.street,
      order.deliveryAddress?.city,
      order.deliveryAddress?.state,
    ]
      .filter(Boolean)
      .join(", "),
    order.deliveryAddress?.landmark
      ? `Landmark: ${order.deliveryAddress.landmark}`
      : "",
    "",
    "ITEMS",
    ...(order.items || []).map(
      (item) =>
        `${item.name} | Ref: ${item.productRef || item.id || "—"} | ${item.quantity} ${item.unit || "units"} × ${(item.unitPrice ?? item.price) == null ? "price to be confirmed" : `${formatNaira(item.unitPrice ?? item.price)} = ${formatNaira(item.lineTotal ?? (item.unitPrice ?? item.price) * item.quantity)}`}`,
    ),
    "",
    `Materials subtotal: ${formatNaira(order.subtotal ?? (order.items || []).reduce((s, i) => s + (i.lineTotal ?? i.price * i.quantity), 0))}`,
    `WakaStore fee: ${formatNaira(order.wakastoreFee ?? Math.round((order.subtotal || 0) * 0.025))}`,
    `Delivery fee: ${formatNaira(order.deliveryFee || 0)}`,
    `TOTAL PAID: ${formatNaira(order.total)}`,
    "",
    "Thank you for shopping with WakaStore.",
  ]
    .filter(Boolean)
    .join("\n");

export function OrderDetail() {
  const { id } = useParams(),
    { state } = useAppState();
  const order = state.orders.find((x) => x.id === id);
  const [notice, setNotice] = useState("");
  const receipt = useMemo(() => (order ? receiptText(order) : ""), [order]);
  if (!order)
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="text-xl font-bold">Order not found</h1>
        <Link className="primary mt-4" to="/client/orders">
          Back to orders
        </Link>
      </div>
    );
  const download = () => {
    const safe = receipt
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>WakaStore receipt ${order.receiptId || order.id}</title><style>body{font:14px Arial,sans-serif;color:#171717;max-width:760px;margin:40px auto;padding:24px}h1{color:#d71935}pre{white-space:pre-wrap;line-height:1.7;font:inherit;border-top:1px dashed #bbb;padding-top:20px}@media print{body{margin:0}}</style></head><body><h1>WakaStore</h1><pre>${safe}</pre></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `WakaStore-${order.receiptId || order.id}-receipt.html`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(
      "Receipt file downloaded. Open it in a browser to print or save as PDF.",
    );
  };
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: `WakaStore receipt ${order.receiptId || order.id}`,
          text: receipt,
        });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(receipt);
        setNotice("Receipt copied. You can paste it into WhatsApp or email.");
      } else
        setNotice(
          "Sharing is not supported by this browser. Use Download receipt.",
        );
    } catch (e) {
      if (e.name !== "AbortError")
        setNotice("Could not share receipt. Try downloading it instead.");
    }
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="status">
            <CheckCircle2 size={13} className="mr-1 inline" />
            {order.status}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">Order confirmed</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Order {order.id} · Receipt{" "}
            {order.receiptId || `WKR-${String(order.id).replace("WK-", "")}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="secondary" onClick={download}>
            <Download size={16} /> Download
          </button>
          <button className="secondary" onClick={() => window.print()}>
            Print / PDF
          </button>
          <button className="primary" onClick={share}>
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-[var(--blush)] p-3 text-sm"
        >
          {notice}
        </p>
      )}
      <OrderItems order={order} />
      <section className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--muted)]">
              Live demo tracking
            </p>
            <h2 className="mt-1 text-lg font-extrabold">
              Merchant fulfilment progress
            </h2>
          </div>
          <span className="rounded-full bg-[var(--blush)] px-3 py-1 text-xs font-bold text-[var(--red)]">
            {order.status}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {(order.subOrders || []).map((sub, i) => (
            <div
              key={`${sub.merchantId}-${i}`}
              className="rounded-xl bg-[var(--soft)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-sm">
                  {sub.merchantName ||
                    state.merchants.find((m) => m.id === sub.merchantId)
                      ?.name ||
                    "Marketplace merchant"}
                </b>
                <span className="text-xs font-bold text-[var(--red)]">
                  {sub.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {(sub.items || [])
                  .map((x) => `${x.quantity} × ${x.name}`)
                  .join(" · ")}
              </p>
              {sub.tracking && (
                <p className="mt-2 text-xs font-semibold">
                  Tracking reference: {sub.tracking}
                </p>
              )}
              {sub.reassignedFrom && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  SmartFixer reassigned this fulfilment to an alternative
                  merchant.
                </p>
              )}
              {sub.rejectionReason && (
                <p className="mt-2 text-xs text-[var(--red)]">
                  {sub.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
      <article
        className="mt-5 rounded-3xl border border-[var(--line)] bg-white p-5 text-[#171717] shadow-sm sm:p-8"
        id="wakastore-receipt"
      >
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-gray-300 pb-5">
          <div>
            <div className="text-xl font-black tracking-tight">
              WAKA<span className="text-[#D71935]">STORE</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Official order payment receipt · Demo environment
            </p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            PAID
          </span>
        </div>
        <div className="grid gap-3 border-b border-gray-200 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Receipt reference</p>
            <b>
              {order.receiptId || `WKR-${String(order.id).replace("WK-", "")}`}
            </b>
          </div>
          <div>
            <p className="text-xs text-gray-500">Order reference</p>
            <b>{order.id}</b>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <b>{order.date}</b>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment method</p>
            <b className="capitalize">{order.paymentMethod || "—"}</b>
          </div>
        </div>
        <div className="border-b border-gray-200 py-5">
          <h2 className="text-sm font-extrabold">Deliver to</h2>
          <p className="mt-2 text-sm font-semibold">
            {order.deliveryAddress?.fullName || "—"} ·{" "}
            {order.deliveryAddress?.phone || "—"}
          </p>
          <p className="text-sm text-gray-600">
            {[
              order.deliveryAddress?.street,
              order.deliveryAddress?.city,
              order.deliveryAddress?.state,
            ]
              .filter(Boolean)
              .join(", ") || "Address not recorded"}
          </p>
          {order.deliveryAddress?.landmark && (
            <p className="text-xs text-gray-500">
              Landmark: {order.deliveryAddress.landmark}
            </p>
          )}
        </div>
        <div className="py-5">
          <h2 className="mb-3 text-sm font-extrabold">Items purchased</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-2">Item / reference</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Unit price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <tr
                    key={`${item.productRef || item.id}-${i}`}
                    className="border-b border-gray-100"
                  >
                    <td className="py-3 pr-3">
                      <b>{item.name}</b>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {item.productRef || item.id || "—"} ·{" "}
                        {item.merchant || "WakaStore merchant"}
                      </p>
                    </td>
                    <td className="py-3">
                      {item.quantity} {item.unit || "units"}
                    </td>
                    <td className="py-3">
                      {(item.unitPrice ?? item.price) == null ? "Pending" : formatNaira(item.unitPrice ?? item.price)}
                    </td>
                    <td className="py-3 text-right font-bold">
                      {(item.unitPrice ?? item.price) == null
                        ? "Pending"
                        : formatNaira(item.lineTotal ?? (item.unitPrice ?? item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="ml-auto max-w-sm space-y-2 border-t border-gray-200 pt-4 text-sm">
          <p className="flex justify-between">
            <span>Materials subtotal</span>
            <b>
              {formatNaira(
                order.subtotal ??
                  (order.items || []).reduce(
                    (sum, item) =>
                      sum +
                      (item.lineTotal ??
                        (item.unitPrice ?? item.price) * item.quantity),
                    0,
                  ),
              )}
            </b>
          </p>
          <p className="flex justify-between">
            <span>WakaStore service fee</span>
            <b>{formatNaira(order.wakastoreFee ?? 0)}</b>
          </p>
          <p className="flex justify-between">
            <span>Delivery fee</span>
            <b>{formatNaira(order.deliveryFee ?? 0)}</b>
          </p>
          <p className="flex justify-between border-t border-gray-300 pt-3 text-lg font-black">
            <span>Total paid</span>
            <span>{formatNaira(order.total)}</span>
          </p>
        </div>
        <div className="mt-7 border-t border-dashed border-gray-300 pt-4 text-center text-xs text-gray-500">
          Thank you for choosing WakaStore. Keep this receipt for your records.
        </div>
      </article>
      <Link
        className="mt-5 inline-flex text-sm font-semibold text-[var(--red)]"
        to="/client/orders"
      >
        View all orders <ArrowRight size={15} />
      </Link>
    </div>
  );
}
