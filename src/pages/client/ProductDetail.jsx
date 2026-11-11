import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Heart, Minus, Plus, ShoppingBag, Store } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";
import { formatNaira } from "../../utils/formatters";
import ProductTile from "../../components/ui/ProductTile";

export default function ProductDetail() {
  let { id } = useParams();
  let { state, addToCart, toggleSaved, notify } = useAppState();
  let navigate = useNavigate();
  let [qty, setQty] = useState(1);
  let key = decodeURIComponent(id);
  let p = state.products.find((x) => String(x.id) === key) || state.products.find((x) => x.name === key);

  if (!p) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Product not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">It may have been removed by the merchant.</p>
        <Link to="/client/explore" className="mt-5 inline-flex h-12 items-center rounded-xl bg-[var(--red)] px-5 font-bold text-white">
          Back to Explore
        </Link>
      </div>
    );
  }

  let merchant = (state.merchants || []).find((m) => m.id === p.merchantId);
  let stock = Number(p.stock ?? 0);
  let inStock = stock > 0 && p.available !== false;
  let saved = state.wishlist.some((w) => w.id === p.id);
  let related = state.products
    .filter((x) => x.id !== p.id && x.category === p.category && x.available !== false && Number(x.stock ?? 1) > 0)
    .slice(0, 4);
  let specs = [
    ["Category", p.category],
    ["Unit", p.unit],
    ["Brand", p.brand],
    ["SKU", p.sku],
    ["Stock level", inStock ? `${stock} ${p.unit || "units"}` : "Out of stock"],
  ].filter(([, v]) => v);

  function add() {
    for (let i = 0; i < qty; i++) addToCart(p);
    notify(`${qty} × ${p.name} added to cart`);
  }
  function buyNow() {
    for (let i = 0; i < qty; i++) addToCart(p);
    navigate("/client/cart");
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-32 lg:pb-8">
      <div className="relative">
        <img className="h-[300px] w-full object-cover sm:h-[380px] sm:rounded-3xl" src={p.image || undefined} alt={p.name} />
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="absolute left-4 top-[max(14px,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow lg:hidden">
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(p)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save product"}
          className="absolute right-4 top-[max(14px,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow"
        >
          <Heart size={20} className={saved ? "fill-[var(--red)] text-[var(--red)]" : ""} />
        </button>
      </div>

      <div className="px-5 pt-5 sm:px-6">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-[#FCEBED] text-[#B90013]"}`}>
          <i className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-600" : "bg-[#B90013]"}`} />
          {inStock ? "In stock" : "Out of stock"}
        </span>
        <h1 className="mt-3 font-[Manrope] text-3xl font-extrabold leading-tight tracking-[-.035em]">{p.name}</h1>
        <p className="mt-3 text-3xl font-extrabold">
          {formatNaira(p.price)}
          {p.unit && <span className="text-base font-semibold text-[var(--muted)]"> / {p.unit}</span>}
        </p>

        {merchant && (
          <Link to={`/client/store/${merchant.id}`} className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--blush)] text-[var(--red)]"><Store size={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[15px] font-bold">
                <span className="truncate">{merchant.name}</span>
                <BadgeCheck size={15} className="shrink-0 text-[var(--red)]" aria-label="Verified" />
              </span>
              <span className="block truncate text-xs text-[var(--muted)]">{merchant.address} · View store</span>
            </span>
          </Link>
        )}

        <h2 className="mt-7 text-lg font-extrabold">Description</h2>
        <p className="mt-2 text-[15px] leading-6 text-[var(--muted)]">
          {p.description || `${p.name} supplied by ${p.merchant || "a verified merchant"}. The merchant has not added a longer description yet.`}
        </p>

        <h2 className="mt-7 text-lg font-extrabold">Specifications</h2>
        <dl className="mt-2 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {specs.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-[var(--muted)]">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {related.length > 0 && (
          <section className="mt-9">
            <h2 className="mb-3 text-xl font-extrabold">Related products</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((r) => <ProductTile key={r.id} product={r} />)}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <div className="flex h-12 shrink-0 items-center rounded-xl border border-[var(--line)]">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-12 w-11 place-items-center"><Minus size={17} /></button>
            <b className="w-8 text-center" aria-live="polite">{qty}</b>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(Math.max(stock, 1), qty + 1))} className="grid h-12 w-11 place-items-center"><Plus size={17} /></button>
          </div>
          <button type="button" disabled={!inStock} onClick={add} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--red)] text-sm font-bold text-[var(--red)] disabled:opacity-40">
            <ShoppingBag size={17} /> Add to cart
          </button>
          <button type="button" disabled={!inStock} onClick={buyNow} className="h-12 min-w-0 flex-1 rounded-xl bg-[var(--red)] text-sm font-bold text-white disabled:opacity-40">
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
