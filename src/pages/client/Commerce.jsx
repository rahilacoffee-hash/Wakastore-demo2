
import { useState } from "react";
import { jsPDF } from "jspdf";
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

const card =
  "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4";

const DELIVERY_FEE = 3500;

/* -------------------------------------------------------------------------- */
/*                                    CART                                    */
/* -------------------------------------------------------------------------- */

export function Cart() {
  const { state, updateQuantity, removeFromCart, feeRate } =
    useAppState();

  const navigate = useNavigate();
  const cart = state?.cart || [];

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      (Number(item.price) || 0) *
        (Number(item.quantity) || 0),
    0,
  );

  const fee = Math.round(subtotal * feeRate);
  const total = subtotal + fee + DELIVERY_FEE;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <h1 className="text-2xl font-bold">Your cart</h1>

      {!cart.length ? (
        <div className="mt-8 rounded-3xl bg-[var(--blush)] p-8 text-center">
          <ShoppingBag className="mx-auto text-[var(--red)]" />

          <h2 className="mt-3 text-lg font-bold">
            Your cart is empty
          </h2>

          <Link
            className="text-link mx-auto mt-3"
            to="/client/explore"
          >
            Explore materials <ArrowRight />
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_290px]">
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
                key={item.id}
              >
                <img
                  className="h-20 w-20 rounded-xl bg-[var(--soft)] object-cover"
                  src={item.image || undefined}
                  alt={item.name}
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {item.merchant} · Ref: {item.id}
                  </p>

                  <b className="mt-2 block text-sm">
                    {item.kind === "sourcing"
                      ? "Price to be confirmed by the merchant"
                      : `${formatNaira(item.price)} / ${item.unit}`}
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
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={14} />
                    </button>

                    <b className="w-6 text-center text-sm">
                      {item.quantity}
                    </b>

                    <button
                      className="p-2"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity + 1,
                        )
                      }
                      aria-label={`Increase ${item.name} quantity`}
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
                <span>WakaStore fee</span>
                <b>{formatNaira(fee)}</b>
              </p>

              <p className="flex justify-between">
                <span>Delivery</span>
                <b>{formatNaira(DELIVERY_FEE)}</b>
              </p>
            </div>

            <div className="mt-4 flex justify-between border-t border-white/15 pt-4 font-bold">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
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

/* -------------------------------------------------------------------------- */
/*                                  CHECKOUT                                  */
/* -------------------------------------------------------------------------- */

