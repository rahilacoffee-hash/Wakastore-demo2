import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ChevronRight,
  ClipboardList,
  HardHat,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";

const FLAG = "waka-onboarded";
const SLIDES = [
  {
    Icon: HardHat,
    t: "Build better, source smarter.",
    d: "One marketplace for cement, steel, tiles, electricals and more, from merchants we approve.",
  },
  {
    Icon: ClipboardList,
    t: "Paste your list. We do the matching.",
    d: "Merchants that can supply at least 60% of your product lines qualify. Compare prices item by item.",
  },
  {
    Icon: Truck,
    t: "Pay once. Track every delivery.",
    d: "One checkout, even across several merchants. Each merchant ships and updates separately.",
  },
];
const HOME = {
  customer: "/client/overview",
  merchant: "/merchant/overview",
  admin: "/admin/overview",
  "super-admin": "/admin/overview",
};

export default function Welcome() {
  const { state } = useAppState();
  const [seen, setSeen] = useState(() => localStorage.getItem(FLAG) === "1"),
    [i, setI] = useState(0);
  if (state.session)
    return <Navigate to={HOME[state.session.role] || "/login"} replace />;
  const done = () => {
    localStorage.setItem(FLAG, "1");
    setSeen(true);
  };

  
  const Choice = ({ to, Icon, t, d }) => (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 hover:border-[var(--red)]"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--blush)]">
        <Icon className="text-[var(--red)]" />
      </span>
      <span className="flex-1">
        <b className="block">{t}</b>
        <span className="text-sm text-[var(--muted)]">{d}</span>
      </span>
      <ChevronRight />
    </Link>
  );
  return (
    <div className="min-h-[100svh] bg-[var(--canvas)] text-[var(--ink)] md:grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img
          src="nboardingScreen1.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="flex min-h-[100svh] flex-col justify-center px-5 py-10 md:px-14">
        <div className="mx-auto w-full max-w-md">
          <img src="/logo.webp" alt="WakaStore" className="mb-8 h-10" />
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Welcome to WakaStore
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Nigeria's building-materials marketplace. How would you like to use
            it?
          </p>
          <div className="mt-8 space-y-3">
            <Choice
              to="/auth/customer"
              Icon={ShoppingBag}
              t="I'm buying materials"
              d="Browse, request quotations, compare merchants"
            />
            <Choice
              to="/auth/merchant"
              Icon={Store}
              t="I'm a merchant"
              d="Apply to sell, manage stock, fulfil orders"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)]">
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/login" className="font-semibold underline">
                Try a demo account
              </Link>
              <Link
                to="/admin/login"
                className="font-semibold text-[var(--red)] underline"
              >
                Admin portal
              </Link>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(FLAG);
                setSeen(false);
                setI(0);
              }}
              className="underline"
            >
              Replay intro
            </button>
          </div>
          <p className="mt-8 text-xs text-[var(--muted)]">
            Prototype. Payments, wallet and settlements are simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
