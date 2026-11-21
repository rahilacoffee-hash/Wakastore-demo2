import { moneyByMerchant } from "../services/ledger";
import { DispatchProofPanel, DeliveryRecordCard } from "./DeliveryRecords";
import BulkInventoryUpload from "./BulkInventoryUpload";
import { MerchantDocuments, MerchantDocumentReview } from "./MerchantDocuments";
import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  WalletCards,
  X,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Truck,
  Settings,
  SunMedium,
  Moon,
  BriefcaseBusiness,
  FileWarning,
  BarChart3,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import MerchantOrderItems from './MerchantOrderItems'
import * as Sourcing from '../services/sourcing'
import { itemsForMerchant, upgradeOrder } from '../services/sourcing'
import { merchantIdOf } from "../data/quoteSeed";
import { categories } from "../constants/categories";
import { formatNaira } from "../utils/formatters";

const demoAccounts = [
  {
    role: "customer",
    label: "Customer",
    email: "customer1@waka.test",
    password: "waka123",
    name: "Ada Okafor",
  },
  {
    role: "customer",
    label: "Customer 2",
    email: "customer2@waka.test",
    password: "waka123",
    name: "Kelechi Martins",
  },
  {
    role: "merchant",
    label: "Merchant",
    email: "merchant@waka.test",
    password: "waka123",
    name: "BuildRight Supplies",
  },
  {
    role: "merchant",
    label: "Pending Merchant",
    email: "pending@waka.test",
    password: "waka123",
    name: "Prime Plumbing Hub",
  },
  {
    role: "merchant",
    label: "Rejected Merchant",
    email: "rejected@waka.test",
    password: "waka123",
    name: "Tile District",
  },
  {
    role: "admin",
    label: "Admin",
    email: "admin@waka.test",
    password: "waka123",
    name: "Admin User",
  },
  {
    role: "super-admin",
    label: "Super Admin",
    email: "superadmin@waka.test",
    password: "waka123",
    name: "Super Admin Team",
  },
];

function authEntry(role) {
  if (role === "customer") return "/client/overview";
  if (role === "merchant") return "/merchant/overview";
  if (role === "super-admin") return "/super-admin/overview";
  if (role === "admin") return "/admin/overview";
  return "/login";
}

