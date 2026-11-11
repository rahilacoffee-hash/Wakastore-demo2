import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Bell,
  LayoutDashboard,
  Store,
  Grid2X2,
  FileText,
  PackageCheck,
  WalletCards,
  UserRound,
  LogOut,
  Boxes,
  Truck,
  ChartNoAxesCombined,
  Users,
  CreditCard,
  SearchCheck,
  MessageSquareWarning,
  BadgeDollarSign,
  Menu,
  X,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppState } from "../context/AppStateContext";

const client = [
  ["Overview", "overview", LayoutDashboard],
  ["Marketplace", "marketplace", Store],
  ["Categories", "categories", Grid2X2],
  ["My Quotations", "quotations", FileText],
  ["My Orders", "orders", PackageCheck],
  ["WakaWallet", "wallet", WalletCards],
  ["Notifications", "notifications", Bell],
];
const merchant = [
  ["Overview", "overview", LayoutDashboard],
  ["My Products", "products", Store],
  ["Inventory", "inventory", Boxes],
  ["Incoming Orders", "orders", PackageCheck],
  ["Fulfillment", "fulfillment", Truck],
  ["Earnings", "earnings", ChartNoAxesCombined],
  ["Settlements", "settlements", BadgeDollarSign],
];
const admin = [
  ["Overview", "overview", LayoutDashboard],
  ["Merchants", "merchants", Store],
  ["Clients", "clients", Users],
  ["Categories", "categories", Grid2X2],
  ["Products", "products", Boxes],
  ["Quotations", "quotations", FileText],
  ["Orders", "orders", PackageCheck],
  ["Sourcing", "sourcing", SearchCheck],
  ["Payments", "payments", CreditCard],
  ["Settlements", "settlements", BadgeDollarSign],
  ["Complaints & Refunds", "complaints", MessageSquareWarning],
  ["Reports", "reports", ChartNoAxesCombined],
];
const maps = { client, merchant, admin };
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">W</span>
      <span>
        Waka<span>Store</span>
      </span>
    </div>
  );
}

export default function AppLayout({ role, children }) {
  const nav = maps[role] || maps.client;
  const location = useLocation(),
    navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, state } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = location.pathname.split("/").pop();
  const title = nav.find((item) => item[1] === active)?.[0] || "Overview";
  const mobilePrimary =
    role === "merchant"
      ? [nav[0], nav[3], nav[1], nav[6]]
      : [nav[0], nav[1], nav[6], nav[7]].filter(Boolean);
  const logout = () => {
    signOut();
    navigate("/login");
  };
  const NavItems = ({ compact = false }) =>
    nav.map(([label, path, Icon]) => (
      <NavLink
        key={path}
        to={`/${role}/${path}`}
        onClick={() => setMenuOpen(false)}
        className={({ isActive }) =>
          `${compact ? "flex flex-col items-center gap-1 px-2 py-2 text-[10px]" : "flex items-center gap-3 rounded-xl px-3 py-3 text-sm"} ${isActive ? "bg-[var(--blush)] font-bold text-[var(--red)]" : "text-[var(--muted)] hover:bg-[var(--soft)]"}`
        }
      >
        <Icon size={compact ? 19 : 18} />
        <span>{label}</span>
      </NavLink>
    ));
  return (
    <div className="shell role-shell">
      <aside className="sidebar">
        <Brand />
        <div className="role-chip">
          {role === "admin" && location.pathname.includes("sourcing")
            ? "Super Admin workspace"
            : `${role} workspace`}
        </div>
        <nav>
          <NavItems />
        </nav>
        <div className="side-account">
          <p>ACCOUNT</p>
          <button type="button" onClick={() => navigate(`/${role}/profile`)}>
            <UserRound />
            <span>
              {role === "merchant" ? "Company Profile" : "My Profile"}
            </span>
          </button>
          <button type="button" onClick={logout}>
            <LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="role-main min-w-0 flex-1 lg:ml-[264px]">
        <header className="role-mobile-header lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">
              WAKASTORE · {role}
            </p>
            <h1 className="truncate font-[Manrope] text-base font-extrabold">
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${role}/notifications`)}
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]"
          >
            <Bell size={18} />
            {(state?.notifications || []).some((n) => !n.seen) && (
              <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--red)]" />
            )}
          </button>
        </header>
        <main className="role-content">
          <div className="page">{children}</div>
        </main>
      </div>
      <nav
        className="role-bottom-nav lg:hidden"
        aria-label={`${role} navigation`}
      >
        {mobilePrimary.map(([label, path, Icon]) => (
          <NavLink
            key={path}
            to={`/${role}/${path}`}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold ${isActive ? "text-[var(--red)]" : "text-[var(--muted)]"}`
            }
          >
            <Icon size={19} />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-[var(--muted)]"
        >
          <Menu size={19} />
          <span>More</span>
        </button>
      </nav>
      {menuOpen && (
        <div
          className="role-menu-overlay lg:hidden"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="role-menu-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--soft)]"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.15em] text-[var(--muted)]">
              {role} workspace
            </p>
            <nav className="grid grid-cols-2 gap-2">
              {nav.map(([label, path, Icon]) => (
                <NavLink
                  key={path}
                  to={`/${role}/${path}`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-14 items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${isActive ? "border-[#F5D5D9] bg-[var(--blush)] text-[var(--red)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"}`
                  }
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  <ChevronRight className="ml-auto" size={14} />
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] text-sm font-bold text-white"
            >
              <LogOut size={17} /> Log out
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
