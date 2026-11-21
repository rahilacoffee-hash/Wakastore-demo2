import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { withSeedExtras, merchantIdOf } from "../data/quoteSeed";
import { DEFAULT_RATE_CARD } from "../services/delivery";
import { buildLogEntries, retryEntry } from "../services/notificationLog";
import * as Sourcing from "../services/sourcing";
import { matchQuotation } from "../services/matching";
import { migrateCategories } from "../utils/migrateCategories";

// Keep the same context object during Vite Fast Refresh. Without this, a
// refreshed consumer can briefly read a newly-created context while App still
// renders the provider created by the previous module instance.
const appStateContextKey = Symbol.for("wakastore.app-state-context");
const AppState = globalThis[appStateContextKey] ?? createContext(null);
globalThis[appStateContextKey] = AppState;
const KEY = "waka-demo-v2";
// WakaStore COMMISSION: 5% of materials, deducted from the merchant. Never added to the customer's total.
const DEFAULT_FEE_RATE = 0.05;

const demoProducts = [
  {
    id: "p-101",
    name: "Dangote Cement 50kg",
    merchant: "BuildRight Supplies",
    merchantId: "m-101",
    price: 10800,
    category: "Cement Merchant",
    image:
      "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=700&q=80",
    stock: 48,
    unit: "bag",
    available: true,
  },
  {
    id: "p-102",
    name: "2.5mm Single Core Cable",
    merchant: "PowerHouse Electrical",
    merchantId: "m-102",
    price: 47500,
    category: "Electrical Materials Merchant",
    image:
      "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=700&q=80",
    stock: 65,
    unit: "roll",
    available: true,
  },
  {
    id: "p-103",
    name: "PVC Pressure Pipe 4in",
    merchant: "Prime Plumbing Hub",
    merchantId: "m-103",
    price: 7200,
    category: "Plumbing Materials Merchant",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=700&q=80",
    stock: 18,
    unit: "piece",
    available: true,
  },
  {
    id: "p-104",
    name: "60×60 Ivory Ceramic Tile",
    merchant: "Tile District",
    merchantId: "m-104",
    price: 14500,
    category: "Tiles Merchant",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80",
    stock: 120,
    unit: "box",
    available: true,
  },
  {
    id: "p-105",
    name: "Longspan Roofing Sheet",
    merchant: "RoofLine Nigeria",
    merchantId: "m-105",
    price: 18900,
    category: "Roofing Materials & Accessories Merchant",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=700&q=80",
    stock: 36,
    unit: "sheet",
    available: true,
  },
  {
    id: "p-106",
    name: "Premium Emulsion Paint 20L",
    merchant: "ColourCraft Store",
    merchantId: "m-106",
    price: 31500,
    category: "Paint Merchant",
    image:
      "https://images.unsplash.com/photo-1562259949-a4c93b5d90eb?auto=format&fit=crop&w=700&q=80",
    stock: 22,
    unit: "bucket",
    available: true,
  },
  {
    id: "p-107",
    name: "Galvanized Steel Rod 12mm",
    merchant: "BuildRight Supplies",
    merchantId: "m-101",
    price: 15400,
    category: "Iron Rods & Reinforcement Materials Merchant",
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=700&q=80",
    stock: 74,
    unit: "length",
    available: true,
  },
  {
    id: "p-108",
    name: "Royal White Granite Tile",
    merchant: "Tile District",
    merchantId: "m-104",
    price: 21000,
    category: "Marble & Granite Merchant",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=700&q=80",
    stock: 44,
    unit: "box",
    available: true,
  },
];

const defaultOrders = [
  {
    id: "WK-20481",
    date: "12 Oct 2026",
    total: 124500,
    merchants: 2,
    status: "In transit",
    items: [
      {
        name: "Dangote Cement 50kg",
        quantity: 3,
        price: 10800,
        merchant: "BuildRight Supplies",
      },
      {
        name: "Premium Emulsion Paint 20L",
        quantity: 2,
        price: 31500,
        merchant: "ColourCraft Store",
      },
    ],
    subOrders: [
      {
        merchantId: "m-101",
        merchantName: "BuildRight Supplies",
        status: "Shipped",
        items: [{ name: "Dangote Cement 50kg", quantity: 3, price: 10800 }],
      },
      {
        merchantId: "m-106",
        merchantName: "ColourCraft Store",
        status: "Processing",
        items: [
          { name: "Premium Emulsion Paint 20L", quantity: 2, price: 31500 },
        ],
      },
    ],
  },
  {
    id: "WK-20399",
    date: "03 Oct 2026",
    total: 68200,
    merchants: 1,
    status: "Delivered",
    items: [
      {
        name: "2.5mm Single Core Cable",
        quantity: 1,
        price: 47500,
        merchant: "PowerHouse Electrical",
      },
    ],
    subOrders: [
      {
        merchantId: "m-102",
        merchantName: "PowerHouse Electrical",
        status: "Delivered",
        items: [{ name: "2.5mm Single Core Cable", quantity: 1, price: 47500 }],
      },
    ],
  },
  {
    id: "WK-20274",
    date: "26 Sep 2026",
    total: 319000,
    merchants: 3,
    status: "Processing",
    items: [
      {
        name: "Longspan Roofing Sheet",
        quantity: 10,
        price: 18900,
        merchant: "RoofLine Nigeria",
      },
      {
        name: "60×60 Ivory Ceramic Tile",
        quantity: 4,
        price: 14500,
        merchant: "Tile District",
      },
    ],
    subOrders: [
      {
        merchantId: "m-105",
        merchantName: "RoofLine Nigeria",
        status: "Processing",
        items: [{ name: "Longspan Roofing Sheet", quantity: 10, price: 18900 }],
      },
      {
        merchantId: "m-104",
        merchantName: "Tile District",
        status: "Awaiting dispatch",
        items: [
          { name: "60×60 Ivory Ceramic Tile", quantity: 4, price: 14500 },
        ],
      },
    ],
  },
];

const defaultQuotations = [
  {
    id: "QT-1042",
    name: "3-bedroom renovation materials",
    date: "08 Oct 2026",
    status: "Matching merchants",
    items: [
      { name: "Dangote Cement 50kg", quantity: 10, unit: "bags" },
      { name: "Premium Emulsion Paint 20L", quantity: 4, unit: "buckets" },
      { name: "60×60 Ivory Ceramic Tile", quantity: 8, unit: "boxes" },
    ],
    matchedMerchants: ["BuildRight Supplies", "Tile District"],
  },
  {
    id: "QT-1018",
    name: "Electrical finishing list",
    date: "21 Sep 2026",
    status: "Quotes ready",
    items: [
      { name: "2.5mm Single Core Cable", quantity: 3, unit: "rolls" },
      { name: "PVC Pressure Pipe 4in", quantity: 2, unit: "pieces" },
    ],
    matchedMerchants: ["PowerHouse Electrical", "Prime Plumbing Hub"],
  },
];

const demoCustomers = [
  {
    id: "c-101",
    name: "Ada Okafor",
    email: "customer1@waka.test",
    password: "waka123",
    phone: "+234 810 200 5001",
    accountStatus: "active",
  },
  {
    id: "c-102",
    name: "Kelechi Martins",
    email: "customer2@waka.test",
    password: "waka123",
    phone: "+234 810 200 5002",
    accountStatus: "active",
  },
];

const demoMerchants = [
  {
    id: "m-101",
    name: "BuildRight Supplies",
    status: "approved",
    contact: "+234 801 000 0001",
    address: "Lekki Phase 1, Lagos",
    description: "Bulk cement, reinforcement and structural materials.",
    categories: ["Cement Merchant", "Iron Rods & Reinforcement Materials Merchant"],
    approvedAt: "2026-10-02",
    rejectionReason: "",
  },
  {
    id: "m-102",
    name: "PowerHouse Electrical",
    status: "approved",
    contact: "+234 801 000 0002",
    address: "Abule Egba, Lagos",
    description: "Electrical systems, lighting and cable supply.",
    categories: ["Electrical Materials Merchant"],
    approvedAt: "2026-10-06",
    rejectionReason: "",
  },
  {
    id: "m-103",
    name: "Prime Plumbing Hub",
    status: "pending",
    contact: "+234 801 000 0003",
    address: "Gbagada, Lagos",
    description: "Plumbing and sanitary fittings for residential projects.",
    categories: ["Plumbing Materials Merchant"],
    approvedAt: "",
    rejectionReason: "",
  },
  {
    id: "m-104",
    name: "Tile District",
    status: "rejected",
    contact: "+234 801 000 0004",
    address: "Ikeja, Lagos",
    description: "Tiles and flooring products with fit-out support.",
    categories: ["Tiles Merchant"],
    approvedAt: "",
    rejectionReason: "Business documents were incomplete during review.",
  },
  {
    id: "m-105",
    name: "RoofLine Nigeria",
    status: "suspended",
    contact: "+234 801 000 0005",
    address: "Surulere, Lagos",
    description: "Roofing, waterproofing and sheet metal solutions.",
    categories: ["Roofing Materials & Accessories Merchant"],
    approvedAt: "2026-09-17",
    rejectionReason: "",
  },
];

