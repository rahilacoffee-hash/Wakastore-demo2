import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNaira } from "../../utils/formatters";

export default function ProductTile({ product }) {
  let inStock = Number(product.stock ?? 1) > 0;
  return (
    <Link
      to={`/client/product/${encodeURIComponent(product.id || product.name)}`}
      className="group min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition active:scale-[.985]"
    >
      <div className="relative aspect-[1.2/1] overflow-hidden bg-[var(--soft)]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#55515A] shadow-sm">
          {inStock ? "In stock" : "Out of stock"}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-xs font-medium text-[var(--muted)]">{product.category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5">{product.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">{product.merchant}</p>
        <div className="mt-3 flex items-center justify-between gap-1">
          <strong className="text-sm font-extrabold">{formatNaira(product.price)}</strong>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--red)] text-white">
            <ShoppingBag size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