export function DemoLogin() {
  const navigate = useNavigate();
  const { signIn, state } = useAppState();

  const handleLogin = (role, email, name) => {
    signIn(role, email, name);
    navigate(authEntry(role));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--red)] text-lg font-black text-white">
          W
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            WakaStore
          </div>
          <h1 className="mt-1 text-3xl font-extrabold">Demo access</h1>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
          <div className="mb-3 inline-flex rounded-full bg-[var(--blush)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red)]">
            Prototype access
          </div>
          <h2 className="text-2xl font-extrabold">
            Select a role to test the live demo.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            This prototype keeps customer, merchant, admin and super admin data
            in shared local storage so actions remain consistent during user
            testing.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={`${account.role}-${account.email}`}
                type="button"
                onClick={() =>
                  handleLogin(account.role, account.email, account.name)
                }
                className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 text-left transition hover:border-[var(--red)] hover:bg-[var(--blush)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--red)]">
                    {account.role === "super-admin"
                      ? "Super admin"
                      : account.role}
                  </span>
                  <ShieldCheck size={16} className="text-[var(--red)]" />
                </div>
                <div className="font-bold text-base">{account.label}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {account.email}
                </div>
                <div className="mt-2 text-[11px] text-[var(--muted)]">
                  Password: {account.password}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">Session status</h3>
            {state?.session ? (
              <span className="rounded-full bg-[var(--blush)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--red)]">
                Signed in
              </span>
            ) : (
              <span className="rounded-full bg-[var(--soft)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                Logged out
              </span>
            )}
          </div>

          {state?.session ? (
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div className="rounded-2xl bg-[var(--soft)] p-3">
                <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Role
                </span>
                <span className="mt-1 block font-bold text-[var(--ink)]">
                  {state.session.role}
                </span>
              </div>
              <div className="rounded-2xl bg-[var(--soft)] p-3">
                <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Name
                </span>
                <span className="mt-1 block font-bold text-[var(--ink)]">
                  {state.session.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(authEntry(state.session.role))}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="text-sm leading-6 text-[var(--muted)]">
              No session is active. Choose a demo role above to begin testing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RequireRole({ allowedRoles, children }) {
  const appState = useAppState();
  const role = appState?.state?.session?.role;
  const location = useLocation();
  if (!role || !allowedRoles.includes(role)) {
    const adminArea = location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin");
    return <Navigate to={adminArea ? "/admin/login" : "/welcome"} replace />;
  }
  return children;
}

function Metric({ label, value, note, Icon }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {label}
          </div>
          <div className="mt-2 text-2xl font-extrabold">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--blush)] text-[var(--red)]">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{note}</div>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-extrabold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MerchantDashboard() {
  const { state } = useAppState();
  const productCount = state.products.filter(
    (p) => p.merchantId === merchantIdOf(state),
  ).length;
  const orders = state.orders.filter((order) =>
    order.subOrders?.some((sub) => sub.merchantId === merchantIdOf(state)),
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Merchant workspace
          </div>
          <h1 className="mt-2 text-3xl font-extrabold">Overview</h1>
        </div>
        <Link
          to="/merchant/products"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white"
        >
          Manage products <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Revenue"
          value={formatNaira(1425000)}
          note="Current month"
          Icon={CircleDollarSign}
        />
        <Metric
          label="New orders"
          value={String(orders.length || 2)}
          note="Awaiting review"
          Icon={PackageCheck}
        />
        <Metric
          label="Products"
          value={String(productCount)}
          note="Listed in marketplace"
          Icon={Store}
        />
        <Metric
          label="Low stock"
          value="03"
          note="Needs attention"
          Icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Recent activity">
          <div className="space-y-3 text-sm text-[var(--muted)]">
            {[
              "Order WK-20481 accepted",
              "Product inventory refreshed",
              "Customer refund request received",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl bg-[var(--soft)] px-3 py-2.5"
              >
                <div className="font-medium text-[var(--ink)]">{item}</div>
                <span className="text-[11px]">Today</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Notifications">
          <div className="space-y-3 text-sm text-[var(--muted)]">
            {[
              "New customer enquiry for cement",
              "Settlement scheduled for Friday",
              "Promotion on premium paint range",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-[var(--soft)] px-3 py-2.5"
              >
                <Bell size={16} className="text-[var(--red)]" />
                <span className="text-[var(--ink)]">{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function MerchantQuotationRequests() {
  const { state, submitMerchantQuote, confirmMerchantQuotation, notify } = useAppState();
  const merchantId = merchantIdOf(state);
  const merchant = state.merchants.find((m) => m.id === merchantId);
  const [drafts, setDrafts] = useState({});
  const [metaDrafts, setMetaDrafts] = useState({});
  const [errors, setErrors] = useState({});
  const eligible = state.quotations.filter((quotation) =>
    (quotation.invitedMerchantIds || []).includes(merchantId) ||
    (quotation.matchedMerchants || []).includes(merchant?.name)
  );
  const getDraft = (q, line) => drafts[`${q.id}:${line.id}`] || {
    supplyStatus: "CAN_SUPPLY",
    variation: "",
    unitPrice: "",
    sourcingTime: "",
  };
  const setDraft = (q, line, patch) => setDrafts((prev) => ({
    ...prev,
    [`${q.id}:${line.id}`]: { ...getDraft(q, line), ...patch },
  }));
  const send = (q) => {
    const items = q.items.map((line) => ({
      lineId: line.id,
      name: line.name,
      quantity: Number(line.quantity),
      unit: line.unit,
      specs: line.specs || "",
      ...getDraft(q, line),
    }));
    const meta = metaDrafts[q.id] || {};
    const result = submitMerchantQuote({
      quotationId: q.id,
      merchantId,
      items,
      deliveryFee: meta.deliveryFee || 0,
      deliveryEstimate: meta.deliveryEstimate || "",
      deliveryMethods: meta.deliveryMethods || ["merchant_delivery", "customer_collection"],
      notes: meta.notes || "",
    });
    if (!result?.ok) {
      setErrors((prev) => ({ ...prev, [q.id]: result?.error || "Please complete every requested line." }));
      notify(result?.error || "Please complete every requested line.", "error");
      return;
    }
    setErrors((prev) => ({ ...prev, [q.id]: "" }));
    notify(`Complete quotation submitted for ${q.id}. Valid for 48 hours.`, "success");
  };
  const setMeta = (qId, patch) => setMetaDrafts((prev) => ({ ...prev, [qId]: { deliveryMethods: ["merchant_delivery", "customer_collection"], ...(prev[qId] || {}), ...patch } }));
  const remaining = (deadline) => {
    const ms = Date.parse(deadline || 0) - Date.now();
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  };
  if (!merchantId || !merchant) return <Panel title="Merchant quotations"><p className="text-sm text-[var(--muted)]">Sign in with a merchant demo account to view quotation requests.</p></Panel>;
  return <div className="space-y-5">
    <div>
      <div className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Merchant workspace</div>
      <h1 className="mt-1 text-3xl font-extrabold">Quotation requests</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Every eligible merchant receives the full materials request. You must respond to every line and quote the complete quantity.</p>
    </div>
    {!eligible.length ? <Panel title="No quotation requests"><p className="text-sm text-[var(--muted)]">When a customer submits a request and your store meets the 60% inventory-coverage threshold, it will appear here.</p></Panel> : eligible.map((q) => {
      const submitted = state.merchantQuotes.find((x) => x.quotationId === q.id && x.merchantId === merchantId);
      const expired = Date.parse(q.merchantResponseDeadlineAt || 0) <= Date.now();
      const selected = q.selectedMerchantQuoteId && submitted?.id === q.selectedMerchantQuoteId;
      return <Panel key={q.id} title={`${q.id} · ${q.name}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span>{q.items.length} requested materials</span><span>·</span>
            <span>{q.deliveryLocation || "Delivery location not specified"}</span>
            <span>·</span><span>{q.neededBy || "No required date"}</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${expired ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
            {expired ? "Response window expired" : `24-hour deadline · ${remaining(q.merchantResponseDeadlineAt)}`}
          </span>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--soft)] p-3 text-xs">
          <span><b>Customer request:</b> {q.items.length} lines · full-order quotation required</span>
          <a className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-bold" href={`/merchant/messages?quotation=${q.id}&customer=1`}>Open in-app chat</a>
        </div>
        {q.items.map((line) => {
          const d = getDraft(q, line);
          return <div key={line.id} className="mb-3 rounded-xl border border-[var(--line)] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><b>{line.name}</b><p className="text-xs text-[var(--muted)]">{line.quantity} {line.unit} requested</p></div>
              <span className="rounded-full bg-[var(--soft)] px-2 py-1 text-[11px]">Customer requirement · Read only</span>
            </div>
            {line.specs && <p className="mt-2 rounded-lg bg-[var(--soft)] p-2 text-xs">{line.specs}</p>}
            <fieldset className="mt-3">
              <legend className="text-xs font-bold text-[var(--muted)]">Your response for this material</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {[
                  ["CAN_SUPPLY", "Can be supplied", "I have the requested quantity in stock."],
                  ["CAN_SOURCE", "Can be sourced", "I will obtain the full quantity."],
                  ["CANNOT_SOURCE", "Cannot be sourced", "I cannot obtain this material."],
                ].map(([value, label, hint]) => (
                  <label key={value} className={`cursor-pointer rounded-xl border p-3 ${d.supplyStatus === value ? "border-[var(--red)] bg-[var(--blush)]" : "border-[var(--line)]"}`}>
                    <span className="flex items-center gap-2 text-xs font-bold"><input type="radio" name={`${q.id}-${line.id}`} checked={d.supplyStatus === value} disabled={expired} onChange={() => setDraft(q, line, { supplyStatus: value })} />{label}</span>
                    <span className="mt-1 block text-[11px] text-[var(--muted)]">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {d.supplyStatus !== "CANNOT_SOURCE" && <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold">Exact variation / brand / grade
                <input disabled={expired} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={d.variation} onChange={(e) => setDraft(q, line, { variation: e.target.value })} placeholder="e.g. Dangote 42.5R, 50kg" />
              </label>
              <label className="text-xs font-semibold">Unit price (₦)
                <input disabled={expired} type="number" min="1" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={d.unitPrice} onChange={(e) => setDraft(q, line, { unitPrice: e.target.value })} placeholder="Enter final unit price" />
              </label>
              {d.supplyStatus === "CAN_SOURCE" && <label className="text-xs font-semibold sm:col-span-2">Estimated sourcing time
                <input disabled={expired} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={d.sourcingTime} onChange={(e) => setDraft(q, line, { sourcingTime: e.target.value })} placeholder="e.g. 2–3 days" />
              </label>}
              <p className="text-xs text-[var(--muted)] sm:col-span-2">Full requested quantity: <b>{line.quantity} {line.unit}</b>. Partial quantities are not accepted.</p>
            </div>}
            {d.supplyStatus === "CANNOT_SOURCE" && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">This response means you cannot provide a complete quotation. WakaStore will not split this customer's order across other merchants.</p>}
          </div>;
        })}
        <div className="mt-4 rounded-xl border border-[var(--line)] p-3">
          <h3 className="text-sm font-bold">Delivery and quotation details</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <label className="text-xs font-semibold">Delivery fee (₦)
              <input disabled={expired} type="number" min="0" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={(metaDrafts[q.id] || {}).deliveryFee ?? submitted?.deliveryFee ?? ""} onChange={(e) => setMeta(q.id, { deliveryFee: e.target.value })} placeholder="0" />
            </label>
            <label className="text-xs font-semibold">Estimated fulfilment time
              <input disabled={expired} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={(metaDrafts[q.id] || {}).deliveryEstimate ?? submitted?.deliveryEstimate ?? ""} onChange={(e) => setMeta(q.id, { deliveryEstimate: e.target.value })} placeholder="e.g. 2–3 days" />
            </label>
            <label className="text-xs font-semibold">Quotation notes
              <input disabled={expired} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm" value={(metaDrafts[q.id] || {}).notes ?? submitted?.notes ?? ""} onChange={(e) => setMeta(q.id, { notes: e.target.value })} placeholder="Optional terms" />
            </label>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Your submitted quotation remains valid for 48 hours. The customer will compare complete offers.</p>
        </div>
        {errors[q.id] && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors[q.id]}</p>}
        {selected && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><b>The customer selected your quotation.</b><p className="mt-1 text-xs">Confirm that you can honour the complete order and the quoted prices.</p><button className="mt-2 rounded-xl bg-[var(--red)] px-4 py-2 text-sm font-bold text-white" onClick={() => confirmMerchantQuotation(q.id, merchantId)}>Confirm complete order</button></div>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[var(--muted)]">{submitted ? `Submitted ${new Date(submitted.submittedAt).toLocaleString()} · valid until ${new Date(submitted.validUntil).toLocaleString()}` : "Not yet submitted"}</span>
          <button disabled={expired || Boolean(q.selectedMerchantQuoteId) || q.status === "Paid — funds pending acceptance"} className="rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" onClick={() => send(q)}>{submitted ? "Update quotation" : "Submit complete quotation"}</button>
        </div>
      </Panel>;
    })}
  </div>;
}

export function MerchantProducts() {
  const { state, addProduct, updateProduct, deleteProduct, notify } = useAppState();
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Cement Merchant",
    price: 1000,
    stock: 10,
    unit: "bag",
    image:
      "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=700&q=80",
  });
  const myProducts = state.products.filter((p) => {
    const matchesMerchant = p.merchantId === merchantIdOf(state);
    const matchesSearch = !search.trim() || `${p.name || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStock = stockFilter === "all" || (stockFilter === "in" ? Number(p.stock) > 0 && p.available !== false : Number(p.stock) <= 0 || p.available === false);
    return matchesMerchant && !p.archived && matchesSearch && matchesStock;
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || Number(form.price) <= 0 || Number(form.stock) < 0 || !form.unit.trim()) {
      setFormError("Enter a name, description, positive price, valid stock and unit.");
      return;
    }
    setFormError("");
    addProduct({
      id: `p-${Date.now()}`,
      merchant:
        state.merchants.find((m) => m.id === merchantIdOf(state))?.name ||
        "Merchant",
      merchantId: merchantIdOf(state),
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      available: true,
      stock: Number(form.stock),
    });
    setForm({
      ...form,
      name: "",
      description: "",
      price: 1000,
      stock: 10,
      unit: "bag",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">My products</h1>
      <BulkInventoryUpload />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5"
        >
          <h3 className="text-lg font-extrabold">Add a product</h3>
          {formError && <p role="alert" className="rounded-lg bg-[var(--blush)] p-3 text-sm font-semibold text-[var(--red)]">{formError}</p>}
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Product name"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
            rows="3"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
            >
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              placeholder="Price"
              className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
              placeholder="Stock"
              className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
            />
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Unit"
              className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--red)] px-4 py-3 font-bold text-white"
          >
            Add product
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my inventory" aria-label="Search my products" className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm" /><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Filter inventory by stock" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"><option value="all">All stock</option><option value="in">In stock</option><option value="out">Out of stock</option></select></div>
          {!myProducts.length && <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">No products match this inventory search.</div>}
          {myProducts.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-3"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold">{product.name}</h4>
                    <p className="text-sm text-[var(--muted)]">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatNaira(product.price)}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {product.stock} {product.unit}
                    </div>
                  </div>
                </div>
                {editingId === product.id ? <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input aria-label="Edit product name" value={editDraft.name || ""} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-2 text-sm" />
                  <input aria-label="Edit product price" type="number" min="1" value={editDraft.price ?? ""} onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })} className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-2 text-sm" />
                  <input aria-label="Edit product stock" type="number" min="0" value={editDraft.stock ?? ""} onChange={(e) => setEditDraft({ ...editDraft, stock: e.target.value })} className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-2 text-sm" />
                  <div className="flex gap-2"><button type="button" onClick={() => { if (!editDraft.name?.trim() || Number(editDraft.price) <= 0 || Number(editDraft.stock) < 0) return notify("Enter a product name, positive price and valid stock.", "error"); updateProduct(product.id, { name: editDraft.name.trim(), price: Number(editDraft.price), stock: Number(editDraft.stock) }); notify("Product changes saved."); setEditingId(null); }} className="rounded-lg bg-[var(--red)] px-3 py-2 text-xs font-bold text-white">Save changes</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-[var(--soft)] px-3 py-2 text-xs font-bold">Cancel</button></div>
                </div> : <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setEditingId(product.id); setEditDraft({ name: product.name, price: product.price, stock: product.stock }); }} className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold">Edit product</button>
                  <button type="button" onClick={() => updateProduct(product.id, { stock: product.stock + 5 })} className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold">Restock +5</button>
                  <button type="button" onClick={() => window.confirm(`Delete ${product.name}?`) && deleteProduct(product.id, "Merchant removed product from catalogue.")} className="rounded-lg bg-[var(--blush)] px-3 py-1.5 text-xs font-bold text-[var(--red)]">Delete</button>
                </div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MerchantOrders() {
  const { state, updateSubOrderStatus, setMerchantSourcing } = useAppState();
  const me = merchantIdOf(state);
  const merchant = state.merchants.find((m) => m.id === me);
  const orders = state.orders.filter((order) => {
    const v = itemsForMerchant(upgradeOrder(order), me);
    return v.current.length || v.former.length || order.subOrders?.some((sub) => sub.merchantId === me);
  });
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Incoming orders</h1>
      <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm font-semibold">
        <input type="checkbox" checked={Boolean(merchant?.acceptsSourcing)} onChange={(e) => setMerchantSourcing(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--red)]" />
        <span>I can source products I do not stock. <span className="block font-normal text-[var(--muted)]">Lets WakaStore offer you individual unavailable items from other orders. You still have to confirm each one.</span></span>
      </label>
      {!orders.length && <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">No orders yet.</p>}
      {orders.map((order) => {
        const sub = order.subOrders?.find((x) => x.merchantId === me);
        return (
          <div key={order.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5" data-order={order.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{order.id}</div>
                <h3 className="mt-1 text-xl font-extrabold">Customer order</h3>
              </div>
              <span className="rounded-full bg-[var(--blush)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--red)]">{order.status}</span>
            </div>
            <div className="mt-4">
              <MerchantOrderItems order={upgradeOrder(order)} merchantId={me} />
            </div>
            {sub && sub.status === "Pending" && (
              <button type="button" onClick={() => updateSubOrderStatus(order.id, me, "Accepted")} className="primary mt-3 min-h-12">Accept my part of this order</button>
            )}
            {sub && sub.status !== "Pending" && <p className="mt-3 text-xs text-[var(--muted)]">Your part of this order: {sub.status}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function MerchantSettlements() {
  const { state, updateState } = useAppState();
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const merchantId = merchantIdOf(state);
  const mine = (state.orders || []).map((o) => ({ o, a: moneyByMerchant(o).find((x) => x.merchantId === merchantId) })).filter((r) => r.a);
  const sum = (pick) => mine.reduce((n, r) => n + pick(r.a), 0);
  const settledNet = sum((a) => a.settled.merchantShare);
  const commission = sum((a) => a.settled.commission + a.pending.commission);
  const pending = sum((a) => a.pending.merchantShare);
  const held = sum((a) => a.held.gross);
  const refunded = sum((a) => a.refunded);
  const withdrawals = (state.withdrawals || []).filter((w) => w.merchantId === merchantId);
  const withdrawn = withdrawals.reduce((n, w) => n + w.amount, 0);
  const available = Math.max(0, settledNet - withdrawn);
  const withdraw = () => {
    const value = Math.round(Number(amount));
    if (!(value > 0)) return setMsg("Enter an amount greater than zero.");
    if (value > available) return setMsg("That is more than your available balance. Only accepted or admin-released orders can be withdrawn.");
    updateState((prev) => ({ ...prev, withdrawals: [{ id: `WD-${Date.now()}`, merchantId, amount: value, status: "Requested (simulated)", at: new Date().toLocaleString("en-NG") }, ...(prev.withdrawals || [])] }));
    setAmount(""); setMsg("Withdrawal requested. In production the payment provider pays this out.");
  };
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Settlements</h1>
      <p className="text-sm text-[var(--muted)]">Simulation. You receive materials value minus WakaStore's commission, plus delivery charges. Money becomes Available only after the customer accepts the complete delivery, or an admin authorises release.</p>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Pending" value={formatNaira(pending)} note="Awaiting customer acceptance" Icon={CircleDollarSign} />
        <Metric label="Available" value={formatNaira(available)} note="Accepted, ready to withdraw" Icon={CheckCircle2} />
        <Metric label="On hold" value={formatNaira(held)} note="Open dispute on these items" Icon={FileWarning} />
        <Metric label="Commission" value={formatNaira(commission)} note={`On materials only. Refunds: ${formatNaira(refunded)}`} Icon={CreditCard} />
      </div>
      <Panel title="Withdraw">
        <div className="flex flex-wrap items-center gap-2">
          <input value={amount} onChange={(e) => { setAmount(e.target.value); setMsg(""); }} inputMode="numeric" placeholder="Amount (₦)" className="w-44 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm" />
          <button onClick={withdraw} className="rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white">Request withdrawal</button>
          <span className="text-xs text-[var(--muted)]">Available: {formatNaira(available)}</span>
        </div>
        {msg && <p className="mt-2 text-sm font-bold">{msg}</p>}
        {withdrawals.length > 0 && <div className="mt-3 space-y-2 text-sm">{withdrawals.map((w) => <div key={w.id} className="flex justify-between rounded-xl bg-[var(--soft)] px-3 py-2"><span>{w.id} · {w.at}</span><span><b>{formatNaira(w.amount)}</b> · {w.status}</span></div>)}</div>}
      </Panel>
      <Panel title="Order settlement history">
        {mine.length ? <div className="space-y-2 text-sm">{mine.map(({ o, a }) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--soft)] px-3 py-2.5">
            <b>{o.id}</b>
            <span className="text-[var(--muted)]">{a.settled.merchantShare ? `settled ${formatNaira(a.settled.merchantShare)}` : `pending ${formatNaira(a.pending.merchantShare)}${a.underReview ? " (admin review)" : ""}`}{a.held.gross ? ` · on hold ${formatNaira(a.held.gross)}` : ""} · commission {formatNaira(a.settled.commission + a.pending.commission)}</span>
          </div>))}</div> : <p className="text-sm text-[var(--muted)]">No settlements yet. They appear once a customer pays for an order assigned to you.</p>}
      </Panel>
    </div>
  );
}

export function MerchantAccount() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Business profile</h1>
      <MerchantDocuments />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Profile details">
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-[var(--soft)] p-3">
              <span className="text-[var(--muted)]">Business name</span>
              <div className="mt-1 font-bold">BuildRight Supplies</div>
            </div>
            <div className="rounded-xl bg-[var(--soft)] p-3">
              <span className="text-[var(--muted)]">Approval status</span>
              <div className="mt-1 font-bold text-[var(--red)]">Approved</div>
            </div>
            <div className="rounded-xl bg-[var(--soft)] p-3">
              <span className="text-[var(--muted)]">Categories</span>
              <div className="mt-1 font-bold">Cement · Iron Rods</div>
            </div>
          </div>
        </Panel>
        <Panel title="Settings">
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2.5"
            >
              <span>Notifications</span>
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2.5"
            >
              <span>Theme</span>
              <SunMedium size={16} />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2.5"
            >
              <span>Security</span>
              <ShieldCheck size={16} />
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function MerchantInventory() {
  const { state, updateProduct } = useAppState();
  const merchantId = merchantIdOf(state);
  const products = state.products.filter((p) => p.merchantId === merchantId);
  const low = products.filter((p) => Number(p.stock) <= 20);
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Stock control</p><h1 className="mt-1 text-3xl font-extrabold">Inventory</h1><p className="mt-2 text-sm text-[var(--muted)]">Live demo inventory shared with the marketplace and quotation matcher.</p></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Active SKUs" value={products.length} note="Your listed products" Icon={Boxes}/><Metric label="Low stock" value={low.length} note="20 units or fewer" Icon={AlertTriangle}/><Metric label="Total units" value={products.reduce((n,p)=>n+Number(p.stock||0),0).toLocaleString()} note="Across all products" Icon={PackageCheck}/></div><Panel title="Stock levels">{products.map((p)=><div key={p.id} className="grid gap-2 border-b border-[var(--line)] py-3 last:border-0 sm:grid-cols-[1fr_130px_150px] sm:items-center"><div><b className="text-sm">{p.name}</b><p className="text-xs text-[var(--muted)]">{p.category} · {p.id}</p></div><div className={`text-sm font-extrabold ${p.stock<=20?'text-[var(--red)]':'text-[var(--ink)]'}`}>{p.stock} {p.unit} {p.stock<=20?'· Low stock':''}</div><div className="flex gap-2"><button onClick={()=>updateProduct(p.id,{stock:Math.max(0,Number(p.stock)-1)})} className="rounded-lg bg-[var(--soft)] px-3 py-2 text-sm font-bold">−</button><button onClick={()=>updateProduct(p.id,{stock:Number(p.stock)+10})} className="rounded-lg bg-[var(--red)] px-3 py-2 text-sm font-bold text-white">+10 restock</button></div></div>)}</Panel></div>;
}

export function MerchantFulfillment() {
  const { state, updateSubOrderStatus } = useAppState();
  const merchantId = merchantIdOf(state);
  const assigned = state.orders.flatMap((o)=> (o.subOrders||[]).filter((s)=>s.merchantId===merchantId && !["Rejected","Reassigned"].includes(s.status)).map((s)=>({ ...s, orderId:o.id, customer:o.customer || "WakaStore customer", address:o.deliveryAddress || {}, fullOrderRequired:Boolean(o.fullOrderRequired), deliveryMethod:o.deliveryMethod || "merchant_delivery" })));
  const actionsFor = (order) => order.deliveryMethod === "customer_collection"
    ? { Pending:["Accepted","Accept order"], Accepted:["Packed","Mark packed"], Packed:["Ready for collection","Mark ready for pickup"], "Ready for collection":["Delivered","Confirm customer collection"] }[order.status]
    : { Pending:["Accepted","Accept order"], Accepted:["Packed","Mark packed"], Packed:["Dispatched","Dispatch order"], Dispatched:["Delivered","Mark delivered"] }[order.status];
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Pick, pack and dispatch</p><h1 className="mt-1 text-3xl font-extrabold">Fulfillment</h1><p className="mt-2 text-sm text-[var(--muted)]">Move orders through each fulfilment stage and keep customer tracking current.</p></div>{!assigned.length?<Panel title="No orders to fulfil"><p className="text-sm text-[var(--muted)]">New customer orders assigned to your store will appear here.</p></Panel>:assigned.map((s)=><Panel key={`${s.orderId}-${s.merchantId}`} title={s.orderId} action={<span className="rounded-full bg-[var(--blush)] px-3 py-1 text-xs font-bold text-[var(--red)]">{s.status}</span>}><div className="space-y-2 text-sm">{s.items.map((it,i)=><div key={i} className="flex justify-between gap-3"><span>{it.quantity} × {it.name}</span><b>{formatNaira(it.lineTotal || it.price*it.quantity)}</b></div>)}</div><div className="mt-4 flex flex-wrap gap-2">{actionsFor(s) && ["Pending","Accepted"].includes(s.status) && <button onClick={()=>updateSubOrderStatus(s.orderId,merchantId,actionsFor(s)[0])} className="rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white">{actionsFor(s)[1]}</button>}{s.status==="Pending" && !s.fullOrderRequired && <button onClick={()=>updateSubOrderStatus(s.orderId,merchantId,"Rejected")} className="rounded-xl bg-[var(--soft)] px-4 py-2.5 text-sm font-bold">Reject & reroute</button>}{s.fullOrderRequired && <p className="mt-2 text-xs text-[var(--muted)]">Complete-list order: you are responsible for every material. If you cannot fulfil the complete order, contact WakaStore Admin; this order will not be split across other merchants.</p>}</div><DispatchProofPanel order={state.orders.find((o)=>o.id===s.orderId)} sub={s} merchantId={merchantId} /><DeliveryRecordCard order={state.orders.find((o)=>o.id===s.orderId)} audience="merchant" /></Panel>)}</div>;
}

export function MerchantEarnings() {
  const { state } = useAppState();
  const merchantId = merchantIdOf(state);
  const rows = state.orders.flatMap((order) => (order.subOrders || [])
    .filter((sub) => sub.merchantId === merchantId)
    .map((sub) => {
      if (order.fullOrderRequired) {
        return {
          order: order.id,
          status: order.settlementStatus === "SETTLED" ? "Completed" : "Pending settlement",
          amount: Number(order.merchantProceeds || 0),
          commission: Number(order.platformCommission || 0),
          pending: order.settlementStatus !== "SETTLED",
        };
      }
      const amount = (sub.items || []).reduce((n, item) => n + Number(item.lineTotal || item.price * item.quantity || 0), 0);
      return {
        order: order.id,
        status: sub.status,
        amount: ["Delivered", "Completed"].includes(sub.status) ? amount * 0.975 : 0,
        commission: ["Delivered", "Completed"].includes(sub.status) ? amount * 0.025 : 0,
        pending: !["Delivered", "Completed"].includes(sub.status),
      };
    }));
  const settled = rows.filter((row) => !row.pending);
  const pending = rows.filter((row) => row.pending);
  const gross = settled.reduce((n, row) => n + row.amount, 0);
  const pendingBalance = pending.reduce((n, row) => n + row.amount, 0);
  const fee = settled.reduce((n, row) => n + row.commission, 0);
  return <div className="space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Merchant performance</p><h1 className="mt-1 text-3xl font-extrabold">Earnings</h1><p className="mt-2 text-sm text-[var(--muted)]">Quotation-order proceeds remain pending until complete delivery and customer acceptance or admin resolution.</p></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Settled proceeds" value={formatNaira(gross)} note="After commission" Icon={CircleDollarSign}/><Metric label="Pending settlement" value={formatNaira(pendingBalance)} note="Not withdrawable yet" Icon={WalletCards}/><Metric label="WakaStore commission" value={formatNaira(fee)} note="5% of accepted materials only for quotation orders" Icon={CreditCard}/></div>
    <Panel title="Order earnings">{rows.length ? rows.map((row, i) => <div key={`${row.order}-${i}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] py-3 text-sm last:border-0"><div><b>{row.order}</b><p className="text-xs text-[var(--muted)]">{row.status}</p></div><b>{formatNaira(row.amount)}</b></div>) : <p className="text-sm text-[var(--muted)]">Earnings will appear as orders are completed.</p>}</Panel>
  </div>;
}

export function AdminDashboard() {
  const { state } = useAppState();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Platform control
        </div>
        <h1 className="mt-2 text-3xl font-extrabold">Admin overview</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Customers"
          value={String(state.customers?.length || 2)}
          note="Active accounts"
          Icon={Users}
        />
        <Metric
          label="Merchants"
          value={String(state.merchants?.length || 5)}
          note="Registered businesses"
          Icon={Store}
        />
        <Metric
          label="Orders"
          value={String(state.orders.length)}
          note="Parent orders"
          Icon={PackageCheck}
        />
        <Metric
          label="Refunds"
          value={String(state.refunds.length)}
          note="Open review"
          Icon={FileWarning}
        />
        <Metric
          label="Revenue"
          value={formatNaira(5024000)}
          note="Gross marketplace revenue"
          Icon={BarChart3}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Pending merchant applications">
          <div className="space-y-3 text-sm text-[var(--muted)]">
            {state.merchants
              .filter((merchant) => merchant.status === "pending")
              .map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--soft)] px-3 py-2.5"
                >
                  <span className="font-bold text-[var(--ink)]">
                    {merchant.name}
                  </span>
                  <span className="text-[11px] uppercase">Pending</span>
                </div>
              ))}
          </div>
        </Panel>
        <Panel title="Recent platform activity">
          <div className="space-y-3 text-sm text-[var(--muted)]">
            {state.auditLogs.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl bg-[var(--soft)] px-3 py-2.5"
              >
                <div className="font-bold text-[var(--ink)]">
                  {entry.action}
                </div>
                <div className="mt-1 text-xs">
                  {entry.entity} · {entry.date}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function AdminMerchants() {
  const { state, approveMerchant, rejectMerchant, suspendMerchant, reactivateMerchant, removeMerchant } =
    useAppState();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const merchantCategories = [...new Set(state.merchants.flatMap((merchant) => merchant.categories || []))];
  const merchants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.merchants
      .filter((merchant) => {
        const details = `${merchant.name || ""} ${merchant.ownerName || ""} ${merchant.email || ""} ${merchant.contact || ""} ${merchant.id || ""}`.toLowerCase();
        return (!term || details.includes(term)) && (status === "all" || merchant.status === status) && (category === "all" || (merchant.categories || []).includes(category));
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "status") return a.status.localeCompare(b.status);
        const left = new Date(a.submittedAt || a.approvedAt || 0).getTime();
        const right = new Date(b.submittedAt || b.approvedAt || 0).getTime();
        return sort === "oldest" ? left - right : right - left;
      });
  }, [state.merchants, search, status, category, sort]);
  const askReason = (action, merchant) => {
    const reason = window.prompt(`${action} reason for ${merchant.name}`)?.trim();
    if (!reason) return null;
    return window.confirm(`${action} ${merchant.name}?`) ? reason : null;
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold">Merchant management</h1><p className="mt-1 text-sm text-[var(--muted)]">{merchants.length} of {state.merchants.length} applications</p></div><button type="button" onClick={() => { setSearch(""); setStatus("all"); setCategory("all"); setSort("newest"); }} className="text-sm font-bold text-[var(--red)]">Clear filters</button></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, contact or ID" aria-label="Search merchant applications" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm"><option value="all">All statuses</option>{["pending", "approved", "rejected", "suspended"].map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm"><option value="all">All categories</option>{merchantCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Business name</option><option value="status">Status</option></select></div>
      <div className="space-y-3">
        {merchants.map((merchant) => (
          <div
            key={merchant.id}
            className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-extrabold text-lg">{merchant.name}</div>
                <div className="text-sm text-[var(--muted)]">
                  {merchant.contact} · {merchant.address}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--blush)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--red)]">
                  {merchant.status}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.confirm(`Approve ${merchant.name}?`) && approveMerchant(merchant.id)}
                disabled={merchant.status === "approved"}
                className="rounded-lg bg-[var(--red)] px-3 py-1.5 text-xs font-bold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => { const reason = askReason("Reject", merchant); if (reason) rejectMerchant(merchant.id, reason); }}
                className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => { const reason = askReason("Suspend", merchant); if (reason) suspendMerchant(merchant.id, reason); }}
                className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold"
              >
                Suspend
              </button>
              {merchant.status === "suspended" && <button type="button" onClick={() => window.confirm(`Reactivate ${merchant.name}?`) && reactivateMerchant(merchant.id)} className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold">Reactivate</button>}
              <button type="button" onClick={() => setSelected(merchant)} className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold">Review details</button>
              <button type="button" onClick={() => { const reason = window.prompt(`Reason for removing ${merchant.name}?`, "Policy or verification failure"); if (reason?.trim() && window.confirm(`Permanently remove ${merchant.name} from this demo marketplace?`)) removeMerchant(merchant.id, reason.trim()); }} className="rounded-lg bg-[var(--blush)] px-3 py-1.5 text-xs font-bold text-[var(--red)]">Remove merchant</button>
            </div>
            <MerchantDocumentReview merchant={merchant} />
          </div>
        ))}
        {!merchants.length && <div className="rounded-[22px] border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">No merchant applications match these filters.</div>}
      </div>
      {selected && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><div className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--surface)] p-6 shadow-xl"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">APPLICATION REVIEW</p><h2 className="text-2xl font-extrabold">{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close application details"><X /></button></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[var(--muted)]">Status</dt><dd className="font-bold capitalize">{selected.status}</dd></div><div><dt className="text-[var(--muted)]">Application ID</dt><dd className="font-bold">{selected.id}</dd></div><div><dt className="text-[var(--muted)]">Contact</dt><dd className="font-bold">{selected.contact || "Not supplied"}</dd></div><div><dt className="text-[var(--muted)]">Address</dt><dd className="font-bold">{selected.address || "Not supplied"}</dd></div><div className="sm:col-span-2"><dt className="text-[var(--muted)]">Categories</dt><dd className="font-bold">{(selected.categories || []).join(", ") || "Not supplied"}</dd></div><div className="sm:col-span-2"><dt className="text-[var(--muted)]">Business description</dt><dd>{selected.description || "Not supplied"}</dd></div>{selected.rejectionReason && <div className="sm:col-span-2"><dt className="text-[var(--muted)]">Previous rejection reason</dt><dd>{selected.rejectionReason}</dd></div>}</dl></div></div>}
    </div>
  );
}

export function AdminClients() {
  const { state } = useAppState();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Customer directory</h1>
      <div className="space-y-3">
        {state.customers?.map((customer) => (
          <div
            key={customer.id}
            className="flex items-center justify-between rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div>
              <div className="font-bold">{customer.name}</div>
              <div className="text-sm text-[var(--muted)]">
                {customer.email}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                {customer.accountStatus}
              </span>
              <Link
                to="/admin/orders"
                className="text-sm font-bold text-[var(--red)]"
              >
                Orders
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminProducts() {
  const { state, deleteProduct } = useAppState();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Product directory</h1>
      <div className="space-y-3">
        {state.products.map((product) => (
          <div
            key={product.id}
            className="flex gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-3"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold">{product.name}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {product.merchant}
                  </div>
                </div>
                <div className="font-bold">{formatNaira(product.price)}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    deleteProduct(
                      product.id,
                      "Admin removed product for policy compliance.",
                    )
                  }
                  className="rounded-lg bg-[var(--blush)] px-3 py-1.5 text-xs font-bold text-[var(--red)]"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { state, adminResolveQuotationAcceptance, notify } = useAppState();
  const pendingAcceptance = state.orders.filter((order) =>
    order.fullOrderRequired &&
    order.customerAcceptanceStatus === "AWAITING_DELIVERY" &&
    (order.subOrders || []).some((sub) => sub.status === "Delivered")
  );
  const resolve = (order, outcome) => {
    const note = window.prompt(
      outcome === "release"
        ? `Record why delivery evidence supports settlement for ${order.id}:`
        : `Record the investigation note for ${order.id}:`,
      outcome === "release" ? "Complete delivery verified with customer." : "Contacting customer and reviewing delivery evidence."
    );
    if (!note?.trim()) return;
    const ok = adminResolveQuotationAcceptance(order.id, outcome, note.trim());
    notify(ok ? (outcome === "release" ? "Settlement released after admin review." : "Order moved to admin investigation.") : "Could not update this order.", ok ? "success" : "error");
  };
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-extrabold">Orders & settlement review</h1><p className="mt-1 text-sm text-[var(--muted)]">Monitor fulfilment and review delivered quotation orders awaiting customer acceptance.</p></div>
      <Panel title={`Admin intervention · ${pendingAcceptance.length} awaiting review`}>
        {!pendingAcceptance.length ? <p className="text-sm text-[var(--muted)]">No delivered quotation orders are currently waiting for customer acceptance.</p> : <div className="space-y-3">
          {pendingAcceptance.map((order) => <div key={order.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><b>{order.id} · {order.merchantName}</b><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">{order.adminReviewStatus === "UNDER_REVIEW" ? "Under investigation" : "Customer not yet accepted"}</span></div>
            <p className="mt-1 text-xs text-[var(--muted)]">Customer: {order.customerEmail || "Not recorded"} · Payment: {formatNaira(order.total)} · Materials: {formatNaira(order.subtotal)}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">Merchant marked the complete order delivered. Funds remain pending until the customer accepts or an administrator reviews the evidence.</p>
            <div className="mt-3"><DeliveryRecordCard order={order} audience="admin" /></div>
            {order.adminReviewNote && <p className="mt-2 rounded-lg bg-[var(--surface)] p-2 text-xs">Latest admin note: {order.adminReviewNote}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => resolve(order, "investigate")} className="rounded-lg bg-[var(--surface)] px-3 py-2 text-xs font-bold">Record investigation</button>
              <button onClick={() => resolve(order, "release")} className="rounded-lg bg-[var(--red)] px-3 py-2 text-xs font-bold text-white">Verify delivery & release settlement</button>
            </div>
          </div>)}
        </div>}
      </Panel>
      <Panel title="All parent orders">
        <div className="space-y-3">
          {state.orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-[var(--line)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="font-extrabold text-lg">{order.id}</div><div className="text-sm text-[var(--muted)]">{order.date} · {order.merchantName || `${order.merchants || 1} merchant(s)`}</div></div>
                <span className="rounded-full bg-[var(--blush)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--red)]">{order.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]"><span>Payment: {order.paymentStatus || order.paymentMethod || "—"}</span><span>Settlement: {order.settlementStatus || "Standard order"}</span><span>Total: {formatNaira(order.total || 0)}</span></div>
              {(order.subOrders || []).map((sub) => <div key={sub.merchantId} className="mt-2 rounded-lg bg-[var(--soft)] p-3 text-sm"><b>{sub.merchantName}</b><div className="mt-1 text-xs text-[var(--muted)]">{sub.status}</div></div>)}
            </div>
          ))}
          {!state.orders.length && <p className="text-sm text-[var(--muted)]">No orders yet.</p>}
        </div>
      </Panel>
    </div>
  );
}

export function AdminRefunds() {
  const { state, processRefund } = useAppState();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Refund review</h1>
      <div className="space-y-3">
        {state.refunds.map((refund) => (
          <div
            key={refund.id}
            className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold">{refund.id}</div>
                <div className="text-sm text-[var(--muted)]">
                  {refund.orderId} · {refund.reason}
                </div>
              </div>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                {refund.status}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {refund.items.map((item) => (
                <div key={`${refund.id}-${item.name}`}>
                  {item.quantity} × {item.name}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  processRefund(
                    refund.id,
                    "approved",
                    "Approved after verification of missing item report.",
                  )
                }
                className="rounded-lg bg-[var(--red)] px-3 py-1.5 text-xs font-bold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() =>
                  processRefund(
                    refund.id,
                    "rejected",
                    "Insufficient evidence supplied by customer.",
                  )
                }
                className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAuditLogs() {
  const { state } = useAppState();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Audit logs</h1>
      <div className="space-y-3">
        {state.auditLogs.map((entry) => (
          <div
            key={entry.id}
            className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold">{entry.action}</div>
              <div className="text-xs text-[var(--muted)]">{entry.date}</div>
            </div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              Actor: {entry.actor}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Entity: {entry.entity}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              {entry.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminSourcing() {
  const { state, adminAssignItem } = useAppState();
  const [choice, setChoice] = useState({});
  const [message, setMessage] = useState({});
  const nameOf = (id) => state.merchants.find((m) => m.id === id)?.name || "a merchant";
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Manual sourcing</h1>
      <p className="text-sm text-[var(--muted)]">Items no merchant could supply or source. Assign one by hand. The merchant must still confirm; nothing is treated as sourced until they do.</p>
      {!state.sourcing.length && <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">Nothing waiting for manual sourcing.</p>}
      <div className="space-y-3">
        {state.sourcing.map((entry) => {
          const order = state.orders.find((o) => o.id === entry.orderId);
          const it = order?.items?.find((i) => i.itemId === entry.itemId);
          const open = it && [Sourcing.SOURCING.UNRESOLVED, Sourcing.SOURCING.AWAITING_MERCHANT].includes(it.sourcingStatus);
          const options = state.merchants.filter((m) => m.status === "approved" && !(it?.declinedBy || []).includes(m.id));
          return (
            <div key={entry.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold">{entry.item}</div>
                  <div className="text-sm text-[var(--muted)]">Order {entry.orderId}{it ? ` · ${it.quantity} ${it.unit || ""}` : ""}</div>
                </div>
                <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                  {!it ? entry.status : open ? "Awaiting manual sourcing" : `Assigned to ${nameOf(it.currentMerchantId)}`}
                </span>
              </div>
              <div className="mt-3 text-sm text-[var(--muted)]">{entry.reason}</div>
              {it && it.declinedBy.length > 0 && <div className="mt-1 text-xs text-[var(--muted)]">Already declined: {it.declinedBy.map(nameOf).join(", ")}</div>}
              {open && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select className="h-11 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" aria-label={`Merchant for ${entry.item}`} value={choice[entry.id] || ""} onChange={(e) => setChoice({ ...choice, [entry.id]: e.target.value })}>
                    <option value="">Choose a merchant…</option>
                    {options.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button type="button" disabled={!choice[entry.id]} className="primary min-h-11 disabled:opacity-50" onClick={() => { const r = adminAssignItem(entry.orderId, entry.itemId, choice[entry.id]); setMessage({ ...message, [entry.id]: r.ok ? "" : r.error }); }}>
                    Assign sourcing
                  </button>
                </div>
              )}
              {message[entry.id] && <p role="alert" className="mt-2 text-sm font-semibold text-[var(--red)]">{message[entry.id]}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RolePlaceholder({ role }) {
  return (
    <div className="mx-auto max-w-3xl rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--blush)] text-[var(--red)]">
        <LayoutDashboard size={26} />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold">{role} workspace</h2>
      <p className="mt-2 text-[var(--muted)]">
        The role navigation is active. Please use the dashboard links to
        continue testing.
      </p>
    </div>
  );
}

export function SignOutButton() {
  const navigate = useNavigate();
  const { signOut } = useAppState();

  return (
    <button
      type="button"
      onClick={() => {
        signOut();
        navigate("/login");
      }}
      className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-[var(--red)]"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