const defaultWallet = {
  balance: 245000,
  history: [
    {
      id: "tx-1",
      label: "Wallet top-up",
      amount: 100000,
      type: "credit",
      date: "10 Oct 2026",
    },
    {
      id: "tx-2",
      label: "Payment for WK-20399",
      amount: 68200,
      type: "debit",
      date: "03 Oct 2026",
    },
    {
      id: "tx-3",
      label: "Promotional credit",
      amount: 25000,
      type: "credit",
      date: "22 Sep 2026",
    },
  ],
};

const defaultRefunds = [
  {
    id: "RF-301",
    orderId: "WK-20481",
    customer: "Ada Okafor",
    status: "In review",
    reason: "Missing item",
    items: [
      { name: "Dangote Cement 50kg", quantity: 1, missing: 1, approved: false },
    ],
    details: "Two bags were missing from the delivery.",
  },
];

const defaultAuditLogs = [
  {
    id: "AUD-01",
    actor: "Super Admin",
    action: "Approved merchant",
    date: "2026-10-11 10:20",
    entity: "BuildRight Supplies",
    details: "Business profile was validated.",
  },
  {
    id: "AUD-02",
    actor: "Admin",
    action: "Suspended merchant",
    date: "2026-10-08 09:13",
    entity: "RoofLine Nigeria",
    details: "Customer complaints exceeded threshold.",
  },
  {
    id: "AUD-03",
    actor: "Merchant",
    action: "Stock update",
    date: "2026-10-03 17:46",
    entity: "PowerHouse Electrical",
    details: "Inventory adjusted to 65 units.",
  },
];

export const defaultState = {
  cart: [],
  orders: defaultOrders,
  products: demoProducts,
  wishlist: [],
  wallet: defaultWallet,
  quotations: defaultQuotations,
  merchantQuotes: [],
  messages: [],
  refunds: defaultRefunds,
  merchants: demoMerchants,
  customers: demoCustomers,
  notifications: [
    {
      id: "n-1",
      title: "Merchant approved",
      detail: "BuildRight Supplies is active on the marketplace.",
      seen: false,
    },
    {
      id: "n-2",
      title: "Refund request",
      detail: "Ada Okafor submitted a missing item report.",
      seen: false,
    },
    {
      id: "n-3",
      title: "Settlement ready",
      detail: "Your payout for last month is ready for review.",
      seen: true,
    },
  ],
  auditLogs: defaultAuditLogs,
  sourcing: [
    {
      id: "SRC-01",
      orderId: "WK-20274",
      item: "PVC Pressure Pipe 4in",
      reason: "No eligible supplier available",
      status: "Awaiting manual sourcing",
    },
  ],
  addresses: [],
  // Platform configuration (editable by Super Admin). Commission is deducted from the merchant, never added to the customer.
  settings: { feeRate: 0.05, threshold: 60, multiMerchant: false, invitationHours: 24, quoteValidHours: 48, deliveryRates: DEFAULT_RATE_CARD },
  withdrawals: [],
  paymentAttempts: [],
  notificationLog: [],
  adminUsers: [],
  session: null,
  toast: null,
};

const ARRAY_FIELDS = [
  "cart", "orders", "products", "wishlist", "quotations", "refunds",
  "merchants", "customers", "notifications", "auditLogs", "sourcing",
  "merchantUsers", "addresses", "merchantQuotes", "messages",
  "withdrawals", "paymentAttempts", "notificationLog", "adminUsers",
];

// Older demo sessions may contain partially-shaped values (for example,
// notifications saved as an object by an earlier build). Normalize them before
// any component or state updater attempts array operations.
const normalizeState = (candidate) => {
  const source = candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ? candidate
    : {};
  const merged = { ...defaultState, ...source };
  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(merged[field])) merged[field] = Array.isArray(defaultState[field]) ? [...defaultState[field]] : [];
  }
  const wallet = merged.wallet && typeof merged.wallet === "object" && !Array.isArray(merged.wallet)
    ? merged.wallet
    : defaultState.wallet;
  merged.wallet = {
    ...defaultState.wallet,
    ...wallet,
    history: Array.isArray(wallet.history) ? wallet.history : [...defaultState.wallet.history],
  };
  const savedSettings = merged.settings && typeof merged.settings === "object" && !Array.isArray(merged.settings) ? merged.settings : {};
  merged.settings = { ...defaultState.settings, ...savedSettings, deliveryRates: { ...DEFAULT_RATE_CARD, ...(savedSettings.deliveryRates || {}) } };
  // Orders saved before item-level tracking get per-item assignment fields (idempotent).
  merged.orders = merged.orders.map(Sourcing.upgradeOrder);
  merged.session = merged.session && typeof merged.session === "object" ? merged.session : null;
  merged.toast = merged.toast && typeof merged.toast === "object" ? merged.toast : null;
  return merged;
};

const hydrateState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return migrateCategories(withSeedExtras(normalizeState(saved)));
  } catch {
    return migrateCategories(withSeedExtras(normalizeState(defaultState)));
  }
};

