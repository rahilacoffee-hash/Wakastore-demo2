import { useMemo, useState } from "react";
import { BarChart3, BellRing, CircleDollarSign, Clock3, FileText, Landmark, Layers, ShieldAlert, WalletCards } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { formatNaira } from "../utils/formatters";
import { categories, MERCHANT_TO_CUSTOMER_CATEGORY } from "../constants/categories";
import { MARKET_CATEGORIES } from "../constants/marketCategories";
import { matchQuotation } from "../services/matching";
import { moneyByMerchant } from "../services/ledger";
import { computeReports } from "../services/reports";

export const card = "rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5";
export const pill = (tone) => `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${tone}`;
export const GOOD = "bg-emerald-100 text-emerald-800", WARN = "bg-amber-100 text-amber-900", BAD = "bg-[var(--blush)] text-[var(--red)]", NEUTRAL = "bg-[var(--soft)] text-[var(--muted)]";
const btn = "rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold";

export function Head({ eyebrow, title, note }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{title}</h1>
      {note && <p className="mt-2 text-sm text-[var(--muted)]">{note}</p>}
    </div>
  );
}
export function Stat({ label, value, Icon, note }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[.14em] text-[var(--muted)]">{label}</div>
          <div className="mt-2 text-2xl font-extrabold">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--blush)] text-[var(--red)]"><Icon size={18} /></div>
      </div>
      {note && <div className="mt-3 text-xs text-[var(--muted)]">{note}</div>}
    </div>
  );
}
export const Empty = ({ children }) => <p className="rounded-xl bg-[var(--soft)] p-4 text-sm text-[var(--muted)]">{children}</p>;
const left = (iso, now) => { const t = Date.parse(iso || 0); if (!t) return ""; if (now >= t) return "Expired"; const h = Math.floor((t - now) / 3600e3), m = Math.floor(((t - now) % 3600e3) / 60000); return h > 0 ? `${h}h ${m}m left` : `${m}m left`; };
const offerTotal = (o) => (o.items || []).filter((i) => ["CAN_SUPPLY", "CAN_SOURCE"].includes(i.supplyStatus)).reduce((n, i) => n + Number(i.unitPrice || 0) * Number(i.quantity || 0), 0) + Number(o.deliveryFee || 0);

