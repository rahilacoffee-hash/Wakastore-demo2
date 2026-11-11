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
  if (role === "admin" || role === "super-admin") return "/admin/overview";
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
    const adminArea = location.pathname.startsWith("/admin");
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
  const { state, updateSubOrderStatus } = useAppState();
  const orders = state.orders.filter((order) =>
    order.subOrders?.some((sub) => sub.merchantId === merchantIdOf(state)),
  );
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Incoming orders</h1>
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                {order.id}
              </div>
              <h3 className="mt-1 text-xl font-extrabold">Customer order</h3>
            </div>
            <span className="rounded-full bg-[var(--blush)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--red)]">
              {order.status}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {order.subOrders
              .filter((sub) => sub.merchantId === merchantIdOf(state))
              .map((sub) => (
                <div
                  key={sub.merchantId}
                  className="rounded-2xl bg-[var(--soft)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{sub.merchantName}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {sub.status}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {sub.items.map((item) => (
                      <li key={item.name}>
                        {item.quantity} × {item.name}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateSubOrderStatus(
                          order.id,
                          merchantIdOf(state),
                          "Accepted",
                        )
                      }
                      className="rounded-lg bg-[var(--red)] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSubOrderStatus(
                          order.id,
                          merchantIdOf(state),
                          "Rejected",
                        )
                      }
                      className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSubOrderStatus(
                          order.id,
                          merchantIdOf(state),
                          "Packed",
                        )
                      }
                      className="rounded-lg bg-[var(--soft)] px-3 py-1.5 text-xs font-bold"
                    >
                      Update status
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MerchantSettlements() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Settlements</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric
          label="Pending"
          value={formatNaira(265000)}
          note="Awaiting payout"
          Icon={CircleDollarSign}
        />
        <Metric
          label="Completed"
          value={formatNaira(1340000)}
          note="Last 30 days"
          Icon={CheckCircle2}
        />
        <Metric
          label="Refunds"
          value={formatNaira(12000)}
          note="Demo settlement records"
          Icon={FileWarning}
        />
      </div>
      <Panel title="Settlement history">
        <div className="space-y-3 text-sm text-[var(--muted)]">
          {[
            "Settlement 2026-10-18",
            "Settlement 2026-09-18",
            "Settlement 2026-08-20",
          ].map((entry, index) => (
            <div
              key={entry}
              className="flex items-center justify-between rounded-xl bg-[var(--soft)] px-3 py-2.5"
            >
              <span>{entry}</span>
              <strong className="text-[var(--ink)]">
                {formatNaira([320000, 280000, 410000][index])}
              </strong>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function MerchantAccount() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Business profile</h1>
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
  const assigned = state.orders.flatMap((o)=> (o.subOrders||[]).filter((s)=>s.merchantId===merchantId && !["Rejected","Reassigned"].includes(s.status)).map((s)=>({ ...s, orderId:o.id, customer:o.customer || "WakaStore customer", address:o.deliveryAddress || {} })));
  const actions = { Pending:["Accepted","Accept order"], Accepted:["Packed","Mark packed"], Packed:["Dispatched","Dispatch order"], Dispatched:["Delivered","Mark delivered"] };
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Pick, pack and dispatch</p><h1 className="mt-1 text-3xl font-extrabold">Fulfillment</h1><p className="mt-2 text-sm text-[var(--muted)]">Move orders through each fulfilment stage and keep customer tracking current.</p></div>{!assigned.length?<Panel title="No orders to fulfil"><p className="text-sm text-[var(--muted)]">New customer orders assigned to your store will appear here.</p></Panel>:assigned.map((s)=><Panel key={`${s.orderId}-${s.merchantId}`} title={s.orderId} action={<span className="rounded-full bg-[var(--blush)] px-3 py-1 text-xs font-bold text-[var(--red)]">{s.status}</span>}><div className="space-y-2 text-sm">{s.items.map((it,i)=><div key={i} className="flex justify-between gap-3"><span>{it.quantity} × {it.name}</span><b>{formatNaira(it.lineTotal || it.price*it.quantity)}</b></div>)}</div><div className="mt-4 flex flex-wrap gap-2">{actions[s.status] && <button onClick={()=>updateSubOrderStatus(s.orderId,merchantId,actions[s.status][0])} className="rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white">{actions[s.status][1]}</button>}{s.status==="Pending" && <button onClick={()=>updateSubOrderStatus(s.orderId,merchantId,"Rejected")} className="rounded-xl bg-[var(--soft)] px-4 py-2.5 text-sm font-bold">Reject & reroute</button>}</div></Panel>)}</div>;
}

export function MerchantEarnings() {
  const { state } = useAppState();
  const merchantId = merchantIdOf(state);
  const rows = state.orders.flatMap((o)=>(o.subOrders||[]).filter((s)=>s.merchantId===merchantId).map((s)=>({order:o.id,status:s.status,amount:(s.items||[]).reduce((n,i)=>n+Number(i.lineTotal || i.price*i.quantity || 0),0)})));
  const gross = rows.filter((r)=>["Delivered","Completed"].includes(r.status)).reduce((n,r)=>n+r.amount,0);
  const fee = Math.round(gross * Number(state.settings?.feeRate ?? 0.025));
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Merchant performance</p><h1 className="mt-1 text-3xl font-extrabold">Earnings</h1><p className="mt-2 text-sm text-[var(--muted)]">Demo settlement estimate. No real payouts are initiated.</p></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Delivered sales" value={formatNaira(gross)} note="Completed fulfilment" Icon={CircleDollarSign}/><Metric label="Platform fee" value={formatNaira(fee)} note={`${(Number(state.settings?.feeRate ?? 0.025)*100).toFixed(1)}% demo fee`} Icon={CreditCard}/><Metric label="Estimated earnings" value={formatNaira(Math.max(0,gross-fee))} note="Before payout" Icon={WalletCards}/></div><Panel title="Order earnings">{rows.length?rows.map((r,i)=><div key={`${r.order}-${i}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] py-3 text-sm last:border-0"><div><b>{r.order}</b><p className="text-xs text-[var(--muted)]">{r.status}</p></div><b>{formatNaira(r.amount)}</b></div>):<p className="text-sm text-[var(--muted)]">Earnings will appear as orders are completed.</p>}</Panel></div>;
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
  const { state } = useAppState();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Parent orders</h1>
      <div className="space-y-3">
        {state.orders.map((order) => (
          <div
            key={order.id}
            className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-lg">{order.id}</div>
                <div className="text-sm text-[var(--muted)]">
                  {order.date} · {order.merchants} merchants
                </div>
              </div>
              <span className="rounded-full bg-[var(--blush)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--red)]">
                {order.status}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {order.subOrders?.map((sub) => (
                <div
                  key={sub.merchantId}
                  className="rounded-xl bg-[var(--soft)] p-3 text-sm"
                >
                  <div className="font-bold text-[var(--ink)]">
                    {sub.merchantName}
                  </div>
                  <div className="mt-1 text-[var(--muted)]">{sub.status}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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
  const { state } = useAppState();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Manual sourcing</h1>
      <div className="space-y-3">
        {state.sourcing.map((item) => (
          <div
            key={item.id}
            className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold">{item.item}</div>
                <div className="text-sm text-[var(--muted)]">
                  Order {item.orderId}
                </div>
              </div>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                {item.status}
              </span>
            </div>
            <div className="mt-3 text-sm text-[var(--muted)]">
              {item.reason}
            </div>
            <button
              type="button"
              className="mt-3 rounded-lg bg-[var(--red)] px-3 py-1.5 text-xs font-bold text-white"
            >
              Assign sourcing
            </button>
          </div>
        ))}
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