export function AppStateProvider({ children }) {
  const [state, setState] = useState(hydrateState);
  const feeRate = Number(state.settings?.feeRate ?? DEFAULT_FEE_RATE);
  const matchThreshold = Number(state.settings?.threshold ?? 60);
  Sourcing.setCommissionPercent(feeRate * 100); // keep item-level settlement splits on the configured rate

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updater) => setState((prev) => normalizeState(updater(normalizeState(prev))));

  const addToCart = (product) =>
    updateState((prev) => {
      const existing = prev.cart.find((item) => item.id === product.id);
      return {
        ...prev,
        cart: existing
          ? prev.cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prev.cart, { ...product, quantity: 1 }],
        toast: { id: Date.now(), message: `${product.name} added to cart.`, type: "success" },
      };
    });

  const updateQuantity = (productId, quantity) =>
    updateState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    }));

  const removeFromCart = (productId) =>
    updateState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.id !== productId),
    }));

  const toggleSaved = (product) =>
    updateState((prev) => ({
      ...prev,
      wishlist: prev.wishlist.some((entry) => entry.id === product.id)
        ? prev.wishlist.filter((entry) => entry.id !== product.id)
        : [...prev.wishlist, { ...product }],
    }));

  const markNotificationSeen = (id) =>
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, seen: true } : n)),
    }));

  const markAllNotificationsSeen = (predicate = () => true) =>
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (predicate(n) ? { ...n, seen: true } : n)),
    }));

  const saveAddress = (address) =>
    updateState((prev) => ({
      ...prev,
      addresses: [{ id: `addr-${Date.now()}`, ...address }, ...prev.addresses],
    }));

  const removeAddress = (id) =>
    updateState((prev) => ({ ...prev, addresses: prev.addresses.filter((a) => a.id !== id) }));

  const createOrder = (method = "wallet", deliveryAddress = {}, deliveryFee = 3500, extra = {}) => {
    let ref = `WK-${Date.now().toString().slice(-8)}`;
    let created = false;
    updateState((prev) => {
      if (!prev.cart.length) return prev;
      const items = prev.cart.map((item) => {
        const sourcingLine = item.kind === "sourcing";
        const qty = Math.max(1, Number(item.quantity) || 1);
        return {
          ...item,
          productRef: sourcingLine ? null : item.id,
          quantity: qty,
          unitPrice: sourcingLine ? null : Number(item.price) || 0,
          lineTotal: sourcingLine ? null : (Number(item.price) || 0) * qty,
        };
      });
      // Only priced lines are charged now. Lines that need sourcing stay in the order, unpriced,
      // until the merchant confirms a price and the customer approves it.
      const subtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
      const fee = Math.round(subtotal * feeRate);
      const shipping = Math.max(0, Number(deliveryFee) || 0);
      const total = subtotal + shipping;
      if (method === "wallet" && Number(prev.wallet?.balance || 0) < total) return prev;
      const built = Sourcing.buildItems(ref, items.map((item) => ({
        lineId: item.lineId, name: item.name, specification: item.specs || "", quantity: item.quantity, unit: item.unit,
        productRef: item.productRef, unitPrice: item.unitPrice, category: item.category, merchantId: item.merchantId,
        unavailable: item.kind === "sourcing",
      })));
      const orderItems = items.map((item, i) => ({ ...item, ...built[i], price: item.unitPrice }));
      const order = Sourcing.rebuildSubOrders({
        id: ref,
        receiptId: `WKR-${ref.replace('WK-', '')}`,
        date: new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
        subtotal, wakastoreFee: fee, deliveryFee: shipping, total,
        status: "Paid", paymentMethod: method, deliveryMethod: extra.deliveryMethod || "merchant_delivery", customerEmail: prev.session?.email || "",
        deliveryAddress: { ...deliveryAddress }, items: orderItems, subOrders: [], ledger: [], payments: [],
      }, prev.merchants);
      const unavailableCount = built.filter((b) => b.availability === "NOT_IN_STOCK").length;
      created = true;
      return {
        ...prev,
        cart: [],
        orders: [order, ...prev.orders],
        quotations: prev.pendingQuotationId
          ? prev.quotations.map((q) => q.id === prev.pendingQuotationId
              ? { ...q, status: "Converted to order", orderId: ref }
              : q)
          : prev.quotations,
        pendingQuotationId: null,
        products: prev.products.map((p) => {
          const c = items.find((x) => x.id === p.id);
          return c ? { ...p, stock: Math.max(0, p.stock - c.quantity) } : p;
        }),
        wallet: {
          ...prev.wallet,
          balance: method === "wallet" ? prev.wallet.balance - total : prev.wallet.balance,
          history: method === "wallet" ? [{
            id: `tx-${Date.now()}`, label: `Payment for ${ref}`, amount: total,
            type: "debit", date: new Date().toLocaleDateString("en-NG"),
          }, ...prev.wallet.history] : prev.wallet.history,
        },
        notifications: [
          { id: `n-${Date.now()}`, title: "Order placed", detail: `Order ${ref} has been created.${unavailableCount ? ` ${unavailableCount} item(s) are not in stock. The merchant will confirm whether they can source them and send you the price to approve.` : ""}`, seen: false },
          ...built.filter((b) => b.availability === "NOT_IN_STOCK" && b.currentMerchantId).map((b, i) => ({ id: `n-${Date.now()}-s${i}`, title: "Sourcing requested", detail: `${ref}: please confirm whether you can source ${b.quantity} ${b.unit || ""} ${b.name}.`.replace(/\s+/g, " "), seen: false, recipientMerchantId: b.currentMerchantId })),
          ...prev.notifications,
        ],
        sourcing: [
          ...built.filter((b) => b.sourcingStatus === Sourcing.SOURCING.AWAITING_MERCHANT).map((b) => ({ id: `SRC-${Date.now()}-${b.itemId}`, orderId: ref, itemId: b.itemId, item: b.name, reason: "No eligible merchant was assigned when the order was placed.", status: "Awaiting manual sourcing" })),
          ...(prev.sourcing || []),
        ],
      };
    });
    return created ? ref : null;
  };

  const submitQuotation = (items) =>
    updateState((prev) => ({
      ...prev,
      quotations: [
        {
          id: `QT-${1000 + prev.quotations.length + 1}`,
          name: "New customer quote",
          date: "Today",
          status: "Matching merchants",
          items,
          matchedMerchants: [],
        },
        ...prev.quotations,
      ],
    }));

  const matchQuotationMerchants = (quotationId) =>
    updateState((prev) => ({
      ...prev,
      quotations: prev.quotations.map((quotation) => {
        if (quotation.id !== quotationId) return quotation;
        const eligible = prev.merchants
          .filter((merchant) => merchant.status === "approved")
          .map((merchant) => {
            const lines = quotation.items.filter((line) =>
              prev.products.some(
                (product) =>
                  product.merchantId === merchant.id &&
                  product.name
                    .toLowerCase()
                    .includes(line.name.trim().toLowerCase().slice(0, 4)),
              ),
            ).length;
            const ratio = quotation.items.length
              ? lines / quotation.items.length
              : 0;
            return {
              merchant: merchant.name,
              count: lines,
              ratio,
              eligible: ratio >= 0.6,
            };
          })
          .filter((entry) => entry.eligible);

        return {
          ...quotation,
          matchedMerchants: eligible.map((entry) => entry.merchant),
          status: eligible.length ? "Matched" : "Needs sourcing",
        };
      }),
    }));

  const signIn = (role, email, name) =>
    updateState((prev) => ({ ...prev, session: { role, email, name } }));
  const signOut = () => updateState((prev) => ({ ...prev, session: null }));
  const notify = (message, type = "success") =>
    updateState((prev) => ({
      ...prev,
      toast: { id: Date.now(), message, type },
    }));
  const ensureToastCleared = () =>
    updateState((prev) => ({ ...prev, toast: null }));

  const approveMerchant = (merchantId) =>
    updateState((prev) => {
      const merchant = prev.merchants.find((item) => item.id === merchantId);
      if (!merchant) return prev;
      const reviewedAt = new Date().toISOString();
      return {
        ...prev,
        merchants: prev.merchants.map((item) =>
          item.id === merchantId
            ? { ...item, status: "approved", approvedAt: reviewedAt, approvedBy: prev.session?.name || "Admin", rejectionReason: "", suspensionReason: "" }
            : item,
        ),
        notifications: [{ id: `n-${Date.now()}`, title: "Application approved", detail: `${merchant.name} is now approved and can manage products.`, recipientMerchantId: merchantId, seen: false }, ...prev.notifications],
        auditLogs: [{ id: `AUD-${Date.now()}`, actor: prev.session?.name || "Admin", action: "Approved merchant", date: new Date().toLocaleString("en-GB"), entity: merchant.name, details: "Merchant approved by admin." }, ...prev.auditLogs],
      };
    });

  // Demo only: called by MerchantGate when a self-registered merchant's countdown ends.
  const autoApproveMerchant = (merchantId) =>
    updateState((prev) => {
      const merchant = prev.merchants.find((item) => item.id === merchantId);
      if (!merchant || merchant.status !== "pending") return prev;
      const reviewedAt = new Date().toISOString();
      return {
        ...prev,
        merchants: prev.merchants.map((item) =>
          item.id === merchantId
            ? { ...item, status: "approved", approvedAt: reviewedAt, approvedBy: "Demo auto-approval", rejectionReason: "", suspensionReason: "" }
            : item,
        ),
        notifications: [{ id: `n-${Date.now()}`, title: "Application approved", detail: `${merchant.name} was approved automatically (demo mode).`, recipientMerchantId: merchantId, seen: false }, ...prev.notifications],
        auditLogs: [{ id: `AUD-${Date.now()}`, actor: "Demo auto-approval", action: "Approved merchant", date: new Date().toLocaleString("en-GB"), entity: merchant.name, details: "Auto-approved 20 seconds after applying (demo mode)." }, ...prev.auditLogs],
      };
    });

  const rejectMerchant = (merchantId, reason) => {
    if (!reason?.trim()) return false;
    updateState((prev) => {
      const merchant = prev.merchants.find((item) => item.id === merchantId);
      if (!merchant) return prev;
      return {
      ...prev,
      merchants: prev.merchants.map((merchant) =>
        merchant.id === merchantId
          ? {
              ...merchant,
              status: "rejected",
              rejectionReason: reason.trim(),
              rejectedAt: new Date().toISOString(),
            }
          : merchant,
      ),
      notifications: [{ id: `n-${Date.now()}`, title: "Application rejected", detail: `${merchant.name}: ${reason.trim()}`, recipientMerchantId: merchantId, seen: false }, ...prev.notifications],
      auditLogs: [{ id: `AUD-${Date.now()}`, actor: prev.session?.name || "Admin", action: "Rejected merchant", date: new Date().toLocaleString("en-GB"), entity: merchant.name, details: reason.trim() }, ...prev.auditLogs],
    };
    });
    return true;
  };

  const suspendMerchant = (merchantId, reason) => {
    if (!reason?.trim()) return false;
    updateState((prev) => {
      const merchant = prev.merchants.find((item) => item.id === merchantId);
      if (!merchant) return prev;
      return {
      ...prev,
      merchants: prev.merchants.map((merchant) =>
        merchant.id === merchantId
          ? { ...merchant, status: "suspended", suspensionReason: reason.trim(), suspendedAt: new Date().toISOString() }
          : merchant,
      ),
      notifications: [{ id: `n-${Date.now()}`, title: "Merchant account suspended", detail: `${merchant.name}: ${reason.trim()}`, recipientMerchantId: merchantId, seen: false }, ...prev.notifications],
      auditLogs: [{ id: `AUD-${Date.now()}`, actor: prev.session?.name || "Admin", action: "Suspended merchant", date: new Date().toLocaleString("en-GB"), entity: merchant.name, details: reason.trim() }, ...prev.auditLogs],
    };
    });
    return true;
  };

  const reactivateMerchant = (merchantId) =>
    updateState((prev) => {
      const merchant = prev.merchants.find((item) => item.id === merchantId);
      if (!merchant) return prev;
      return {
        ...prev,
        merchants: prev.merchants.map((item) => item.id === merchantId ? { ...item, status: "approved", suspensionReason: "", reactivatedAt: new Date().toISOString() } : item),
        notifications: [{ id: `n-${Date.now()}`, title: "Merchant account reactivated", detail: `${merchant.name} can manage products and accept orders again.`, recipientMerchantId: merchantId, seen: false }, ...prev.notifications],
        auditLogs: [{ id: `AUD-${Date.now()}`, actor: prev.session?.name || "Admin", action: "Reactivated merchant", date: new Date().toLocaleString("en-GB"), entity: merchant.name, details: "Account restored." }, ...prev.auditLogs],
      };
    });

  const removeMerchant = (merchantId, reason = "Removed by platform administrator") =>
    updateState((prev) => {
      const merchant = prev.merchants.find((m) => m.id === merchantId);
      if (!merchant) return prev;
      return {
        ...prev,
        merchants: prev.merchants.filter((m) => m.id !== merchantId),
        products: prev.products.map((p) => p.merchantId === merchantId ? { ...p, available: false, moderationStatus: "merchant-removed" } : p),
        merchantUsers: (prev.merchantUsers || []).filter((u) => u.merchantId !== merchantId),
        auditLogs: [{ id: `AUD-${Date.now()}`, actor: "Admin", action: "Removed merchant", date: new Date().toLocaleString("en-NG"), entity: merchant.name, details: reason }, ...(prev.auditLogs || [])],
        notifications: [{ id: `n-${Date.now()}`, title: "Merchant account removed", detail: `${merchant.name}: ${reason}`, seen: false }, ...(prev.notifications || [])],
      };
    });

  const addProduct = (product) =>
    updateState((prev) => ({ ...prev, products: [product, ...prev.products] }));
  const updateProduct = (productId, changes) =>
    updateState((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId ? { ...product, ...changes } : product,
      ),
    }));
  const deleteProduct = (productId, reason = "Removed from catalogue") =>
    updateState((prev) => ({
      ...prev,
      products: prev.products.map((product) => product.id === productId ? { ...product, available: false, archived: true, archivedReason: reason } : product),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          actor: "Admin",
          action: "Removed product",
          date: new Date().toLocaleString("en-GB"),
          entity: productId,
          details: reason,
        },
        ...prev.auditLogs,
      ],
    }));

  const updateSubOrderStatus = (orderId, merchantId, status) =>
    updateState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) return prev;
      const target = (order.subOrders || []).find((s) => s.merchantId === merchantId && !["Rejected", "Reassigned"].includes(s.status));
      if (!target) return prev;
      if (status !== "Rejected") return {
        ...prev,
        orders: prev.orders.map((o) => o.id !== orderId ? o : ({
          ...o,
          status: status === "Accepted" ? "Processing" : o.status,
          subOrders: o.subOrders.map((sub) => sub === target ? { ...sub, status, updatedAt: new Date().toISOString() } : sub),
        })),
      };

      // Rejecting a whole sub-order is handled ITEM BY ITEM: each of this merchant's open items is
      // declined and offered to another eligible merchant individually (no whole-order rerouting).
      const actor = { role: "merchant", merchantId };
      let working = order;
      let moved = 0;
      let stuck = 0;
      order.items.filter((i) => i.currentMerchantId === merchantId && i.fulfilment === "PENDING").forEach((i) => {
        const r = Sourcing.declineSourcing(working, i.itemId, actor, { confirmed: true, allowAvailable: true, reason: "Merchant rejected the order" }, { merchants: prev.merchants, products: prev.products, multiMerchant: prev.settings?.multiMerchant ?? false });
        if (!r.ok) return;
        working = r.order;
        if (r.rerouted) moved += 1; else stuck += 1;
      });
      const unresolved = working.items.filter((i) => i.sourcingStatus === Sourcing.SOURCING.UNRESOLVED && i.history.some((h) => h.type === "NO_ELIGIBLE_MERCHANT"));
      const finalOrder = { ...working, subOrders: working.subOrders.map((sub) => (sub.merchantId === merchantId ? { ...sub, status: "Rejected" } : sub)) };
      const notifications = [
        { id: `n-${Date.now()}`, title: moved ? "Items reassigned" : "Items need sourcing", detail: `${orderId}: ${moved} item(s) moved to other merchants individually; ${stuck} item(s) have no eligible merchant yet.`, seen: false },
        ...(prev.notifications || []),
      ];
      const sourcing = [
        ...unresolved.map((i) => ({ id: `SRC-${Date.now()}-${i.itemId}`, orderId, itemId: i.itemId, item: i.name, reason: "No other eligible merchant after rejection.", status: "Awaiting manual sourcing" })),
        ...(prev.sourcing || []),
      ];
      const rebuilt = Sourcing.rebuildSubOrders(finalOrder, prev.merchants);
      const kept = rebuilt.subOrders;
      const t = Sourcing.orderTotals(rebuilt, feeRate);
      return {
        ...prev, notifications, sourcing,
        orders: prev.orders.map((o) => o.id !== orderId ? o : ({ ...rebuilt, subOrders: kept, subtotal: t.confirmedSubtotal, wakastoreFee: t.fee, total: t.total, status: unresolved.length ? "Partially sourcing" : "Processing" })),
      };
    });

  const processRefund = (refundId, decision, note) =>
    updateState((prev) => ({
      ...prev,
      refunds: prev.refunds.map((refund) =>
        refund.id === refundId
          ? {
              ...refund,
              status: decision === "approved" ? "Approved" : "Rejected",
              note,
            }
          : refund,
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          actor: "Admin",
          action: "Refund decision",
          date: new Date().toLocaleString("en-GB"),
          entity: refundId,
          details: note,
        },
        ...prev.auditLogs,
      ],
    }));

  // ---- Auth + quotation flow (added) ----
  const emailKey = (e = "") => String(e).trim().toLowerCase();
  const credError = (e, password) =>
    !/^\S+@\S+\.\S+$/.test(e)
      ? "Enter a valid email address."
      : (password || "").length < 6
        ? "Password must be at least 6 characters."
        : state.customers.some((c) => emailKey(c.email) === e) ||
            (state.merchantUsers || []).some((u) => emailKey(u.email) === e)
          ? "That email is already registered. Try signing in."
          : null;
  const todayLabel = () =>
    new Date().toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const registerCustomer = ({ name, email, phone, password }) => {
    const e = emailKey(email);
    if (!name?.trim()) return { ok: false, error: "Enter your name." };
    const error = credError(e, password);
    if (error) return { ok: false, error };
    updateState((prev) => ({
      ...prev,
      customers: [
        ...prev.customers,
        {
          id: `c-${Date.now()}`,
          name: name.trim(),
          email: e,
          password,
          phone: (phone || "").trim(),
          accountStatus: "active",
        },
      ],
      session: { role: "customer", email: e, name: name.trim() },
    }));
    return { ok: true };
  };
  const registerMerchant = (f) => {
    const e = emailKey(f.email);
    if (!f.businessName?.trim())
      return { ok: false, error: "Enter your business name." };
    if (!f.ownerName?.trim()) return { ok: false, error: "Enter your name." };
    if (!f.phone?.trim()) return { ok: false, error: "Enter a phone number." };
    if (!f.address?.trim())
      return { ok: false, error: "Enter your business address." };
    if (!f.categories?.length)
      return { ok: false, error: "Pick at least one category." };
    const error = credError(e, f.password);
    if (error) return { ok: false, error };
    const id = `m-${Date.now()}`;
    updateState((prev) => ({
      ...prev,
      merchants: [
        ...prev.merchants,
        {
          id,
          name: f.businessName.trim(),
          status: "pending",
          contact: f.phone.trim(),
          ownerName: f.ownerName.trim(),
          email: e,
          address: f.address.trim(),
          description: (f.description || "").trim(),
          categories: f.categories,
          approvedAt: "",
          rejectionReason: "",
          submittedAt: new Date().toISOString(),
        },
      ],
      merchantUsers: [
        ...(prev.merchantUsers || []),
        {
          id: `mu-${Date.now()}`,
          merchantId: id,
          name: f.ownerName.trim(),
          email: e,
          password: f.password,
        },
      ],
      notifications: [
        {
          id: `n-${Date.now()}`,
          title: "New merchant application",
          detail: `${f.businessName.trim()} applied to sell.`,
          seen: false,
        },
        ...prev.notifications,
      ],
      session: {
        role: "merchant",
        email: e,
        name: f.businessName.trim(),
        merchantId: id,
      },
    }));
    return { ok: true };
  };
  const signInWithPassword = (role, email, password) => {
    const e = emailKey(email);
    if (role === "customer") {
      const c = state.customers.find(
        (x) => emailKey(x.email) === e && x.password === password,
      );
      if (!c) return null;
      updateState((prev) => ({
        ...prev,
        session: { role: "customer", email: e, name: c.name },
      }));
      return c;
    }
    const u = (state.merchantUsers || []).find(
      (x) => emailKey(x.email) === e && x.password === password,
    );
    if (!u) return null;
    const m = state.merchants.find((x) => x.id === u.merchantId);
    updateState((prev) => ({
      ...prev,
      session: {
        role: "merchant",
        email: e,
        name: m?.name || u.name,
        merchantId: u.merchantId,
      },
    }));
    return u;
  };
  const resubmitMerchant = (merchantId) =>
    updateState((prev) => ({
      ...prev,
      merchants: prev.merchants.map((m) =>
        m.id === merchantId
          ? { ...m, status: "pending", rejectionReason: "" }
          : m,
      ),
    }));

  const createQuotationFull = ({ name, items, deliveryLocation = "", neededBy = "", source = "manual", smartfixerJobId = null }) => {
    const id = `QT-${1000 + state.quotations.length + 1}`;
    const createdAt = new Date();
    const lines = items.map((l, i) => ({
      ...l,
      id: l.id || `line-${i + 1}`,
      quantity: Number(l.quantity),
    }));
    const m = matchQuotation(lines, state.merchants, state.products, matchThreshold);
    const q = {
      id,
      name: name?.trim() || "Materials list",
      date: todayLabel(),
      createdAt: createdAt.toISOString(),
      merchantResponseDeadlineAt: new Date(createdAt.getTime() + Number(state.settings?.invitationHours ?? 24) * 60 * 60 * 1000).toISOString(),
      status: m.quotationNeedsSourcing ? "Needs sourcing" : "Awaiting merchant quotations",
      deliveryLocation: String(deliveryLocation).trim(),
      neededBy,
      source,
      ...(smartfixerJobId ? { smartfixerJobId } : {}),
      items: lines,
      matchedMerchants: m.eligible.map((r) => r.merchant.name),
      invitedMerchantIds: m.eligible.map((r) => r.merchant.id),
      matchingThreshold: 60,
    };
    updateState((prev) => ({
      ...prev,
      quotations: [q, ...prev.quotations],
      notifications: [
        {
          id: `n-${Date.now()}`,
          title: "Quotation submitted",
          detail: `${id}: ${m.eligible.length} eligible merchant(s) invited. Merchants have 24 hours to respond.`,
          seen: false,
        },
        ...prev.notifications,
      ],
      sourcing: m.quotationNeedsSourcing
        ? [
            {
              id: `SRC-${Date.now()}`,
              orderId: "—",
              item: lines.map((l) => l.name).join(", "),
              reason: `No merchant reached 60% on ${id}`,
              status: "Awaiting manual sourcing",
            },
            ...prev.sourcing,
          ]
        : prev.sourcing,
    }));
    return id;
  };
  const selectMerchantQuote = (quotationId, merchantQuoteId) => {
    const quotation = state.quotations.find((q) => q.id === quotationId);
    const offer = state.merchantQuotes.find((x) => x.id === merchantQuoteId && x.quotationId === quotationId);
    if (!quotation || !offer || Date.parse(offer.validUntil || 0) <= Date.now()) return false;
    if ((offer.items || []).length !== quotation.items.length || quotation.items.some((line) => {
      const item = offer.items.find((entry) => entry.lineId === line.id);
      return !item || !["CAN_SUPPLY", "CAN_SOURCE"].includes(item.supplyStatus) || Number(item.quantity) !== Number(line.quantity) || !(Number(item.unitPrice) > 0);
    })) return false;
    updateState((prev) => ({
      ...prev,
      quotations: prev.quotations.map((q) => q.id === quotationId ? { ...q, selectedMerchantQuoteId: merchantQuoteId, merchantConfirmedAt: null, customerApprovedAt: null, status: "Offer selected" } : q),
    }));
    return true;
  };
  const confirmMerchantQuotation = (quotationId, merchantId) => updateState((prev) => ({
    ...prev,
    quotations: prev.quotations.map((q) => q.id === quotationId && q.selectedMerchantQuoteId && prev.merchantQuotes.some((offer) => offer.id === q.selectedMerchantQuoteId && offer.merchantId === merchantId && Date.parse(offer.validUntil || 0) > Date.now()) ? { ...q, merchantConfirmedAt: new Date().toISOString(), status: "Awaiting customer approval" } : q),
  }));
  const approveMerchantQuotation = (quotationId, deliveryMethod = "merchant_delivery") => updateState((prev) => ({
    ...prev,
    quotations: prev.quotations.map((q) => {
      const offer = prev.merchantQuotes.find((item) => item.id === q.selectedMerchantQuoteId);
      return q.id === quotationId && q.merchantConfirmedAt && offer && Date.parse(offer.validUntil || 0) > Date.now()
        ? { ...q, selectedDeliveryMethod: deliveryMethod, customerApprovedAt: new Date().toISOString(), status: "Approved for payment" }
        : q;
    }),
  }));

  const submitMerchantQuote = ({ quotationId, merchantId, items, deliveryFee = 0, deliveryEstimate = "", deliveryMethods = ["merchant_delivery"], notes = "" }) => {
    const quotation = state.quotations.find((q) => q.id === quotationId);
    const merchant = state.merchants.find((m) => m.id === merchantId);
    if (!quotation || !merchant) return { ok: false, error: "Quotation request not found." };
    if (quotation.selectedMerchantQuoteId) return { ok: false, error: "The customer has already selected an offer. Contact WakaStore Admin if a change is required." };
    if (Date.parse(quotation.merchantResponseDeadlineAt || 0) <= Date.now()) return { ok: false, error: "The 24-hour merchant response window has expired." };
    const match = matchQuotation(quotation.items, state.merchants, state.products, matchThreshold);
    if (!match.eligible.some((entry) => entry.merchant.id === merchantId)) return { ok: false, error: "Your store does not meet the 60% eligibility threshold." };
    const cleanItems = items.map((item) => ({
      ...item,
      supplyStatus: String(item.supplyStatus || "CANNOT_SOURCE"),
      variation: String(item.variation || "").trim(),
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity),
      sourcingTime: String(item.sourcingTime || "").trim(),
      available: ["CAN_SUPPLY", "CAN_SOURCE"].includes(item.supplyStatus),
    }));
    if (cleanItems.length !== quotation.items.length || quotation.items.some((line) => !cleanItems.some((item) => item.lineId === line.id))) {
      return { ok: false, error: "Respond to every requested material line." };
    }
    if (cleanItems.some((item) => !["CAN_SUPPLY", "CAN_SOURCE", "CANNOT_SOURCE"].includes(item.supplyStatus))) return { ok: false, error: "Choose one valid response for every material line." };
    const cannotSource = cleanItems.filter((item) => item.supplyStatus === "CANNOT_SOURCE");
    if (cannotSource.length) return { ok: false, error: `You marked ${cannotSource.length} item(s) as cannot be sourced. A complete quotation must cover every requested material. Change those lines to Can be supplied or Can be sourced, or do not submit this offer.` };
    const invalid = cleanItems.find((item) => !item.variation || !(item.unitPrice > 0) || !(item.quantity > 0) || (item.supplyStatus === "CAN_SOURCE" && !item.sourcingTime));
    if (invalid) return { ok: false, error: "For every line, enter the exact variation and a valid unit price. For items you will source, also provide an estimated sourcing time." };
    if (cleanItems.some((item) => item.quantity !== Number(quotation.items.find((line) => line.id === item.lineId)?.quantity))) {
      return { ok: false, error: "Every quotation line must cover the full quantity requested. Partial quantities are not accepted." };
    }
    const submittedAt = new Date();
    const validUntil = new Date(submittedAt.getTime() + Number(state.settings?.quoteValidHours ?? 48) * 60 * 60 * 1000).toISOString();
    updateState((prev) => ({
      ...prev,
      merchantQuotes: [
        ...prev.merchantQuotes.filter((q) => !(q.quotationId === quotationId && q.merchantId === merchantId)),
        { id: `MQ-${Date.now()}-${merchantId}`, quotationId, merchantId, merchantName: merchant.name, items: cleanItems, deliveryFee: Number(deliveryFee) || 0, deliveryEstimate: String(deliveryEstimate).trim(), deliveryMethods: deliveryMethods.filter(Boolean), notes: String(notes).trim(), status: "Submitted", submittedAt: submittedAt.toISOString(), validUntil },
      ],
      notifications: [{ id: `n-${Date.now()}`, title: "Merchant quotation submitted", detail: `${merchant.name} submitted a complete offer for ${quotationId}. It is valid for 48 hours.`, seen: false }, ...prev.notifications],
      quotations: prev.quotations.map((q) => q.id === quotationId ? { ...q, status: "Merchant quotations received" } : q),
    }));
    return { ok: true };
  };

  const sendChatMessage = ({ quotationId, merchantId, text: body }) => {
    const message = String(body || "").trim();
    if (!message || !state.session) return false;
    const merchant = state.merchants.find((m) => m.id === merchantId);
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    updateState((prev) => ({
      ...prev,
      messages: [...(prev.messages || []), {
        id, quotationId, merchantId, senderRole: prev.session?.role || "customer",
        senderName: prev.session?.name || "WakaStore user", text: message,
        createdAt: new Date().toISOString(),
      }],
      notifications: [{ id: `n-${Date.now()}`, title: "New quotation message", detail: `${prev.session?.name || "A user"} sent a message${merchant ? ` about ${quotationId}` : ""}.`, seen: false, ...(prev.session?.role === "customer" ? { recipientMerchantId: merchantId } : {}) }, ...prev.notifications],
    }));
    return true;
  };

  const payQuotation = (quotationId) => {
    const quotation = state.quotations.find((q) => q.id === quotationId);
    const offer = state.merchantQuotes.find((x) => x.id === quotation?.selectedMerchantQuoteId);
    if (quotation?.orderId) return quotation.orderId; // duplicate-payment protection: a paid quotation never creates a second order
    if (!quotation || !offer || !quotation.customerApprovedAt || Date.parse(offer.validUntil || 0) <= Date.now()) return null;
    const requestedLines = quotation.items || [];
    const items = requestedLines.map((line) => {
      const quoted = (offer.items || []).find((item) => item.lineId === line.id);
      if (!quoted || !["CAN_SUPPLY", "CAN_SOURCE"].includes(quoted.supplyStatus) || Number(quoted.quantity) !== Number(line.quantity)) return null;
      return {
        name: quoted.variation || line.name,
        requestedName: line.name,
        quantity: Number(line.quantity),
        unit: line.unit,
        price: Number(quoted.unitPrice),
        unitPrice: Number(quoted.unitPrice),
        lineTotal: Number(quoted.unitPrice) * Number(line.quantity),
        merchant: offer.merchantName,
        merchantId: offer.merchantId,
        specification: quoted.variation,
        supplyStatus: quoted.supplyStatus,
        sourcingTime: quoted.sourcingTime || "",
      };
    });
    if (items.some((item) => !item) || items.length !== requestedLines.length) return null;
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryMethod = quotation.selectedDeliveryMethod || "merchant_delivery";
    const deliveryFee = deliveryMethod === "customer_collection" ? 0 : (Number(offer.deliveryFee) || 0);
    const commission = Math.round(subtotal * feeRate);
    const merchantMaterialsProceeds = subtotal - commission;
    const merchantProceeds = merchantMaterialsProceeds + deliveryFee;
    const total = subtotal + deliveryFee;
    const id = `WK-${Date.now().toString().slice(-8)}`;
    updateState((prev) => ({
      ...prev,
      orders: [{
        id,
        receiptId: `WKR-${id.replace("WK-", "")}`,
        date: new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
        subtotal,
        wakastoreFee: commission,
        commissionRate: feeRate,
        commissionBasis: "materials_only",
        deliveryFee,
        total,
        status: "Payment verified · Funds pending",
        paymentStatus: "VERIFIED",
        settlementStatus: "PENDING_CUSTOMER_ACCEPTANCE",
        paymentMethod: "Demo payment",
        paymentVerifiedAt: new Date().toISOString(),
        customerAcceptanceStatus: "AWAITING_DELIVERY",
        deliveryMethod,
        fullOrderRequired: true,
        merchantId: offer.merchantId,
        merchantName: offer.merchantName,
        merchantMaterialsProceeds,
        merchantProceeds,
        platformCommission: commission,
        customerEmail: prev.session?.email || "",
        deliveryAddress: { address: quotation.deliveryLocation || "To be confirmed" },
        items,
        subOrders: [{ merchantId: offer.merchantId, merchantName: offer.merchantName, status: "Processing", items }],
        ledger: [{ type: "CUSTOMER_PAYMENT", status: "VERIFIED", amount: total, at: new Date().toISOString() }, { type: "FUNDS_HELD_PENDING", status: "PENDING", amount: total, at: new Date().toISOString() }],
        payments: [],
      }, ...prev.orders],
      quotations: prev.quotations.map((q) => q.id === quotationId ? { ...q, status: "Paid — funds pending acceptance", orderId: id, paidAt: new Date().toISOString() } : q),
      notifications: [{ id: `n-${Date.now()}`, title: "Payment verified · funds pending", detail: `${quotationId} was paid. Funds remain pending until complete delivery and customer acceptance.`, seen: false }, ...prev.notifications],
    }));
    return id;
  };

  const quoteToCart = (quotationId, picks, sourcingLines = []) =>
    updateState((prev) => ({
      ...prev,
      pendingQuotationId: quotationId,
      cart: [
        ...picks.map(({ productId, quantity, lineId }) => ({
          ...prev.products.find((p) => p.id === productId),
          quantity,
          lineId: lineId || null,
        })),
        ...sourcingLines.map((l) => ({
          id: `src-${l.lineId}`, kind: "sourcing", lineId: l.lineId, name: l.name, specs: l.specs || "",
          quantity: Math.max(1, Number(l.quantity) || 1), unit: l.unit || "", price: 0, image: "",
          merchantId: l.assigneeId || null,
          merchant: prev.merchants.find((m) => m.id === l.assigneeId)?.name || "Awaiting merchant",
        })),
      ],
    }));

  /* ---------- item-level sourcing, rerouting, fulfilment (all rules live in services/sourcing.js) ---------- */
  const actorOf = (s) => ({ role: s.session?.role, merchantId: merchantIdOf(s), email: s.session?.email, name: s.session?.name });
  const finalizeOrder = (prev, order) => {
    const rebuilt = Sourcing.rebuildSubOrders(order, prev.merchants);
    const t = Sourcing.orderTotals(rebuilt, feeRate);
    return { ...rebuilt, subtotal: t.confirmedSubtotal, wakastoreFee: t.fee, total: t.total };
  };
  const note = (title, detail, recipientMerchantId) => ({ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title, detail, seen: false, ...(recipientMerchantId ? { recipientMerchantId } : {}) });
  const audit = (actor, action, entity, details) => ({ id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, actor: actor || "System", action, date: new Date().toLocaleString("en-GB"), entity, details });

  // Runs a pure service action. The result is computed against the current state so the UI gets an
  // immediate { ok, error }; the same action is re-applied to the latest state inside updateState.
  const runItemAction = (orderId, itemId, fn, effects) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "Order not found." };
    const preview = fn(order, actorOf(state), state);
    if (!preview.ok) return preview;
    updateState((prev) => {
      const current = prev.orders.find((o) => o.id === orderId);
      if (!current) return prev;
      const r = fn(current, actorOf(prev), prev);
      if (!r.ok) return prev;
      const fx = effects ? effects(prev, r, current) : {};
      return {
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? finalizeOrder(prev, r.order) : o)),
        notifications: [...(fx.notifications || []), ...prev.notifications],
        auditLogs: [...(fx.auditLogs || []), ...prev.auditLogs],
        sourcing: fx.sourcing ? [...fx.sourcing, ...(prev.sourcing || [])] : prev.sourcing,
        wallet: fx.wallet || prev.wallet,
        toast: fx.toast || prev.toast,
      };
    });
    return preview;
  };
  const itemOf = (order, itemId) => order.items.find((i) => i.itemId === itemId);
  const merchantName = (s, id) => s.merchants.find((m) => m.id === id)?.name || "a merchant";

  const confirmItemSourcing = (orderId, itemId, details) =>
    runItemAction(orderId, itemId, (o, a) => Sourcing.confirmSourcing(o, itemId, a, details), (prev, r) => {
      const it = itemOf(r.order, itemId);
      return { notifications: [note("Price needs your approval", `${orderId}: ${merchantName(prev, it.currentMerchantId)} can source ${it.name} at ${it.unitPrice} per ${it.unit || "unit"} (${it.sourcing.eta}). Review it on your order. It is not charged until you approve.`)] };
    });

  const declineItemSourcing = (orderId, itemId, details) =>
    runItemAction(orderId, itemId, (o, a, s) => Sourcing.declineSourcing(o, itemId, a, details, { merchants: s.merchants, products: s.products, multiMerchant: s.settings?.multiMerchant ?? false }), (prev, r, current) => {
      const it = itemOf(r.order, itemId);
      const from = itemOf(current, itemId).currentMerchantId;
      const base = { auditLogs: [audit(merchantName(prev, from), "Declined to source item", orderId, `${it.name}: ${r.rerouted ? `rerouted to ${merchantName(prev, it.currentMerchantId)}` : "no eligible merchant"}`)] };
      if (r.rerouted) {
        return { ...base, notifications: [
          note("Item reassigned", `${orderId}: ${it.name} is now being handled by ${merchantName(prev, it.currentMerchantId)}. Your other items are unchanged.`),
          note("New item assigned", `${orderId}: please confirm whether you can supply or source ${it.quantity} ${it.unit || ""} ${it.name}.`.replace(/\s+/g, " "), it.currentMerchantId),
        ] };
      }
      return { ...base,
        notifications: [note("Item needs sourcing help", `${orderId}: no merchant has confirmed ${it.name} yet. It stays in your order as unresolved. We will source it manually.`)],
        sourcing: [{ id: `SRC-${Date.now()}-${itemId}`, orderId, itemId, item: it.name, reason: "Every eligible merchant declined or none has stock or sourcing capability.", status: "Awaiting manual sourcing" }] };
    });

  const decideItemPrice = (orderId, itemId, decision) =>
    runItemAction(orderId, itemId, (o, a, s) => {
      const r = Sourcing.decidePrice(o, itemId, a, decision);
      if (!r.ok || decision !== "approve") return r;
      const it = itemOf(o, itemId);
      const charge = it.unitPrice * it.quantity;
      if (o.paymentMethod === "wallet" && Number(s.wallet?.balance || 0) < charge) return { ok: false, code: "INSUFFICIENT_FUNDS", error: `Your demo wallet needs ₦${charge.toLocaleString("en-NG")} to approve this price. Top up and try again.` };
      return { ...r, charge };
    }, (prev, r) => {
      if (!r.charge) return { notifications: [note("Price declined", `${orderId}: you declined the price. The item stays in your order as unresolved and is not charged.`)] };
      const wallet = prev.orders.find((o) => o.id === orderId)?.paymentMethod === "wallet"
        ? { ...prev.wallet, balance: prev.wallet.balance - r.charge, history: [{ id: `tx-${Date.now()}`, label: `Approved sourced item on ${orderId}`, amount: r.charge, type: "debit", date: new Date().toLocaleDateString("en-NG") }, ...prev.wallet.history] }
        : prev.wallet;
      return { wallet, notifications: [note("Price approved", `${orderId}: ₦${r.charge.toLocaleString("en-NG")} (simulated) charged for the sourced item.`)] };
    });

  const advanceItemFulfilment = (orderId, itemId, next) =>
    runItemAction(orderId, itemId, (o, a) => Sourcing.advanceFulfilment(o, itemId, a, next), (prev, r) => {
      const it = itemOf(r.order, itemId);
      return { notifications: [note("Item update", `${orderId}: ${it.name} is now ${next.toLowerCase()}.`)] };
    });

  const acceptOrderItem = (orderId, itemId) =>
    runItemAction(orderId, itemId, (o, a) => Sourcing.acceptItem(o, itemId, a), (prev, r) => ({
      notifications: [note("Payment settled (simulation)", `${orderId}: ₦${r.settlement.merchantShare.toLocaleString("en-NG")} to the merchant, ₦${r.settlement.commission.toLocaleString("en-NG")} WakaStore commission (95/5, simulated).`, r.settlement.merchantId)],
    }));

  const reportItemProblem = (orderId, itemId, reason) =>
    runItemAction(orderId, itemId, (o, a) => Sourcing.openDispute(o, itemId, a, reason), (prev, r) => {
      const it = itemOf(r.order, itemId);
      return { notifications: [note("Problem reported", `${orderId}: ${it.name}: payment is on hold until this is resolved.`, it.currentMerchantId)], auditLogs: [audit(prev.session?.name, "Dispute opened", orderId, `${it.name}: ${reason}`)] };
    });

  const resolveItemDispute = (orderId, itemId, outcome) =>
    runItemAction(orderId, itemId, (o, a) => Sourcing.resolveDispute(o, itemId, a, outcome), (prev) => ({ auditLogs: [audit(prev.session?.name || "Admin", `Dispute ${outcome === "refund" ? "refunded" : "released"}`, orderId, itemId)] }));

  const adminAssignItem = (orderId, itemId, merchantId) =>
    runItemAction(orderId, itemId, (o, a, s) => Sourcing.adminAssign(o, itemId, merchantId, a, { merchants: s.merchants }), (prev, r) => {
      const it = itemOf(r.order, itemId);
      return {
        notifications: [note("Item assigned to you", `${orderId}: please confirm whether you can supply or source ${it.quantity} ${it.unit || ""} ${it.name}.`.replace(/\s+/g, " "), merchantId), note("Item being sourced", `${orderId}: ${it.name} has been assigned to ${merchantName(prev, merchantId)}.`)],
        auditLogs: [audit(prev.session?.name || "Admin", "Assigned unresolved item", orderId, `${it.name} -> ${merchantName(prev, merchantId)}`)],
      };
    });

  const settleQuotationOrder = (order, acceptedBy = "customer") => ({
    ...order,
    status: "Completed",
    customerAcceptanceStatus: "ACCEPTED",
    settlementStatus: "SETTLED",
    acceptedAt: new Date().toISOString(),
    acceptedBy,
    ledger: [
      ...(order.ledger || []),
      { type: "CUSTOMER_ACCEPTANCE", status: "CONFIRMED", at: new Date().toISOString(), by: acceptedBy },
      { type: "MERCHANT_SETTLEMENT", status: "RELEASED", amount: Number(order.merchantProceeds || 0), at: new Date().toISOString() },
      { type: "WAKASTORE_COMMISSION", status: "ALLOCATED", amount: Number(order.platformCommission || 0), at: new Date().toISOString() },
    ],
  });
  const acceptQuotationOrder = (orderId) => {
    const current = state.orders.find((order) => order.id === orderId);
    if (state.session?.role !== "customer" || !current || current.customerEmail !== state.session?.email || !current.fullOrderRequired || current.customerAcceptanceStatus !== "AWAITING_DELIVERY" || !(current.subOrders || []).some((sub) => sub.status === "Delivered")) return false;
    updateState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => order.id === orderId ? settleQuotationOrder(order, "customer") : order),
      notifications: [{ id: `n-${Date.now()}`, title: "Order accepted · settlement released", detail: `${orderId}: customer accepted the complete delivery. Merchant proceeds and WakaStore commission have been allocated in this demo.`, seen: false }, ...prev.notifications],
    }));
    return true;
  };
  const adminResolveQuotationAcceptance = (orderId, outcome = "release", noteText = "") => {
    const current = state.orders.find((order) => order.id === orderId);
    if (!["admin", "super-admin"].includes(state.session?.role) || !current || !current.fullOrderRequired || current.customerAcceptanceStatus !== "AWAITING_DELIVERY" || !(current.subOrders || []).some((sub) => sub.status === "Delivered")) return false;
    updateState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        if (outcome === "release") return { ...settleQuotationOrder(order, prev.session?.name || "admin"), adminResolution: String(noteText || "Admin reviewed delivery evidence and authorized settlement."), adminResolvedAt: new Date().toISOString() };
        return { ...order, adminReviewStatus: "UNDER_REVIEW", adminReviewNote: String(noteText || "Admin contacted the customer and is investigating."), adminReviewUpdatedAt: new Date().toISOString() };
      }),
      auditLogs: [{ id: `audit-${Date.now()}`, actor: prev.session?.name || "Admin", action: outcome === "release" ? "Released pending quotation settlement" : "Opened acceptance investigation", entity: orderId, date: new Date().toLocaleString("en-NG"), details: String(noteText || "") }, ...prev.auditLogs],
      notifications: [{ id: `n-${Date.now()}`, title: outcome === "release" ? "Admin released pending funds" : "Admin review opened", detail: `${orderId}: ${noteText || (outcome === "release" ? "Settlement authorized after review." : "Customer acceptance is under investigation.")}`, seen: false }, ...prev.notifications],
    }));
    return true;
  };

  const setMerchantSourcing = (enabled) => {
    const id = merchantIdOf(state);
    if (!id || state.session?.role !== "merchant") return { ok: false, error: "Only a merchant can change this." };
    updateState((prev) => ({ ...prev, merchants: prev.merchants.map((m) => (m.id === id ? { ...m, acceptsSourcing: Boolean(enabled) } : m)) }));
    return { ok: true };
  };

  /* ---------------------------------------------------------------- payment attempts (SIMULATED provider) */
  const PAYMENT_FAILURES = {
    declined: "Card declined by the issuer (simulated).",
    insufficient: "Insufficient funds (simulated).",
    timeout: "The payment provider did not confirm the transaction (simulated).",
  };
  // Records every attempt. `key` is an idempotency key per checkout session: once an attempt with that key has
  // succeeded, further attempts return the same success and never charge twice. An unconfirmed (timed-out)
  // attempt blocks a new charge until an admin reconciles it with the provider.
  const attemptPayment = ({ key, kind = "order", ref = "", amount = 0, method = "card", outcome = "success" }) => {
    const prior = (state.paymentAttempts || []).filter((a) => a.key === key);
    const won = prior.find((a) => a.status === "success");
    if (won) return { ok: true, duplicate: true, attemptId: won.id };
    if (prior.some((a) => a.status === "unconfirmed")) {
      return { ok: false, status: "unconfirmed", error: "Your earlier payment has not been confirmed by the provider yet. WakaStore will reconcile it before you can pay again, so you are never charged twice." };
    }
    const status = outcome === "success" ? "success" : outcome === "timeout" ? "unconfirmed" : "failed";
    const attempt = {
      id: `PAY-${Date.now().toString().slice(-7)}-${(state.paymentAttempts || []).length + 1}`,
      key, kind, ref, amount: Number(amount) || 0, method, status,
      reason: status === "success" ? "" : PAYMENT_FAILURES[outcome] || "Payment failed (simulated).",
      at: new Date().toISOString(),
    };
    updateState((prev) => ({
      ...prev,
      paymentAttempts: [attempt, ...prev.paymentAttempts],
      notifications: status === "success" ? prev.notifications : [{ id: `n-${Date.now()}`, title: status === "failed" ? "Payment failed" : "Payment not confirmed", detail: `${ref || "Your payment"}: ${attempt.reason}`, seen: false }, ...prev.notifications],
    }));
    return status === "success" ? { ok: true, attemptId: attempt.id } : { ok: false, status, attemptId: attempt.id, error: attempt.reason };
  };
  // Admin settles an unconfirmed attempt after checking the provider: confirm it, or mark it failed so the customer can retry.
  const reconcilePayment = (attemptId, decision, note = "") =>
    updateState((prev) => ({
      ...prev,
      paymentAttempts: prev.paymentAttempts.map((a) => a.id === attemptId ? { ...a, status: decision === "confirm" ? "success" : "failed", reason: decision === "confirm" ? "" : "Not received by provider. Marked failed by admin.", reconciledAt: new Date().toISOString(), reconciledBy: prev.session?.name || "Admin", reconcileNote: note } : a),
      auditLogs: [{ id: `audit-${Date.now()}`, actor: prev.session?.name || "Admin", action: decision === "confirm" ? "Confirmed an unconfirmed payment" : "Marked an unconfirmed payment as failed", entity: attemptId, date: new Date().toLocaleString("en-NG"), details: note || "Reconciled against the payment provider record (simulated)." }, ...prev.auditLogs],
    }));

  /* ---------------------------------------------------------------- notification delivery log */
  useEffect(() => {
    const known = new Set((state.notificationLog || []).map((e) => e.notificationId));
    if (!state.notifications.some((n) => n.id && !known.has(n.id))) return;
    setState((prev) => {
      const have = new Set((prev.notificationLog || []).map((e) => e.notificationId));
      const add = prev.notifications.filter((n) => n.id && !have.has(n.id)).flatMap((n) => buildLogEntries(n));
      return add.length ? { ...prev, notificationLog: [...add, ...(prev.notificationLog || [])].slice(0, 400) } : prev;
    });
  }, [state.notifications]);
  const retryNotification = (entryId) =>
    updateState((prev) => ({ ...prev, notificationLog: prev.notificationLog.map((e) => (e.id === entryId ? retryEntry(e) : e)) }));

  /* ---------------------------------------------------------------- dispatch and proof of delivery */
  // Stores the merchant's record AND moves the sub-order status in one update, so the two can never disagree.
  const recordFulfilmentStep = (orderId, merchantId, status, key, record) =>
    updateState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      const target = (order?.subOrders || []).find((x) => x.merchantId === merchantId && !["Rejected", "Reassigned"].includes(x.status));
      if (!order || !target) return prev;
      const at = new Date().toISOString();
      const title = key === "dispatch" ? (status === "Ready for collection" ? "Order ready for collection" : "Order dispatched") : "Delivery completed";
      const detail = key === "dispatch"
        ? `${orderId}: ${status === "Ready for collection" ? `ready for collection${record.pickupCode ? ` (pickup code ${record.pickupCode})` : ""}` : `on its way with ${record.carrier || "the merchant"}${record.eta ? `, expected ${record.eta}` : ""}`}.`
        : `${orderId}: delivery recorded (received by ${record.receivedBy}). Please review and accept the complete delivery.`;
      return {
        ...prev,
        orders: prev.orders.map((o) => o.id !== orderId ? o : { ...o, [key]: { ...record, merchantId, at }, subOrders: o.subOrders.map((x) => x === target ? { ...x, status, updatedAt: at } : x) }),
        notifications: [{ id: `n-${Date.now()}`, title, detail, seen: false }, ...prev.notifications],
      };
    });

  const value = useMemo(
    () => ({
      state,
      updateState,
      attemptPayment,
      reconcilePayment,
      retryNotification,
      recordFulfilmentStep,
      addToCart,
      updateQuantity,
      removeFromCart,
      toggleSaved,
      markNotificationSeen,
      markAllNotificationsSeen,
      saveAddress,
      removeAddress,
      createOrder,
      submitQuotation,
      matchQuotationMerchants,
      signIn,
      signOut,
      notify,
      ensureToastCleared,
      approveMerchant,
      autoApproveMerchant,
      rejectMerchant,
      suspendMerchant,
      reactivateMerchant,
      removeMerchant,
      addProduct,
      updateProduct,
      deleteProduct,
      updateSubOrderStatus,
      processRefund,
      feeRate,
      registerCustomer,
      registerMerchant,
      signInWithPassword,
      resubmitMerchant,
      createQuotationFull,
      submitMerchantQuote,
      selectMerchantQuote,
      confirmMerchantQuotation,
      approveMerchantQuotation,
      quoteToCart,
      sendChatMessage,
      payQuotation,
      confirmItemSourcing,
      declineItemSourcing,
      decideItemPrice,
      advanceItemFulfilment,
      acceptOrderItem,
      reportItemProblem,
      resolveItemDispute,
      adminAssignItem,
      setMerchantSourcing,
      acceptQuotationOrder,
      adminResolveQuotationAcceptance,
    }),
    [state],
  );

  return <AppState.Provider value={value}>{children}</AppState.Provider>;
}

export const useAppState = () => useContext(AppState);
