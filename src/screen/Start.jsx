import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";

const EASE = [0.22, 1, 0.36, 1];

const HOME = {
  customer: "/client/overview",
  merchant: "/merchant/overview",
  admin: "/admin/overview",
  "super-admin": "/super-admin/overview",
};

export default function Start() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  if (state.session) {
    return <Navigate to={HOME[state.session.role] || "/login"} replace />;
  }

  const fadeUp = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <main className="relative flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden bg-[#171717] text-white">
      {/* Background photo */}
      <img
        src="building-materials-yard.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(23,23,23,0.9) 0%, rgba(23,23,23,0.72) 50%, rgba(23,23,23,0.4) 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ed0018]/25 blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse at center, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black, transparent 80%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 pt-[max(env(safe-area-inset-top),14px)] sm:px-8 sm:pt-6 lg:px-14 lg:pt-8">
        <img
          src="/logo.webp"
          alt="WakaStore"
          className="h-15 w-auto brightness-0 invert sm:h-10"
        />

        <Link
          to="/onboarding/1"
          className="inline-flex h-9 items-center rounded-full border border-white/25 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b4e]"
        >
          Replay intro
        </Link>
      </header>

      {/* Centered content */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-5 py-6">
        <section className="mx-auto w-full max-w-md text-center">
          <motion.span
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-white backdrop-blur-md"
            {...fadeUp(0)}
          >
            <Sparkles size={14} className="text-[#ff6877]" />
            WELCOME TO WAKASTORE
          </motion.span>

          <motion.h1
            className="text-[clamp(3rem,9vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.05em]"
            {...fadeUp(0.1)}
          >
            Let's get you
            <span className="block text-[#ff3b4e]">started.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-[38ch] text-sm leading-6 text-white/75 sm:text-base sm:leading-7"
            {...fadeUp(0.2)}
          >
            Nigeria's building-materials marketplace. Create an account or
            sign in to pick up where you left off.
          </motion.p>

          {/* Actions */}
          <motion.div
            className="mt-8 flex flex-col gap-3"
            {...fadeUp(0.32)}
          >
            <motion.button
              type="button"
              onClick={() => navigate("/welcome?intent=signup")}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[#ed0018] px-6 text-sm font-bold text-white shadow-[0_12px_34px_rgba(237,0,24,0.4)] transition-colors hover:bg-[#ff1a30] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff3b4e]/40"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover:left-[110%] group-hover:opacity-100"
              />
              <UserPlus size={19} className="relative" />
              <span className="relative">Create an account</span>
              <ArrowRight
                size={19}
                className="relative transition-transform group-hover:translate-x-1"
              />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate("/welcome?intent=signin")}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              <LogIn size={19} />
              <span>I already have an account</span>
            </motion.button>
          </motion.div>

          <motion.div
            className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-white/70"
            {...fadeUp(0.42)}
          >
            <Link
              to="/login"
              className="underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Try a demo account
            </Link>

            <span aria-hidden="true" className="h-3 w-px bg-white/25" />

            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              <ShieldCheck size={14} />
              Admin portal
            </Link>
          </motion.div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 px-5 pb-[max(env(safe-area-inset-bottom),16px)] text-center text-[11px] text-white/50 sm:pb-6">
        Prototype. Payments, wallet and settlements are simulated.
      </footer>
    </main>
  );
}