export function Checkout() {
  const { state, createOrder, feeRate } = useAppState();
  const navigate = useNavigate();

  const cart = state?.cart || [];

  const [method, setMethod] = useState("wallet");

  const [address, setAddress] = useState({
    fullName: state?.session?.name || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    landmark: "",
    deliveryNote: "",
  });

  const [error, setError] = useState("");

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      (Number(item.price) || 0) *
        (Number(item.quantity) || 0),
    0,
  );

  const fee = Math.round(subtotal * feeRate);
  const total = subtotal + fee + DELIVERY_FEE;

  const set = (key, value) => {
    setAddress((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  if (!cart.length) {
    return <Cart />;
  }

  const placeOrder = () => {
    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.street.trim() ||
      !address.city.trim() ||
      !address.state.trim()
    ) {
      setError(
        "Complete your name, phone number, street, city and state before continuing.",
      );
      return;
    }

    if (
      method === "wallet" &&
      Number(state?.wallet?.balance || 0) < total
    ) {
      setError(
        `Insufficient wallet balance. You need ${formatNaira(total)}.`,
      );
      return;
    }

    const id = createOrder(method, address, DELIVERY_FEE);

    if (!id) {
      setError(
        "We could not create this order. Please review your cart and try again.",
      );
      return;
    }

    navigate(`/client/orders/${id}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-5">
        <span className="eyebrow">
          CHECKOUT · STEP 1 OF 2
        </span>

        <h1 className="mt-1 text-2xl font-bold">
          Delivery address
        </h1>

        <p className="mt-1 text-sm text-[var(--muted)]">
          Tell us where to deliver your building materials.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className={`${card} space-y-3`}>
          <h2 className="flex items-center gap-2 font-bold">
            <MapPin size={18} />
            Delivery information
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Recipient name

              <input
                className={`${field} mt-1`}
                value={address.fullName}
                onChange={(e) =>
                  set("fullName", e.target.value)
                }
                placeholder="Full name"
              />
            </label>

            <label className="text-xs font-semibold">
              Phone number

              <input
                className={`${field} mt-1`}
                value={address.phone}
                onChange={(e) =>
                  set("phone", e.target.value)
                }
                placeholder="080..."
                inputMode="tel"
              />
            </label>

            <label className="text-xs font-semibold sm:col-span-2">
              Street address

              <input
                className={`${field} mt-1`}
                value={address.street}
                onChange={(e) =>
                  set("street", e.target.value)
                }
                placeholder="House number, street, estate"
              />
            </label>

            <label className="text-xs font-semibold">
              City / town

              <input
                className={`${field} mt-1`}
                value={address.city}
                onChange={(e) =>
                  set("city", e.target.value)
                }
                placeholder="e.g. Abuja"
              />
            </label>

            <label className="text-xs font-semibold">
              State

              <input
                className={`${field} mt-1`}
                value={address.state}
                onChange={(e) =>
                  set("state", e.target.value)
                }
                placeholder="e.g. FCT"
              />
            </label>

            <label className="text-xs font-semibold sm:col-span-2">
              Landmark (optional)

              <input
                className={`${field} mt-1`}
                value={address.landmark}
                onChange={(e) =>
                  set("landmark", e.target.value)
                }
                placeholder="Nearby landmark"
              />
            </label>

            <label className="text-xs font-semibold sm:col-span-2">
              Delivery instructions (optional)

              <textarea
                className={`${field} mt-1`}
                rows={2}
                value={address.deliveryNote}
                onChange={(e) =>
                  set("deliveryNote", e.target.value)
                }
                placeholder="Access instructions, preferred delivery time..."
              />
            </label>
          </div>
        </section>

        <aside className={`${card} h-fit`}>
          <h2 className="font-bold">
            Payment & summary
          </h2>

          {["wallet", "card", "bank transfer"].map(
            (option) => (
              <label
                className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--line)] p-3 text-sm capitalize"
                key={option}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={method === option}
                  onChange={() => setMethod(option)}
                />

                {option}

                {option === "wallet" && (
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    Balance{" "}
                    {formatNaira(state?.wallet?.balance || 0)}
                  </span>
                )}
              </label>
            ),
          )}

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
            Demo checkout: no live card or bank payment is processed.
            A receipt is generated after successful simulation.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-[var(--red)]"
            >
              {error}
            </p>
          )}

          <button
            className="primary mt-4 w-full"
            onClick={placeOrder}
          >
            Place order · {formatNaira(total)}
          </button>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              RECEIPT HELPERS                               */
/* -------------------------------------------------------------------------- */

const getReceiptId = (order) =>
  order.receiptId ||
  `WKR-${String(order.id).replace("WK-", "")}`;

const getItemAmount = (item) => {
  const unitPrice = item.unitPrice ?? item.price;

  if (unitPrice == null) return null;

  return (
    item.lineTotal ??
    Number(unitPrice) * Number(item.quantity || 0)
  );
};

const getOrderSubtotal = (order) =>
  order.subtotal ??
  (order.items || []).reduce(
    (sum, item) =>
      sum + (getItemAmount(item) || 0),
    0,
  );

/* -------------------------------------------------------------------------- */
/*                             PDF GENERATOR                                  */
/* -------------------------------------------------------------------------- */

const generateReceiptPdf = (order) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const red = [215, 25, 53];
  const black = [23, 23, 23];
  const grey = [110, 110, 110];
  const lightGrey = [235, 235, 235];

  let y = 20;

  const money = (value) =>
    value == null
      ? "Pending"
      : `NGN ${Number(value).toLocaleString("en-NG")}`;

  const ensureSpace = (height) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }
  };

  const wrapped = (value, options = {}) => {
    const {
      size = 9,
      weight = "normal",
      color = black,
      indent = 0,
      lineHeight = 5,
    } = options;

    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(
      String(value ?? ""),
      contentWidth - indent,
    );

    ensureSpace(lines.length * lineHeight + 2);

    doc.text(lines, margin + indent, y);
    y += lines.length * lineHeight;
  };

  const divider = () => {
    ensureSpace(5);

    doc.setDrawColor(...lightGrey);
    doc.line(margin, y, pageWidth - margin, y);

    y += 7;
  };

  const section = (title) => {
    ensureSpace(10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...black);
    doc.text(title, margin, y);

    y += 7;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...black);
  doc.text("WAKA", margin, y);

  const wakaWidth = doc.getTextWidth("WAKA");

  doc.setTextColor(...red);
  doc.text("STORE", margin + wakaWidth, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grey);

  doc.text(
    "BUILDING MATERIALS MARKETPLACE",
    margin,
    y + 6,
  );

  doc.setFillColor(255, 247, 237);
  doc.roundedRect(
    pageWidth - margin - 35,
    y - 7,
    35,
    10,
    2,
    2,
    "F",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);

  doc.text(
    "DEMO PAYMENT",
    pageWidth - margin - 17.5,
    y - 1,
    { align: "center" },
  );

  y += 17;
  divider();

  // Order details
  section("ORDER RECEIPT");

  const details = [
    ["Receipt ID", getReceiptId(order)],
    ["Order ID", order.id],
    ["Date", order.date || "—"],
    ["Payment method", order.paymentMethod || "—"],
  ];

  details.forEach(([label, value]) => {
    ensureSpace(7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...grey);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text(
      String(value),
      pageWidth - margin,
      y,
      { align: "right" },
    );

    y += 7;
  });

  y += 3;
  divider();

  // Delivery address
  section("DELIVERY ADDRESS");

  const address = order.deliveryAddress || {};

  wrapped(address.fullName || "—", {
    size: 10,
    weight: "bold",
  });

  wrapped(address.phone || "—", {
    size: 9,
    color: grey,
  });

  wrapped(
    [
      address.street,
      address.city,
      address.state,
    ].filter(Boolean).join(", ") || "Address not recorded",
    {
      size: 9,
      color: grey,
    },
  );

  if (address.landmark) {
    wrapped(`Landmark: ${address.landmark}`, {
      size: 9,
      color: grey,
    });
  }

  if (address.deliveryNote) {
    wrapped(`Delivery instructions: ${address.deliveryNote}`, {
      size: 9,
      color: grey,
    });
  }

  y += 4;
  divider();

  // Purchased items
  section("ITEMS PURCHASED");

  (order.items || []).forEach((item, index) => {
    const unitPrice = item.unitPrice ?? item.price;
    const amount = getItemAmount(item);

    wrapped(`${index + 1}. ${item.name}`, {
      size: 10,
      weight: "bold",
    });

    wrapped(
      `Reference: ${item.productRef || item.id || "—"}`,
      {
        size: 8,
        color: grey,
        indent: 3,
      },
    );

    wrapped(
      `Quantity: ${item.quantity} ${item.unit || "units"}`,
      {
        size: 9,
        indent: 3,
      },
    );

    wrapped(`Unit price: ${money(unitPrice)}`, {
      size: 9,
      indent: 3,
    });

    wrapped(`Amount: ${money(amount)}`, {
      size: 9,
      weight: "bold",
      indent: 3,
    });

    y += 4;
    ensureSpace(3);

    doc.setDrawColor(...lightGrey);
    doc.line(
      margin + 3,
      y,
      pageWidth - margin - 3,
      y,
    );

    y += 6;
  });

  // Payment summary
  ensureSpace(45);
  divider();
  section("PAYMENT SUMMARY");

  const totals = [
    ["Materials subtotal", getOrderSubtotal(order)],
    ["WakaStore service fee", order.wakastoreFee ?? 0],
    ["Delivery fee", order.deliveryFee ?? 0],
  ];

  totals.forEach(([label, value]) => {
    ensureSpace(8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...grey);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text(
      money(value),
      pageWidth - margin,
      y,
      { align: "right" },
    );

    y += 8;
  });

  ensureSpace(18);

  doc.setDrawColor(...red);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...black);
  doc.text("TOTAL", margin, y);

  doc.setTextColor(...red);
  doc.text(
    money(order.total ?? 0),
    pageWidth - margin,
    y,
    { align: "right" },
  );

  y += 18;
  ensureSpace(20);

  // Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...black);

  doc.text(
    "Thank you for choosing WakaStore.",
    pageWidth / 2,
    y,
    { align: "center" },
  );

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grey);

  doc.text(
    "This receipt was generated from the WakaStore demo environment.",
    pageWidth / 2,
    y,
    { align: "center" },
  );

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...grey);

    doc.text(
      `WakaStore | Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" },
    );
  }

  return {
    blob: doc.output("blob"),
    filename: `WakaStore-${getReceiptId(order)}-receipt.pdf`,
  };
};

/* -------------------------------------------------------------------------- */
/*                                 ORDER DETAIL                               */
/* -------------------------------------------------------------------------- */

export function OrderDetail() {
  const { id } = useParams();
  const { state } = useAppState();

  const order = (state?.orders || []).find(
    (item) => String(item.id) === String(id),
  );

  const [notice, setNotice] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [preparingPdf, setPreparingPdf] = useState(false);
  const [preparedPdf, setPreparedPdf] = useState(null);

  const download = async () => {
    if (downloading) return;

    try {
      setDownloading(true);
      setNotice("Preparing your PDF receipt...");

      const { blob, filename } = generateReceiptPdf(order);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 10000);

      setNotice("Your PDF receipt has been downloaded.");
    } catch (error) {
      console.error("Receipt PDF download failed:", error);
      setNotice(
        "Could not download your PDF receipt. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const preparePdfForSharing = async () => {
    if (preparingPdf) return;

    try {
      setPreparingPdf(true);
      setNotice("Preparing your PDF receipt...");

      const { blob, filename } = generateReceiptPdf(order);

      const file = new File([blob], filename, {
        type: "application/pdf",
        lastModified: Date.now(),
      });

      setPreparedPdf(file);

      setNotice("Your PDF is ready. Tap Share PDF to send it.");
    } catch (error) {
      console.error("PDF preparation failed:", error);
      setNotice(
        "Could not prepare your PDF receipt. Please try again.",
      );
    } finally {
      setPreparingPdf(false);
    }
  };

  const sharePreparedPdf = () => {
    if (!preparedPdf) return;

    if (!navigator.share) {
      setNotice(
        "Your browser does not support file sharing. Download the PDF and attach it manually.",
      );
      return;
    }

    if (
      navigator.canShare &&
      !navigator.canShare({ files: [preparedPdf] })
    ) {
      setNotice(
        "Your browser cannot share PDF attachments. Please download the PDF and attach it manually.",
      );
      return;
    }

    navigator.share({
      files: [preparedPdf],
      title: `WakaStore receipt ${getReceiptId(order)}`,
    })
      .then(() => {
        setNotice("PDF receipt shared successfully.");
        setPreparedPdf(null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("PDF sharing failed:", error);
          setNotice(
            "PDF sharing failed. Please download the receipt instead.",
          );
        }
      });
  };

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="text-xl font-bold">Order not found</h1>

        <Link className="primary mt-4" to="/client/orders">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      {/* Order heading and actions */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="status">
            <CheckCircle2 size={13} className="mr-1 inline" />
            {order.status}
          </span>

          <h1 className="mt-3 text-2xl font-extrabold">
            Order confirmed
          </h1>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Order {order.id} · Receipt {getReceiptId(order)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="secondary"
            onClick={download}
            disabled={downloading || preparingPdf}
          >
            <Download size={16} />
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </button>

          <button
            className="secondary"
            onClick={() => window.print()}
          >
            Print / PDF
          </button>

          <button
            className="primary"
            onClick={
              preparedPdf
                ? sharePreparedPdf
                : preparePdfForSharing
            }
            disabled={preparingPdf || downloading}
          >
            <Share2 size={16} />

            {preparingPdf
              ? "Preparing PDF..."
              : preparedPdf
                ? "Share PDF"
                : "Prepare PDF"}
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

      {/* Merchant fulfilment tracking */}

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
          {(order.subOrders || []).map((sub, index) => (
            <div
              key={`${sub.merchantId}-${index}`}
              className="rounded-xl bg-[var(--soft)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-sm">
                  {sub.merchantName ||
                    state?.merchants?.find(
                      (merchant) => merchant.id === sub.merchantId,
                    )?.name ||
                    "Marketplace merchant"}
                </b>

                <span className="text-xs font-bold text-[var(--red)]">
                  {sub.status}
                </span>
              </div>

              <p className="mt-1 text-xs text-[var(--muted)]">
                {(sub.items || [])
                  .map((item) => `${item.quantity} × ${item.name}`)
                  .join(" · ")}
              </p>

              {sub.tracking && (
                <p className="mt-2 text-xs font-semibold">
                  Tracking reference: {sub.tracking}
                </p>
              )}

              {sub.reassignedFrom && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  This fulfilment was reassigned to an alternative merchant.
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

      {/* Receipt preview */}

      <article
        className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 text-[#171717] shadow-sm sm:p-8"
        id="wakastore-receipt"
      >
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-gray-300 pb-5">
          <div>
            <div className="text-xl font-black tracking-tight">
              WAKA<span className="text-[#D71935]">STORE</span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Order receipt · Demo environment
            </p>
          </div>

          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            DEMO PAYMENT
          </span>
        </div>

        {/* Receipt references */}

        <div className="grid gap-3 border-b border-gray-200 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">
              Receipt reference
            </p>
            <b>{getReceiptId(order)}</b>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Order reference
            </p>
            <b>{order.id}</b>
          </div>

          <div>
            <p className="text-xs text-gray-500">Date</p>
            <b>{order.date || "—"}</b>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Payment method
            </p>
            <b className="capitalize">
              {order.paymentMethod || "—"}
            </b>
          </div>
        </div>

        {/* Delivery information */}

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

          {order.deliveryAddress?.deliveryNote && (
            <p className="mt-1 text-xs text-gray-500">
              Instructions: {order.deliveryAddress.deliveryNote}
            </p>
          )}
        </div>

        {/* Purchased items */}

        <div className="py-5">
          <h2 className="mb-3 text-sm font-extrabold">
            Items purchased
          </h2>

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
                {(order.items || []).map((item, index) => {
                  const unitPrice = item.unitPrice ?? item.price;
                  const amount = getItemAmount(item);

                  return (
                    <tr
                      key={`${item.productRef || item.id}-${index}`}
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
                        {unitPrice == null
                          ? "Pending"
                          : formatNaira(unitPrice)}
                      </td>

                      <td className="py-3 text-right font-bold">
                        {amount == null
                          ? "Pending"
                          : formatNaira(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt totals */}

        <div className="ml-auto max-w-sm space-y-2 border-t border-gray-200 pt-4 text-sm">
          <p className="flex justify-between">
            <span>Materials subtotal</span>
            <b>{formatNaira(getOrderSubtotal(order))}</b>
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
            <span>Total</span>
            <span>{formatNaira(order.total ?? 0)}</span>
          </p>
        </div>

        {/* Footer */}

        <div className="mt-7 border-t border-dashed border-gray-300 pt-4 text-center text-xs text-gray-500">
          Thank you for choosing WakaStore.

          <p className="mt-1">
            Keep this receipt for your records.
          </p>
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
