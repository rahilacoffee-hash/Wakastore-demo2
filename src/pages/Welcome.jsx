import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Notebook,
  PlayCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";

const HOME = {
  customer: "/client/overview",
  merchant: "/merchant/overview",
  admin: "/admin/overview",
  "super-admin": "/super-admin/overview",
};

const PATHS = [
  {
    id: "customer",
    noun: "customer",
    title: "I'm buying materials",
    eyebrow: "FIND WHAT YOU NEED",
    description:
      "Browse building materials, request quotations, and compare merchants before you buy.",
    features: [
      "Browse materials from trusted merchants",
      "Request and compare quotations",
      "Track every order in one place",
    ],
    icon: Notebook,
    number: "01",
  },
  {
    id: "merchant",
    noun: "merchant",
    title: "I'm a merchant",
    eyebrow: "GROW YOUR BUSINESS",
    description:
      "Apply to sell, manage your inventory, and fulfil orders from customers across Nigeria.",
    features: [
      "Apply to become a seller",
      "Manage inventory and pricing",
      "Fulfil orders and get settled",
    ],
    icon: Store,
    number: "02",
  },
];

/*
  Where each choice goes. Sign up uses your existing routes.
  Sign in passes ?intent=signin so the auth page can show the sign-in form.
*/
const DESTINATIONS = {
  customer: {
    signup: "/auth/customer",
    signin: "/auth/customer?intent=signin",
  },
  merchant: {
    signup: "/auth/merchant",
    signin: "/auth/merchant?intent=signin",
  },
};

const LAST_INDEX = PATHS.length - 1;

const clampIndex = (value) => Math.min(Math.max(value, 0), LAST_INDEX);

