
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";

const FLAG = "waka-onboarded";

const HOME = {
  customer: "/client/overview",
  merchant: "/merchant/overview",
  admin: "/admin/overview",
  "super-admin": "/super-admin/overview",
};

export default function Welcome() {
  const { state } = useAppState();

  const [seen, setSeen] = useState(
    () => localStorage.getItem(FLAG) === "1",
  );

  const [i, setI] = useState(0);

  if (state.session) {
    return (
      <Navigate
        to={HOME[state.session.role] || "/login"}
        replace
      />
    );
  }

  const done = () => {
    localStorage.setItem(FLAG, "1");
    setSeen(true);
  };

  const replay = () => {
    localStorage.removeItem(FLAG);
    setSeen(false);
    setI(0);
  };

  const Choice = ({ to, Icon, title, description, label }) => (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-[#EAEAEA] bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#ED0018]/40 hover:shadow-[0_12px_35px_rgba(237,0,24,0.08)] sm:gap-4 sm:p-5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FCEBED] text-[#ED0018] transition-colors duration-300 group-hover:bg-[#ED0018] group-hover:text-white sm:h-14 sm:w-14 sm:rounded-2xl">
        <Icon size={22} strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold tracking-tight text-[#171717] sm:text-[17px]">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#777777] sm:text-sm sm:leading-6">
          {description}
        </span>

        <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#ED0018] sm:mt-3 sm:text-sm">
          {label}
          <ArrowRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-[#BDBDBD] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#ED0018]"
      />
    </Link>
  );

  return (
    <main className="h-[100svh] min-h-0 overflow-hidden bg-[#F3F1F1] p-0 text-[#171717] sm:p-5 lg:p-8">
      <div className="mx-auto grid h-full w-full max-w-7xl overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-[28px] sm:border sm:border-[#EAEAEA] sm:shadow-[0_20px_70px_rgba(0,0,0,0.06)] lg:grid-cols-[1.02fr_0.98fr]">

        {/* Visual panel */}
        <section className="relative hidden overflow-hidden bg-[#171717] lg:flex lg:flex-col lg:justify-between">
          <img
            src="/onboardingScreen1.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/85" />

          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#ED0018]/25 blur-3xl" />

          <div className="relative z-10 p-10 xl:p-14">
            <img
              src="/logo.webp"
              alt="WakaStore"
              className="h-11 w-auto brightness-0 invert"
            />
          </div>

          <div className="relative z-10 max-w-xl p-10 pb-14 xl:p-14 xl:pb-16">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
              <Sparkles size={14} className="text-[#FF6877]" />
              NIGERIA'S BUILDING MATERIALS MARKETPLACE
            </span>

            <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-5xl">
              Everything you need
              <span className="block text-[#FF6877]">
                to build better.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
              Discover building materials, connect with trusted merchants,
              request quotations, and make smarter purchasing decisions.
            </p>

            <div className="mt-9 flex items-center gap-3 text-sm font-medium text-white/80">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                <ShieldCheck size={18} />
              </span>
              A smarter way to source building materials.
            </div>
          </div>
        </section>

        {/* Welcome panel */}
        <section className="flex h-full min-h-0 flex-col justify-center overflow-hidden px-4 py-3 sm:px-9 sm:py-8 lg:px-12 xl:px-16">
          <div className="mx-auto flex w-full max-w-lg flex-col">

            <div className="mb-5 lg:hidden">
              <img
                src="/logo.webp"
                alt="WakaStore"
                className="h-8 w-auto"
              />
            </div>

            <div className="mb-5 sm:mb-8">
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#FCEBED] px-3 py-1.5 text-[13px] font-bold text-[#ED0018] sm:mb-4 sm:px-3.5 sm:py-2 sm:text-xs">
                <Sparkles size={13} />
                Welcome To WakaStore
              </span>

              <h1 className="text-[36px] font-extrabold leading-tight tracking-tight text-[#171717] sm:text-4xl">
                Let's get you
                <span className="text-[#ED0018]"> started...</span>
              </h1>

              <p className="mt-2 max-w-md text-xs leading-5 text-[#777777] sm:mt-3 sm:text-base sm:leading-7">
                Nigeria's building-materials marketplace. How would you
                like to use WakaStore?
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Choice
                to="/auth/customer"
                Icon={ShoppingBag}
                title="I'm buying materials"
                description="Browse materials, request quotations, and compare merchants."
                label="Continue as a customer"
              />

              <Choice
                to="/auth/merchant"
                Icon={Store}
                title="I'm a merchant"
                description="Apply to sell, manage your inventory, and fulfil orders."
                label="Continue as a merchant"
              />
            </div>

            <div className="my-5 flex items-center gap-3 sm:my-8 sm:gap-4">
              <div className="h-px flex-1 bg-[#EAEAEA]" />

              <span className="text-[10px] font-medium text-[#999999] sm:text-xs">
                OTHER OPTIONS
              </span>

              <div className="h-px flex-1 bg-[#EAEAEA]" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
              <Link
                to="/login"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#EAEAEA] px-2 py-2.5 text-xs font-semibold text-[#333333] transition-colors hover:border-[#ED0018]/40 hover:bg-[#FCEBED]/50 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
              >
                Try a demo account
                <ArrowRight size={13} />
              </Link>

              <Link
                to="/admin/login"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#fff] px-2 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#333333] sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
              >
                <ShieldCheck size={15} />
                Admin portal
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEEEEE] pt-3 sm:mt-8 sm:pt-6">
              <p className="text-[10px] leading-4 text-[#999999] sm:text-xs sm:leading-5">
                Prototype. Payments, wallet and settlements are simulated.
              </p>

              <Link
              to="/onboarding/1"
                type="button"
                className="shrink-0 text-[10px] font-semibold text-[#ED0018] underline-offset-4 transition-colors hover:text-[#B90013] hover:underline sm:text-xs"
              >
                Replay intro
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
