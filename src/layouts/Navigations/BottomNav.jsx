import { motion } from "framer-motion";
import { Compass, Home, PackageCheck, UserRound, WalletCards } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

let ITEMS = [
  { label: "Home", to: "/client/overview", icon: Home },
  { label: "Explore", to: "/client/explore", icon: Compass },
  { label: "Orders", to: "/client/orders", icon: PackageCheck },
  { label: "Wallet", to: "/client/wallet", icon: WalletCards },
  { label: "Account", to: "/client/account", icon: UserRound },
];

// Pages that have their own fixed bottom action bar (e.g. quantity / Add to cart /
// Buy now). The floating tab bar would sit on top of it, so it is hidden there.
const HIDE_ON = ["/client/product/"];

export default function BottomNav() {
  const { pathname } = useLocation();
  if (HIDE_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto mx-auto flex h-16 max-w-[460px] items-center justify-between rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] px-2 shadow-[0_12px_36px_rgba(23,23,23,.16)] backdrop-blur-xl">
        {ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} aria-label={label} className="flex h-12 items-center justify-center">
            {({ isActive }) => (
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={
                  "flex h-12 items-center justify-center gap-1.5 rounded-full " +
                  (isActive
                    ? "bg-[var(--red)] px-3.5 text-white shadow-[0_8px_20px_rgba(237,0,24,.3)]"
                    : "w-11 text-[var(--muted)]")
                }
              >
                <Icon size={21} />
                {isActive && <span className="text-sm font-bold">{label}</span>}
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
