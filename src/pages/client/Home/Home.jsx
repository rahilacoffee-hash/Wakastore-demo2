import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MapPin,
  PackageCheck,
  Search,
  Store,
  WalletCards,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MARKET_CATEGORIES } from "../../../constants/marketCategories";
import { products as demoProducts } from "../../../data/marketplace";
import { useAppState } from "../../../context/AppStateContext";
import WakastoreLogo from "../../../components/ui/WakastoreLogo";
import ProductTile from "../../../components/ui/ProductTile";

function SectionTitle({ title, to, label = "See all" }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-[Manrope] text-xl font-extrabold tracking-[-.03em] sm:text-2xl">{title}</h2>
      {to && (
        <Link className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--red)]" to={to}>
          {label}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function HomeHeader({ search, onSearch, onSubmit, unread, firstName }) {
  return (
    <div>
      <section className="relative isolate overflow-hidden rounded-b-[32px] bg-[linear-gradient(180deg,#B90013_0%,#D8061A_55%,#ED0018_100%)] px-5 pb-16 pt-[max(18px,env(safe-area-inset-top))] text-white sm:px-8 lg:rounded-[28px] lg:px-12 lg:pb-20 lg:pt-10">
        <div className="pointer-events-none absolute -right-16 top-10 -z-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <img
          src="/hero-cutout.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="pointer-events-none absolute -right-7 bottom-0 -z-10 h-[250px] w-auto max-w-none select-none sm:right-6 sm:h-[300px] lg:right-16 lg:h-[360px]"
        />
        <div className="flex items-center justify-between lg:hidden">
          <div className="[&_img]:h-7 [&_img]:w-auto [&_img]:brightness-0 [&_img]:invert">
            <WakastoreLogo />
          </div>
          <Link
            to="/client/notifications"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="relative grid h-11 w-11 place-items-center rounded-full"
          >
            <Bell size={22} />
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#171717] px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        </div>

        <Link
          to="/client/account#addresses"
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-white/45 px-4 text-[15px] font-semibold lg:mt-0"
        >
          <MapPin size={16} aria-hidden="true" />
          Delivery address
          <ChevronDown size={15} aria-hidden="true" />
        </Link>

        <h1 className="mt-5 max-w-[58%] font-[Manrope] text-[28px] font-extrabold leading-[1.1] tracking-[-.035em] sm:text-4xl lg:max-w-[520px] lg:text-5xl">
          What are you building today{firstName ? `, ${firstName}` : ""}?
        </h1>
        <p className="mt-3 max-w-[52%] text-[15px] leading-[22px] text-white/90 lg:max-w-[440px] lg:text-base">
          Search materials, compare trusted merchants, get everything in one order.
        </p>
        <div className="h-[84px] lg:h-[96px]" />
      </section>

      <form onSubmit={onSubmit} className="relative z-10 -mt-7 px-5 sm:px-8 lg:-mt-8 lg:px-12">
        <div className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 shadow-[0_10px_30px_rgba(23,23,23,.14)] lg:max-w-[640px]">
          <Search size={20} className="shrink-0 text-[#77727B]" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search cement, cables, tiles…"
            aria-label="Search building materials"
            className="min-w-0 flex-1 bg-transparent text-base text-[#171717] outline-none placeholder:text-[#85818A]"
          />
          <button type="submit" className="h-10 rounded-xl bg-[var(--red)] px-4 text-sm font-bold text-white">
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Home() {
  let navigate = useNavigate();
  let [search, setSearch] = useState("");
  let { state } = useAppState();
  let firstName = state?.session?.name?.split(" ")[0] || "";
  let inventory = (state?.products || demoProducts).filter(
    (p) => p.available !== false && !p.archived && Number(p.stock ?? 1) > 0,
  );
  let approved = (state?.merchants || []).filter((m) => m.status === "approved");
  let activeOrder = (state?.orders || []).find((o) => !/delivered|completed|cancelled/i.test(o.status || ""));
  let unread = (state?.notifications || []).filter((n) => !n.seen).length;
  let popular = inventory.slice(0, 4);
  let popularIds = new Set(popular.map((p) => p.id || p.name));
  let recommended = [];
  let seen = new Set();
  inventory.forEach((p) => {
    if (!popularIds.has(p.id || p.name) && !seen.has(p.category) && recommended.length < 4) {
      seen.add(p.category);
      recommended.push(p);
    }
  });

  function goSearch(e) {
    e.preventDefault();
    navigate(`/client/explore${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
  }
  function countFor(name) {
    return inventory.filter((p) => p.category === name).length;
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-5 lg:px-0">
      <HomeHeader search={search} onSearch={setSearch} onSubmit={goSearch} unread={unread} firstName={firstName} />

      <div className="space-y-9 px-5 pt-8 sm:px-8 lg:space-y-12 lg:px-12 lg:pt-12">
        <section>
          <SectionTitle title="Shop by category" to="/client/categories" />
          <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-6">
            {MARKET_CATEGORIES.slice(0, 12).map(({ name, short, icon: Icon }) => (
              <Link
                key={name}
                to={`/client/explore?category=${encodeURIComponent(name)}`}
                className="flex flex-col items-center gap-2 text-center transition active:scale-95"
                aria-label={`${name}, ${countFor(name)} products`}
              >
                <span className="grid h-[58px] w-[58px] place-items-center rounded-2xl bg-[var(--blush)] text-[var(--red)]">
                  <Icon size={25} />
                </span>
                <span className="text-xs font-bold leading-4">{short}</span>
              </Link>
            ))}
          </div>
        </section>

        <Link
          to="/client/quotations/new"
          className="group relative flex min-h-[172px] items-center justify-between gap-3 overflow-hidden rounded-3xl bg-[var(--blush)] p-5 text-[#171717] sm:p-8"
        >
          <div className="relative z-10 max-w-[270px] sm:max-w-md">
            <span className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--red)]">Smart sourcing</span>
            <h2 className="mt-2 font-[Manrope] text-2xl font-extrabold leading-tight tracking-[-.04em] sm:text-3xl">
              Got a materials list?
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#65585B]">
              Paste it, type it or upload it once. Compare offers from merchants that can supply at least 60% of it.
            </p>
            <span className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--red)] px-4 text-sm font-bold text-white">
              Get a quotation <ArrowRight size={16} />
            </span>
          </div>
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[26px] bg-white/80 text-[var(--red)] shadow-sm sm:h-28 sm:w-28">
            <ClipboardList size={42} strokeWidth={1.6} />
          </div>
        </Link>

        {approved.length > 0 && (
          <section>
            <SectionTitle title="Featured merchants" />
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 [scrollbar-width:none]">
              {approved.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  to={`/client/store/${m.id}`}
                  className="flex w-[240px] shrink-0 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 sm:w-auto"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--blush)] text-[var(--red)]">
                    <Store size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-[15px] font-bold">
                      <span className="truncate">{m.name}</span>
                      <BadgeCheck size={15} className="shrink-0 text-[var(--red)]" aria-label="Verified" />
                    </span>
                    <span className="block truncate text-xs text-[var(--muted)]">{m.address}</span>
                  </span>
                  <ChevronRight size={16} className="ml-auto shrink-0 text-[var(--muted)]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle title="Popular materials" to="/client/explore" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {popular.map((p) => <ProductTile key={p.id || p.name} product={p} />)}
          </div>
        </section>

        <section className="relative isolate overflow-hidden rounded-3xl bg-[#171717] text-white">
          <img
            src="/hero.webp"
            alt="A WakaStores merchant preparing an order"
            loading="lazy"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,23,23,.88),rgba(23,23,23,.35))]" />
          <div className="flex min-h-[300px] max-w-[460px] flex-col justify-end p-6 sm:min-h-[360px] sm:p-10">
            <span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FCEBED]">Work smart, not hard</span>
            <h2 className="mt-2 font-[Manrope] text-3xl font-black leading-[1.05] tracking-[-.04em] sm:text-4xl">
              Build better, source smarter.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/85">
              One marketplace for cement, steel, tiles, electricals and more, from merchants we approve.
            </p>
            <Link to="/client/explore" className="mt-5 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-[var(--red)] px-5 text-sm font-bold text-white">
              Explore materials <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {recommended.length > 0 && (
          <section>
            <SectionTitle title="Recommended for you" to="/client/explore" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {recommended.map((p) => <ProductTile key={p.id || p.name} product={p} />)}
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3">
          <Link to="/client/orders" className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--blush)] text-[var(--red)]"><PackageCheck size={21} /></span>
            <span>
              <span className="block text-xs text-[var(--muted)]">{activeOrder ? "Active order" : "Orders"}</span>
              <span className="block text-[15px] font-bold">{activeOrder ? `${activeOrder.id} · ${activeOrder.status}` : "Track your orders"}</span>
            </span>
          </Link>
          <Link to="/client/wallet" className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--soft)] text-[#171717]"><WalletCards size={21} /></span>
            <span>
              <span className="block text-xs text-[var(--muted)]">WakaWallet · demo</span>
              <span className="block text-[15px] font-bold">View balance</span>
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}