function PathCard({ path, index, position, active, onSelect }) {
  const Icon = path.icon;

  const delta = position - index;
  const dist = Math.min(Math.abs(delta), 1);

  const style = {
    transform: `translateY(${10 * dist}px) rotate(${-3 * Math.max(-1, Math.min(1, delta))}deg) scale(${1 - 0.08 * dist})`,
    opacity: 1 - 0.58 * dist,
    zIndex: Math.round(100 - Math.abs(delta) * 100),
    left: "50%",
    marginLeft: "calc(var(--card) / -2)",
    width: "var(--card)",
    willChange: "transform, opacity",
  };

  return (
    <div
      className="relative shrink-0 snap-center self-stretch"
      style={{ width: "calc(var(--card) * 0.86)" }}
    >
      <article
        aria-roledescription="slide"
        aria-label={path.title}
        onClick={() => {
          if (!active) onSelect(index);
        }}
        style={style}
        className={`absolute inset-y-0 ${active ? "" : "cursor-pointer"}`}
      >
        <div
          className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border p-5 transition-colors duration-300 sm:rounded-[26px] sm:p-7 ${
            active
              ? "border-[#ED0018] bg-[#ED0018] shadow-[0_22px_55px_rgba(237,0,24,0.28)]"
              : "border-[#EAEAEA] bg-white shadow-[0_14px_38px_rgba(0,0,0,0.06)]"
          }`}
        >
          {active && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#B90013] via-[#FF6877] to-[#FFC2C9]"
            />
          )}

          <Icon
            aria-hidden="true"
            size={220}
            strokeWidth={1}
            className={`pointer-events-none absolute -bottom-10 -right-10 transition-colors duration-300 ${
              active ? "text-white/[0.10]" : "text-[#ED0018]/[0.06]"
            }`}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-[14px] transition-colors duration-300 sm:h-14 sm:w-14 ${
                active
                  ? "bg-white/20 text-white"
                  : "bg-[#FCEBED] text-[#ED0018]"
              }`}
            >
              <Icon size={25} strokeWidth={1.9} />
            </div>

            <span
              aria-hidden="true"
              className="select-none text-4xl font-medium leading-none tracking-[-0.06em] text-transparent sm:text-5xl"
              style={{
                WebkitTextStroke: active
                  ? "1px rgba(255,255,255,0.5)"
                  : "1px rgba(23,23,23,0.16)",
              }}
            >
              {path.number}
            </span>
          </div>

          <div className="relative mt-6 sm:mt-7">
            <p
              className={`text-[10px] font-bold tracking-[0.2em] sm:text-[11px] ${
                active ? "text-[#FFC2C9]" : "text-[#ED0018]"
              }`}
            >
              {path.eyebrow}
            </p>

            <h2
              className={`mt-2 text-[25px] font-bold leading-tight tracking-[-0.035em] sm:text-[29px] ${
                active ? "text-white" : "text-[#171717]"
              }`}
            >
              {path.title}
            </h2>

            <p
              className={`mt-3 max-w-[42ch] text-sm leading-6 sm:text-[15px] sm:leading-[1.7] [@media(max-height:600px)]:hidden ${
                active ? "text-white/80" : "text-[#777777]"
              }`}
            >
              {path.description}
            </p>
          </div>

          <ul className="relative mt-5 space-y-2.5 [@media(max-height:740px)]:hidden">
            {path.features.map((feature) => (
              <li
                key={feature}
                className={`flex items-center gap-3 text-sm font-medium ${
                  active ? "text-white/95" : "text-[#333333]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-[#FCEBED] text-[#ED0018]"
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="relative mt-auto flex items-center justify-between pt-5">
            <span
              className={`text-sm font-bold ${
                active ? "text-white" : "text-[#999999]"
              }`}
            >
              {active ? "Selected" : "Tap to choose"}
            </span>

            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                active
                  ? "border-white bg-white text-[#ED0018]"
                  : "border-[#171717]/20 text-transparent"
              }`}
            >
              <Check size={16} strokeWidth={3} />
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function Welcome() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const scrollRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);

  const intent =
    searchParams.get("intent") === "signin" ? "signin" : "signup";

  const active = clampIndex(Math.round(position));
  const selectedPath = PATHS[active];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const updatePosition = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const maxScroll = element.scrollWidth - element.clientWidth;
    const progress = maxScroll > 0 ? element.scrollLeft / maxScroll : 0;

    setPosition(Math.min(Math.max(progress, 0), 1) * LAST_INDEX);
  }, []);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  const scrollToIndex = useCallback(
    (index) => {
      const element = scrollRef.current;
      if (!element) return;

      const bounded = clampIndex(index);
      const maxScroll = element.scrollWidth - element.clientWidth;

      element.scrollTo({
        left: (bounded / LAST_INDEX) * maxScroll,
        behavior: reduce ? "auto" : "smooth",
      });
    },
    [reduce],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(event.target.tagName)
      ) {
        return;
      }

      if (event.key === "ArrowRight") scrollToIndex(active + 1);
      if (event.key === "ArrowLeft") scrollToIndex(active - 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, scrollToIndex]);

  if (state.session) {
    return <Navigate to={HOME[state.session.role] || "/login"} replace />;
  }

  const handleContinue = () =>
    navigate(DESTINATIONS[selectedPath.id][intent]);

  const ctaLabel =
    intent === "signin"
      ? `Sign in as a ${selectedPath.noun}`
      : `Continue as a ${selectedPath.noun}`;

  const fadeUp = (delay) =>
    reduce
      ? { className: "", style: undefined }
      : {
          className: `transition-all duration-500 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
          }`,
          style: { transitionDelay: `${delay}s` },
        };

  const f1 = fadeUp(0.05);
  const f2 = fadeUp(0.12);
  const f3 = fadeUp(0.2);
  const f4 = fadeUp(0.3);

  return (
    <main className="relative flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden bg-[#F3F1F1] text-[#171717] [--card:min(78vw,380px)] lg:[--card:min(30vw,480px)]">
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(237,0,24,0.10), transparent 68%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(23,23,23,0.09) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse at center, black, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black, transparent 85%)",
        }}
      />

      {/* Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1800px] shrink-0 items-center justify-between gap-4 px-5 pt-[max(env(safe-area-inset-top),14px)] sm:px-8 sm:pt-6 lg:px-14 lg:pt-8">
        <img
          src="/logo.webp"
          alt="WakaStore"
          className="h-8 w-auto sm:h-10"
        />

        <button
          type="button"
          onClick={() => navigate("/path")}
          className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#171717]/15 bg-white/70 px-4 text-sm font-semibold text-[#171717] transition-colors hover:border-[#ED0018]/40 hover:bg-[#FCEBED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED0018]"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back
        </button>
      </header>

      {/* Heading */}
      <section className="relative z-20 mx-auto w-full max-w-3xl shrink-0 px-5 pt-4 text-center sm:pt-8">
        <p
          style={f1.style}
          className={`mb-3 text-[10px] font-bold tracking-[0.2em] text-[#ED0018] sm:mb-4 sm:text-xs [@media(max-height:600px)]:hidden ${f1.className}`}
        >
          {intent === "signin" ? "WELCOME BACK" : "WELCOME TO WAKASTORE"}
        </p>

        <h1
          style={f2.style}
          className={`text-[clamp(1.8rem,min(8vw,5svh),2.8rem)] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#171717] sm:text-[clamp(2.2rem,5vw,3.4rem)] lg:text-[clamp(2.6rem,3.6vw,3.8rem)] ${f2.className}`}
        >
          How will you use <span className="text-[#ED0018]">WakaStore?</span>
        </h1>

        <p
          style={f3.style}
          className={`mx-auto mt-3 hidden max-w-xl text-sm leading-6 text-[#777777] sm:block sm:text-base sm:leading-7 [@media(max-height:760px)]:hidden ${f3.className}`}
        >
          {intent === "signin"
            ? "Pick the account you signed up with and we'll take you to sign in."
            : "Choose the option that best describes you and we'll take it from there."}
        </p>
      </section>

      {/* Card selection */}
      <div
        style={f4.style}
        className={`relative z-10 flex min-h-0 flex-1 ${f4.className}`}
      >
        <div
          ref={scrollRef}
          onScroll={updatePosition}
          tabIndex={0}
          role="group"
          aria-label="Choose how you will use WakaStore"
          className="flex min-h-0 w-full snap-x snap-mandatory items-stretch overflow-x-auto overflow-y-hidden py-5 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            paddingInline: "calc((100% - var(--card) * 0.86) / 2)",
          }}
        >
          {PATHS.map((path, index) => (
            <PathCard
              key={path.id}
              path={path}
              index={index}
              position={position}
              active={index === active}
              onSelect={scrollToIndex}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-20 mx-auto flex w-full max-w-md shrink-0 flex-col items-stretch gap-3 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 sm:pb-6">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous option"
            onClick={() => scrollToIndex(active - 1)}
            disabled={active === 0}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#171717]/15 bg-white/70 text-[#171717] transition-colors hover:bg-[#FCEBED] disabled:opacity-30 lg:flex"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Options"
          >
            {PATHS.map((path, index) => (
              <button
                key={path.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Show ${path.noun} option`}
                onClick={() => scrollToIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED0018] ${
                  index === active
                    ? "w-9 bg-[#ED0018]"
                    : "w-2.5 bg-[#171717]/20 hover:bg-[#171717]/35"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next option"
            onClick={() => scrollToIndex(active + 1)}
            disabled={active === LAST_INDEX}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#171717]/15 bg-white/70 text-[#171717] transition-colors hover:bg-[#FCEBED] disabled:opacity-30 lg:flex"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="group flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#ED0018] px-6 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,0,24,0.25)] transition-all hover:bg-[#B90013] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ED0018]/30 sm:h-14"
        >
          <span>{ctaLabel}</span>

          <ArrowRight
            size={19}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>

       

        <p className="text-center text-xs text-[#999999] lg:hidden [@media(max-height:700px)]:hidden">
          Swipe to switch
        </p>

        <p className="hidden text-center text-[11px] text-[#999999] [@media(min-height:800px)]:block">
          Prototype. Payments, wallet and settlements are simulated.
        </p>
      </div>
    </main>
  );
}