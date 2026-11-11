import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  FileText,
  PackageCheck,
  WalletCards,
  FileUp,
  ClipboardPaste,
  Plus,
  Send,
  ArrowDownLeft,
  ChevronRight,
  Construction,
} from "lucide-react";
import { MARKET_CATEGORIES as categories } from "../../constants/marketCategories";
import { products, orders, quotations } from "../../data/marketplace";
import { formatNaira } from "../../utils/formatters";
import ProductCard from "../../components/ui/ProductCard";
import SectionHead from "../../components/shared/SectionHead";
import Hero from "../../section/Hero/Hero";
export function Overview() {
  return (
    <>
      <Hero/>
      <section className="stats">
        <Stat
          icon={PackageCheck}
          label="Recent orders"
          value="03"
          note="1 order in transit"
        />
        <Stat
          icon={WalletCards}
          label="Demo wallet balance"
          value={formatNaira(245000)}
          note="Demo balance only"
        />
        <Stat
          icon={FileText}
          label="Active quotations"
          value="02"
          note="Quotes being prepared"
        />
      </section>
      <SectionHead
        title="Recommended for your project"
        action="View marketplace"
        to="/client/explore"
      />
      <div className="product-grid">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.name} product={p} />
        ))}
      </div>
    </>
  );
}
function Stat({ icon: Icon, label, value, note }) {
  return (
    <article className="stat">
      <span>
        <Icon />
      </span>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
        <small>{note}</small>
      </div>
    </article>
  );
}
export function Marketplace() {
  const { state } = useAppState();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState("popular");
  const activeCategory = params.get("category") || "All";
  const inventory = Array.isArray(state?.products) ? state.products : products;
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = inventory.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const haystack = `${product.name || ""} ${product.description || ""} ${product.brand || ""} ${product.sku || ""} ${product.category || ""} ${product.subcategory || ""} ${product.merchant || ""}`.toLowerCase();
      const merchant = state.merchants?.find((item) => item.id === product.merchantId);
      const merchantIsActive = !merchant || merchant.status === "approved";
      return matchesCategory && merchantIsActive && (!term || haystack.includes(term)) && product.available !== false && !product.archived && Number(product.stock ?? 1) > 0;
    });
    if (sort === "price-low") result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "price-high") result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === "name") result.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return result;
  }, [inventory, activeCategory, search, sort, state.merchants]);
  const chooseCategory = (category) => {
    const next = new URLSearchParams(params);
    if (category === "All") next.delete("category");
    else next.set("category", category);
    setParams(next);
  };
  return (
    <>
      <div className="market-head">
        <div>
          <span className="eyebrow">MATERIAL MARKETPLACE</span>
          <h2>Source with confidence.</h2>
          <p>Compare available materials from marketplace suppliers.</p>
        </div>
        <NavLink className="primary" to="/client/quotations/new">
          Request materials <ArrowRight />
        </NavLink>
      </div>
      <form className="market-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); if (search.trim()) next.set("search", search.trim()); else next.delete("search"); setParams(next); }}>
        <span aria-hidden="true">⌕</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cement, cables, tiles and more" aria-label="Search marketplace products" />
        <button type="submit">Search</button>
      </form>
      <div className="category-pills" aria-label="Filter by category">
        <button type="button" className={activeCategory === "All" ? "selected" : ""} onClick={() => chooseCategory("All")}>All products</button>
        {categories.map((category) => (
          <button type="button" key={category.name} className={activeCategory === category.name ? "selected" : ""} aria-pressed={activeCategory === category.name} onClick={() => chooseCategory(category.name)}>{category.name}</button>
        ))}
      </div>
      <div className="grid-toolbar">
        <span aria-live="polite"><strong>{visibleProducts.length}</strong> material{visibleProducts.length === 1 ? "" : "s"} found</span>
        <label className="flex items-center gap-2 text-xs font-semibold">Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs">
            <option value="popular">Recommended</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>
      {visibleProducts.length ? (
        <div className="product-grid marketplace-grid">
          {visibleProducts.map((product) => <ProductCard key={product.id || product.name} product={product} />)}
        </div>
      ) : (
        <div className="panel py-12 text-center"><h3 className="text-lg font-extrabold">No materials found</h3><p className="mt-2 text-sm text-[var(--muted)]">Try another search or clear the category filter.</p><button type="button" className="primary mt-4" onClick={() => { setSearch(""); setSort("popular"); setParams({}); }}>Clear filters</button></div>
      )}
    </>
  );
}
export function Categories() {
  return (
    <>
      <div className="intro">
        <span className="eyebrow">MARKETPLACE DIRECTORY</span>
        <h2>Everything for the work ahead.</h2>
        <p>
          Explore specialist materials across every essential trade category.
        </p>
      </div>
      <div className="category-grid">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <NavLink
              to={`/client/explore?category=${encodeURIComponent(c.name)}`}
              className="category-card"
              key={c.name}
            >
              <span>
                <Icon />
              </span>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <ArrowUpRight />
            </NavLink>
          );
        })}
      </div>
    </>
  );
}
export function Quotations() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const quotations = state.quotations;
  return (
    <>
      <section className="quote-hero">
        <div>
          <span className="eyebrow">MATERIAL SOURCING</span>
          <h2>Let suppliers come to you.</h2>
          <p>
            Send your material list and receive matched responses. This is a
            demo interface—no files are processed.
          </p>
        </div>
        <NavLink className="primary" to="/client/quotations/new">
          <Plus /> Start new quotation
        </NavLink>
      </section>
      <div className="quote-actions">
        <button onClick={() => navigate("/client/quotations/new?mode=upload")}>
          <FileUp />
          <b>Upload list</b>
          <span>Demo PDF or image upload</span>
        </button>
        <button onClick={() => navigate("/client/quotations/new?mode=paste")}>
          <ClipboardPaste />
          <b>Paste material list</b>
          <span>Add items from any document</span>
        </button>
      </div>
      <section className="panel">
        <SectionHead title="Your quotations" />
        {quotations.map((q) => (
          <div className="quote-row" key={q.id}>
            <span className="row-icon">
              <FileText />
            </span>
            <div>
              <b>{q.name}</b>
              <p>
                {q.id} · Submitted {q.date}
              </p>
            </div>
            <span className="status amber">{q.status}</span>
            <button className="plain" onClick={() => navigate(`/client/quotations/${q.id}`)}>
              View <ChevronRight />
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
export function Orders() {
  return (
    <>
      <div className="intro">
        <span className="eyebrow">ORDER MANAGEMENT</span>
        <h2>Orders that stay on track.</h2>
        <p>Monitor each purchase across your selected merchants.</p>
      </div>
      <section className="panel orders-panel">
        {orders.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </section>
    </>
  );
}
function OrderRow({ order }) {
  return (
    <div className="order-row">
      <div>
        <b>{order.id}</b>
        <p>
          {order.date} · {order.merchants} merchant
          {order.merchants > 1 ? "s" : ""}
        </p>
      </div>
      <strong>{formatNaira(order.total)}</strong>
      <span
        className={"status " + order.status.toLowerCase().replace(" ", "-")}
      >
        {order.status}
      </span>
      <button className="plain">
        <ChevronRight />
      </button>
    </div>
  );
}
export function Wallet() {
  return (
    <>
      <section className="wallet-card">
        <div>
          <span className="eyebrow">WAKAWALLET · DEMO</span>
          <p>Available balance</p>
          <h2>{formatNaira(245000)}</h2>
          <small>This is a demonstration balance, not real money.</small>
        </div>
        <WalletCards />
      </section>
      <div className="wallet-actions">
        <button className="primary">
          <Plus /> Deposit funds
        </button>
        <button className="secondary">
          <Send /> Make payment
        </button>
      </div>
      <section className="panel">
        <SectionHead title="Recent activity" />
        {[
          "Demo wallet top-up",
          "Payment for WK-20399",
          "Demo promotional credit",
        ].map((x, i) => (
          <div className="transaction" key={x}>
            <span className="row-icon">
              <ArrowDownLeft />
            </span>
            <div>
              <b>{x}</b>
              <p>{["10 Oct 2026", "03 Oct 2026", "22 Sep 2026"][i]}</p>
            </div>
            <strong>
              {i === 1 ? "- " : ""}
              {formatNaira([100000, 68200, 25000][i])}
            </strong>
          </div>
        ))}
      </section>
    </>
  );
}
export function Placeholder({ role, route }) {
  return (
    <div className="placeholder">
      <span className="row-icon">
        <Construction />
      </span>
      <h2>{route?.replace(/-/g, " ") || "Overview"} workspace</h2>
      <p>
        The {role} experience has its navigation foundation in place. This view
        is ready for its next implementation phase.
      </p>
    </div>
  );
}