/* ------------------------------------------------------------------ Categories */
export function AdminCategories() {
  const { state } = useAppState();
  const rows = useMemo(() => categories.map((c) => ({
    name: c.name,
    customer: MERCHANT_TO_CUSTOMER_CATEGORY[c.name] || "Unmapped",
    merchants: state.merchants.filter((m) => (m.categories || []).includes(c.name)),
    products: state.products.filter((p) => p.category === c.name),
  })), [state.merchants, state.products]);
  const approved = (r) => r.merchants.filter((m) => m.status === "approved" && m.active !== false).length;
  return (
    <div className="space-y-5">
      <Head eyebrow="Catalogue" title="Categories" note="Customer-facing categories and the official merchant categories mapped to each. Coverage shows where merchants or stock are missing." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Customer categories" value={MARKET_CATEGORIES.length} Icon={Layers} />
        <Stat label="Merchant categories" value={categories.length} Icon={Layers} />
        <Stat label="With no approved merchant" value={rows.filter((r) => approved(r) === 0).length} Icon={ShieldAlert} note="Requests for these cannot be matched" />
      </div>
      {MARKET_CATEGORIES.map((g) => {
        const list = rows.filter((r) => r.customer === g.name);
        return (
          <section key={g.name} className={card}>
            <h2 className="text-lg font-extrabold">{g.name}</h2>
            {list.length ? (
              <div className="mt-3 divide-y divide-[var(--line)]">
                {list.map((r) => (
                  <div key={r.name} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="font-bold">{r.name}</span>
                    <span className="flex gap-2">
                      <span className={pill(approved(r) ? GOOD : BAD)}>{approved(r)} approved merchant{approved(r) === 1 ? "" : "s"}</span>
                      <span className={pill(r.products.length ? NEUTRAL : WARN)}>{r.products.length} product{r.products.length === 1 ? "" : "s"}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : <div className="mt-3"><Empty>No merchant category is mapped here yet.</Empty></div>}
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Quotations + "why did this merchant qualify?" */
function WhyMatched({ q }) {
  const { state } = useAppState();
  const threshold = Number(state.settings?.threshold ?? 60);
  const match = useMemo(() => matchQuotation(q.items || [], state.merchants, state.products, threshold), [q, state.merchants, state.products, threshold]);
  const notApproved = state.merchants.filter((m) => m.status !== "approved" || m.active === false);
  return (
    <div className="mt-3 space-y-2 rounded-2xl bg-[var(--soft)] p-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Why merchants qualified (rule: at least {threshold}% of distinct lines; inventory presence counts, stock is confirmed by the merchant)</p>
      {match.results.map((r) => (
        <div key={r.merchant.id} className="rounded-xl bg-[var(--surface)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b>{r.merchant.name}</b>
            <span className="flex gap-2">
              <span className={pill(r.eligible ? GOOD : BAD)}>{r.eligible ? "Invited" : "Below threshold"}</span>
              <span className={pill(NEUTRAL)}>{r.matchedCount} of {r.totalLines} lines · {Math.round(r.percentage)}%</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">Matched: {r.matched.map((m) => m.line.name).join(", ") || "none"}</p>
          {r.unmatched.length > 0 && <p className="text-xs text-[var(--muted)]">Not in inventory: {r.unmatched.map((m) => m.line.name).join(", ")}</p>}
        </div>
      ))}
      {notApproved.length > 0 && <p className="text-xs text-[var(--muted)]">Excluded before matching (not approved or inactive): {notApproved.map((m) => `${m.name} (${m.status})`).join(", ")}</p>}
    </div>
  );
}
export function AdminQuotations() {
  const { state } = useAppState();
  const [open, setOpen] = useState(null);
  const now = Date.now();
  const quotes = state.merchantQuotes || [];
  const rows = (state.quotations || []).map((q) => {
    const offers = quotes.filter((m) => m.quotationId === q.id);
    const valid = offers.filter((m) => Date.parse(m.validUntil || 0) > now);
    const closed = Date.parse(q.merchantResponseDeadlineAt || 0) > 0 && Date.parse(q.merchantResponseDeadlineAt) <= now;
    return { q, offers, valid, closed, eligible: (q.matchedMerchants || []).length, noResponse: closed && offers.length === 0 };
  });
  const attention = rows.filter((r) => r.noResponse || r.eligible === 0);
  return (
    <div className="space-y-5">
      <Head eyebrow="Procurement" title="Quotation monitoring" note="Invitations expire after the response window; a submitted quotation is valid for its set period. Requests with nobody eligible, or no response, need an admin." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Requests" value={rows.length} Icon={FileText} />
        <Stat label="Open invitations" value={rows.filter((r) => !r.closed).length} Icon={Clock3} />
        <Stat label="Quotations submitted" value={quotes.length} Icon={CircleDollarSign} />
        <Stat label="Need attention" value={attention.length} Icon={ShieldAlert} note="No eligible merchant, or no response in time" />
      </div>
      {!rows.length && <Empty>No quotation requests yet. Create one from the customer app.</Empty>}
      {rows.map(({ q, offers, valid, closed, eligible, noResponse }) => (
        <section key={q.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-lg font-extrabold">{q.id} · {q.name}</div>
              <div className="text-xs text-[var(--muted)]">{q.date} · {q.items?.length || 0} line{q.items?.length === 1 ? "" : "s"} · {q.deliveryLocation || "Delivery location not specified"}{q.smartfixerJobId ? ` · SmartFixer job ${q.smartfixerJobId}` : ""}</div>
            </div>
            <span className={pill(noResponse || eligible === 0 ? BAD : String(q.status).startsWith("Paid") ? GOOD : NEUTRAL)}>{noResponse ? "No response" : eligible === 0 ? "No eligible merchant" : q.status}</span>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--soft)] p-3"><b>{eligible}</b> eligible merchant{eligible === 1 ? "" : "s"}<div className="text-xs text-[var(--muted)]">{(q.matchedMerchants || []).join(", ") || "None"}</div></div>
            <div className="rounded-xl bg-[var(--soft)] p-3"><b>{offers.length}</b> submitted · <b>{valid.length}</b> still valid</div>
            <div className="rounded-xl bg-[var(--soft)] p-3">Invitation: <b>{left(q.merchantResponseDeadlineAt, now) || "No deadline"}</b><div className="text-xs text-[var(--muted)]">{closed ? "Window closed" : "Merchants can still respond"}</div></div>
          </div>
          {offers.length > 0 && (
            <div className="mt-3 divide-y divide-[var(--line)] text-sm">
              {offers.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-bold">{m.merchantName}</span>
                  <span className="text-[var(--muted)]">{formatNaira(offerTotal(m))} incl. delivery</span>
                  <span className={pill(Date.parse(m.validUntil || 0) > now ? GOOD : BAD)}>{left(m.validUntil, now) || "No expiry"}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setOpen(open === q.id ? null : q.id)} className={`${btn} mt-3`}>{open === q.id ? "Hide matching explanation" : "Why did these merchants match?"}</button>
          {open === q.id && <WhyMatched q={q} />}
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Payments (orders + provider attempts) */
export function AdminPayments() {
  const { state, reconcilePayment } = useAppState();
  const [filter, setFilter] = useState("all");
  const attempts = state.paymentAttempts || [];
  const issues = attempts.filter((a) => a.status !== "success");
  const orders = (state.orders || []).filter((o) => filter === "all" || (filter === "review" && o.adminReviewStatus === "UNDER_REVIEW"));
  const collected = (state.orders || []).reduce((n, o) => n + (o.status === "Cancelled" ? 0 : Number(o.total || 0)), 0);
  return (
    <div className="space-y-5">
      <Head eyebrow="Finance" title="Payments" note="Payments are SIMULATED in this prototype. In production, every row must be reconciled against the payment provider's confirmed transaction status, never a wallet balance." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Collected (simulated)" value={formatNaira(collected)} Icon={WalletCards} />
        <Stat label="Orders paid" value={(state.orders || []).length} Icon={CircleDollarSign} />
        <Stat label="Failed attempts" value={attempts.filter((a) => a.status === "failed").length} Icon={ShieldAlert} />
        <Stat label="Unconfirmed (need reconciling)" value={attempts.filter((a) => a.status === "unconfirmed").length} Icon={Clock3} />
      </div>
      <section className={card}>
        <h2 className="text-lg font-extrabold">Payment attempts needing attention</h2>
        {!issues.length ? <div className="mt-3"><Empty>No failed or unconfirmed payments.</Empty></div> : (
          <div className="mt-3 space-y-2">
            {issues.map((a) => (
              <div key={a.id} className="rounded-xl bg-[var(--soft)] p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b>{a.id} · {a.ref || a.kind}</b>
                  <span className={pill(a.status === "failed" ? BAD : WARN)}>{a.status}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatNaira(a.amount)} · {a.method} · {new Date(a.at).toLocaleString("en-NG")} · {a.reason}</p>
                {a.status === "unconfirmed" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => reconcilePayment(a.id, "confirm", "Provider shows the charge succeeded.")} className={btn}>Provider confirms: mark paid</button>
                    <button onClick={() => reconcilePayment(a.id, "fail", "Provider has no record of the charge.")} className={btn}>No record: mark failed</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="flex gap-2 text-xs font-bold">
        {[["all", "All orders"], ["review", "Under acceptance review"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1.5 ${filter === k ? "border-[var(--red)] bg-[var(--blush)] text-[var(--red)]" : "border-[var(--line)]"}`}>{l}</button>
        ))}
      </div>
      {!orders.length && <Empty>No orders match this filter.</Empty>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><div className="text-lg font-extrabold">{o.id}</div><div className="text-xs text-[var(--muted)]">{o.date} · {o.customerEmail || "customer"} · {o.paymentMethod || "—"}</div></div>
              <span className={pill(o.settlementStatus === "SETTLED" ? GOOD : WARN)}>{o.settlementStatus === "SETTLED" ? "Settled" : o.paymentStatus === "VERIFIED" ? "Verified · funds pending" : o.status}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-[var(--soft)] p-3">Materials<b className="block">{formatNaira(o.subtotal || 0)}</b></div>
              <div className="rounded-xl bg-[var(--soft)] p-3">Delivery<b className="block">{formatNaira(o.deliveryFee || 0)}</b></div>
              <div className="rounded-xl bg-[var(--soft)] p-3">Customer paid<b className="block">{formatNaira(o.total || 0)}</b></div>
              <div className="rounded-xl bg-[var(--soft)] p-3">Commission (from merchant)<b className="block">{formatNaira(o.platformCommission ?? o.wakastoreFee ?? 0)}</b></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Settlements */
export function AdminSettlements() {
  const { state } = useAppState();
  const perMerchant = useMemo(() => {
    const acc = {};
    for (const o of state.orders || []) {
      for (const a of moneyByMerchant(o)) {
        const r = (acc[a.merchantId] ||= { merchantId: a.merchantId, settled: 0, pending: 0, held: 0, commission: 0, pendingCommission: 0, refunded: 0, review: 0, orders: new Set() });
        r.settled += a.settled.merchantShare; r.pending += a.pending.merchantShare; r.held += a.held.gross;
        r.commission += a.settled.commission; r.pendingCommission += a.pending.commission; r.refunded += a.refunded;
        if (a.underReview) r.review += a.pending.merchantShare;
        r.orders.add(o.id);
      }
    }
    return Object.values(acc);
  }, [state.orders]);
  const nameOf = (id) => state.merchants.find((m) => m.id === id)?.name || id;
  const total = (k) => perMerchant.reduce((n, r) => n + r[k], 0);
  return (
    <div className="space-y-5">
      <Head eyebrow="Finance" title="Settlements" note="Funds are released only after the customer accepts the complete delivery, or an admin authorises release after review. Commission is on materials only; delivery is excluded." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Settled to merchants" value={formatNaira(total("settled"))} Icon={Landmark} />
        <Stat label="Pending acceptance" value={formatNaira(total("pending"))} Icon={Clock3} note={`${formatNaira(total("review"))} under admin review`} />
        <Stat label="On hold (disputes)" value={formatNaira(total("held"))} Icon={ShieldAlert} />
        <Stat label="WakaStore commission earned" value={formatNaira(total("commission"))} Icon={CircleDollarSign} note={`${formatNaira(total("pendingCommission"))} more once accepted`} />
      </div>
      {!perMerchant.length && <Empty>No settlements yet. They appear after a customer pays for an order.</Empty>}
      <div className="space-y-3">
        {perMerchant.map((r) => (
          <div key={r.merchantId} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-lg font-extrabold">{nameOf(r.merchantId)}</div>
              <span className="text-xs text-[var(--muted)]">{r.orders.size} order{r.orders.size === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-[var(--soft)] p-3">Settled<b className="block">{formatNaira(r.settled)}</b></div>
              <div className="rounded-xl bg-[var(--soft)] p-3">Pending<b className="block">{formatNaira(r.pending)}</b></div>
              <div className="rounded-xl bg-[var(--soft)] p-3">On hold<b className="block">{formatNaira(r.held)}</b></div>
              <div className="rounded-xl bg-[var(--soft)] p-3">Refunded<b className="block">{formatNaira(r.refunded)}</b></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Reports: KPIs, merchant ranking, response times, coverage */
const hrs = (h) => (h == null ? "—" : h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);
const pct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);
export function AdminReports() {
  const { state } = useAppState();
  const { kpis, ranking, coverage } = useMemo(() => computeReports(state), [state]);
  return (
    <div className="space-y-5">
      <Head eyebrow="Business intelligence" title="Reports" note="Live from this browser's demo data. Response time is measured from request creation to quotation submission." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Merchants (approved / total)" value={`${kpis.merchantsApproved} / ${kpis.merchantsTotal}`} Icon={Layers} note={`${kpis.merchantsActive} active`} />
        <Stat label="Requests matched" value={`${kpis.requestsMatched} / ${kpis.requests}`} Icon={FileText} />
        <Stat label="Avg merchant response" value={hrs(kpis.avgResponseHours)} Icon={Clock3} />
        <Stat label="Orders completed" value={kpis.ordersCompleted} Icon={BarChart3} note={`${kpis.ordersDisputed} disputed · ${kpis.ordersFailed} cancelled`} />
        <Stat label="Materials transacted" value={formatNaira(kpis.gmv)} Icon={WalletCards} />
        <Stat label="Commission earned" value={formatNaira(kpis.commissionEarned)} Icon={CircleDollarSign} />
      </div>
      <section className={card}>
        <h2 className="text-lg font-extrabold">Merchant performance ranking</h2>
        <p className="text-xs text-[var(--muted)]">Score = 40% response rate, 30% speed (faster than 24h is better), 30% orders without dispute.</p>
        {!ranking.length ? <div className="mt-3"><Empty>No approved merchants yet.</Empty></div> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[.1em] text-[var(--muted)]"><tr><th className="py-2">#</th><th>Merchant</th><th>Invited</th><th>Quoted</th><th>Response rate</th><th>Avg response</th><th>Orders</th><th>Disputes</th><th>Score</th></tr></thead>
            <tbody>{ranking.map((r, i) => (
              <tr key={r.merchantId} className="border-t border-[var(--line)]"><td className="py-2">{i + 1}</td><td className="font-bold">{r.name}</td><td>{r.invited}</td><td>{r.quoted}</td><td>{pct(r.responseRate)}</td><td>{hrs(r.avgResponseHours)}</td><td>{r.orders}</td><td>{r.disputes}</td><td><span className={pill(r.score == null ? NEUTRAL : r.score >= 70 ? GOOD : r.score >= 40 ? WARN : BAD)}>{r.score == null ? "No data" : r.score}</span></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <section className={card}>
        <h2 className="text-lg font-extrabold">Inventory coverage by category</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[.1em] text-[var(--muted)]"><tr><th className="py-2">Merchant category</th><th>Approved merchants</th><th>In-stock products</th></tr></thead>
          <tbody>{coverage.map((c) => (
            <tr key={c.name} className="border-t border-[var(--line)]"><td className="py-2 font-bold">{c.name}</td><td><span className={pill(c.merchants ? GOOD : BAD)}>{c.merchants}</span></td><td>{c.inStock}</td></tr>
          ))}</tbody>
        </table></div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Notification delivery log */
export function AdminNotificationLog() {
  const { state, retryNotification } = useAppState();
  const [filter, setFilter] = useState("all");
  const log = state.notificationLog || [];
  const shown = log.filter((e) => filter === "all" || e.status === filter).slice(0, 80);
  const count = (c, st) => log.filter((e) => e.channel === c && (!st || e.status === st)).length;
  return (
    <div className="space-y-5">
      <Head eyebrow="Communication" title="Notification delivery log" note="Every notification is recorded per channel. In-app and push are simulated; SMS is the fallback for important events (payment, dispatch, delivery, disputes). Failed deliveries can be retried." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total deliveries" value={log.length} Icon={BellRing} />
        <Stat label="In-app" value={count("in-app")} Icon={BellRing} />
        <Stat label="Push" value={count("push")} Icon={BellRing} note={`${count("push", "failed")} failed`} />
        <Stat label="SMS fallback" value={count("sms")} Icon={BellRing} note={`${count("sms", "failed")} failed`} />
      </div>
      <div className="flex gap-2 text-xs font-bold">
        {[["all", "All"], ["failed", "Failed"], ["delivered", "Delivered"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1.5 ${filter === k ? "border-[var(--red)] bg-[var(--blush)] text-[var(--red)]" : "border-[var(--line)]"}`}>{l}</button>
        ))}
      </div>
      {!shown.length && <Empty>Nothing to show for this filter.</Empty>}
      <div className="space-y-2">
        {shown.map((e) => (
          <div key={e.id} className={`${card} flex flex-wrap items-center justify-between gap-2 !p-3 text-sm`}>
            <div className="min-w-0"><b>{e.title}</b><div className="text-xs text-[var(--muted)]">{e.channel} · {e.audience} · {new Date(e.at).toLocaleString("en-NG")}{e.attempts > 1 ? ` · ${e.attempts} attempts` : ""}{e.reason ? ` · ${e.reason}` : ""}</div></div>
            <div className="flex items-center gap-2">
              <span className={pill(e.status === "delivered" ? GOOD : BAD)}>{e.status}</span>
              {e.status === "failed" && <button onClick={() => retryNotification(e.id)} className={btn}>Retry</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
