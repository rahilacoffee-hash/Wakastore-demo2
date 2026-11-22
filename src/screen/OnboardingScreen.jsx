import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import WakastoreLogo from "../components/ui/WakastoreLogo";

const EASE = [0.22, 1, 0.36, 1];

const SLIDES = [
  {
    eyebrow: "Work smart not hard",
    lead: "Build Better,",
    accent: "Source Smarter.",
    body: "One marketplace for cement, steel, tiles, electricals and more, from merchants we approve.",
    note: "Simple requests. Clear next steps.",
    image: "/onboarding.png",
    pos: "78% 20%",
  },
  {
    eyebrow: "Trusted help, matched to you",
    lead: "One Material List.",
    accent: "Multiple Merchant Matching.",
    body: "Merchants that can supply at least 60% of your product lines qualify. Compare prices item by item.",
    note: "Local merchants. Verified profiles.",
    image: "/onboarding1.png",
    pos: "center 12%",
  },
  {
    eyebrow: "From request to resolved",
    lead: "Secure Your Delivery.",
    accent: "Secure Your Payment.",
    body: "One checkout, even across several merchants. Each merchant ships and updates separately.",
    note: "Updates at every step.",
    image: "/onboarding2.png",
    pos: "60% center",
  },
];

const LAST_INDEX = SLIDES.length - 1;

function parseSlide(param) {
  if (!/^\d+$/.test(param ?? "")) return 0;

  const parsed = Number(param);

  if (!Number.isFinite(parsed)) return 0;

  return Math.min(Math.max(parsed - 1, 0), LAST_INDEX);
}

/* Headline line, word-by-word reveal, wraps by word */
function RevealLine({
  text,
  delay = 0,
  reduce,
  accent = false,
  className = "",
}) {
  return (
    <span
      className={`flex flex-wrap justify-start gap-x-[0.24em] ${className}`}
    >
      {text
        .trim()
        .split(" ")
        .map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden pb-[0.14em] align-top"
          >
            <motion.span
              className={`inline-block ${
                accent ? "text-[#ed0018]" : "text-[#061744]"
              }`}
              initial={reduce ? false : { y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.65,
                ease: EASE,
                delay: delay + index * 0.07,
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
    </span>
  );
}

export default function Onboarding({ onFinish }) {
  const navigate = useNavigate();
  const { slide: slideParam } = useParams();

  const reduce = useReducedMotion();
  const touchStartX = useRef(null);

  const step = parseSlide(slideParam);
  const currentSlide = SLIDES[step];
  const isLast = step === LAST_INDEX;

  /* ---------- URL correction ---------- */

  useEffect(() => {
    const validSlide = String(step + 1);

    if (slideParam !== validSlide) {
      navigate(`/onboarding/${validSlide}`, { replace: true });
    }
  }, [navigate, slideParam, step]);

  /* ---------- Navigation ---------- */

  const finishOnboarding = useCallback(() => {
    onFinish?.();
    navigate("/path", { replace: true });
  }, [navigate, onFinish]);

  const goToStep = useCallback(
    (next) => {
      const bounded = Math.min(Math.max(next, 0), LAST_INDEX);
      navigate(`/onboarding/${bounded + 1}`, { replace: true });
    },
    [navigate],
  );

  const tick = useCallback(() => {
    if (typeof navigator !== "undefined") {
      navigator.vibrate?.(8);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (isLast) {
      finishOnboarding();
      return;
    }

    goToStep(step + 1);
  }, [finishOnboarding, goToStep, isLast, step]);

  const previousStep = useCallback(() => {
    if (step > 0) goToStep(step - 1);
  }, [goToStep, step]);

  /* ---------- Keyboard navigation ---------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
          event.target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowRight" && !isLast) {
        event.preventDefault();
        nextStep();
      }

      if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        previousStep();
      }

      if (event.key === "Escape") {
        finishOnboarding();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [finishOnboarding, isLast, nextStep, previousStep, step]);

  /* ---------- Touch navigation ---------- */

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX;

    if (endX === undefined) return;

    const delta = endX - touchStartX.current;

    if (Math.abs(delta) > 65) {
      tick();

      if (delta < 0) {
        nextStep();
      } else {
        previousStep();
      }
    }

    touchStartX.current = null;
  };

  /* ---------- Animation helpers ---------- */

  const fadeUp = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE, delay },
  });

  /* ---------- Render ---------- */

  return (
    <main
      className="relative flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden bg-[#061744] text-[#061744] lg:flex-row"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ---------- Photo ---------- */}
      <div className="relative h-[40dvh] shrink-0 overflow-hidden bg-[#061744] lg:h-full lg:w-[52%]">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentSlide.image}
            src={currentSlide.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: currentSlide.pos }}
            initial={{ opacity: 0, scale: reduce ? 1 : 1.07 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Navy tint */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#061744]/30"
        />

        {/* Top fade so logo and Skip always read */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#061744]/85 to-transparent"
        />

        {/* Header over photo */}
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-5 pt-[max(env(safe-area-inset-top),14px)] sm:px-8 sm:pt-6 lg:px-12 lg:pt-8">
          <div className="[&_img]:max-w-[124px] [&_img]:brightness-0 [&_img]:invert sm:[&_img]:max-w-[160px]">
            <WakastoreLogo />
          </div>

          {!isLast && (
            <button
              type="button"
              onClick={() => {
                tick();
                finishOnboarding();
              }}
              className="inline-flex h-9 items-center rounded-full border border-white/40 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Skip
            </button>
          )}
        </header>

        {/* Big outlined number on the photo (desktop) */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`num-${step}`}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 left-10 hidden select-none text-[clamp(8rem,16vw,15rem)] font-extrabold leading-none tracking-[-0.08em] text-transparent lg:block"
            style={{ WebkitTextStroke: "2px rgba(255,255,255,0.75)" }}
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            0{step + 1}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ---------- White sheet / panel ---------- */}
      <section className="relative z-10 -mt-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[30px] shadow-[0_-20px_50px_rgba(6,23,68,0.25)] lg:mt-0 lg:w-[48%] lg:flex-none lg:rounded-none lg:shadow-none">
        {/* ----- Decorative background layer ----- */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {/* Base gradient: white to soft red tint to soft navy tint */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(155deg, #ffffff 0%, #fff3f4 38%, #eef3ff 78%, #dfe8ff 100%)",
            }}
          />

          {/* Dot grid, fades out toward the bottom-left */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(rgba(6,23,68,0.16) 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
              maskImage:
                "radial-gradient(ellipse 85% 70% at 100% 0%, black, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 85% 70% at 100% 0%, black, transparent 75%)",
            }}
          />

          {/* Red glow, top right */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ed0018]/20 blur-[90px]" />

          {/* Navy glow, bottom left */}
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#1f4fd8]/20 blur-[100px]" />

          {/* Concentric rings, top right */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#ed0018]/25" />
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-[#ed0018]/20" />
          <div className="absolute right-6 top-6 h-16 w-16 rounded-full border border-[#061744]/10" />

          {/* Diagonal stripes, bottom right */}
          <div
            className="absolute -bottom-10 -right-10 h-56 w-56 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(237,0,24,0.18) 0 2px, transparent 2px 14px)",
              maskImage:
                "radial-gradient(circle at 100% 100%, black, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(circle at 100% 100%, black, transparent 70%)",
            }}
          />

          {/* Huge outlined number watermark */}
          <AnimatePresence mode="wait">
            <motion.span
              key={`wm-${step}`}
              className="absolute -bottom-6 right-2 select-none text-[clamp(9rem,40vw,13rem)] font-extrabold leading-none tracking-[-0.08em] text-transparent lg:-bottom-10 lg:right-6 lg:text-[clamp(12rem,18vw,18rem)]"
              style={{ WebkitTextStroke: "2px rgba(6,23,68,0.09)" }}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              0{step + 1}
            </motion.span>
          </AnimatePresence>

          {/* Red top accent bar (mobile) */}
          <span className="absolute inset-x-0 top-0 h-1 bg-[#ed0018] lg:hidden" />

          {/* Red vertical edge (desktop) */}
          <span className="absolute inset-y-0 left-0 hidden w-1 bg-gradient-to-b from-[#ed0018] via-[#ed0018]/40 to-transparent lg:block" />
        </div>

        {/* ----- Scrolling content ----- */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-6 sm:px-10 sm:pt-8 lg:justify-center lg:px-16 lg:py-10 xl:px-24">
          <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-between lg:flex-none lg:justify-start">
            <div>
              {/* Progress pills */}
              <div className="mb-4 flex items-center gap-2 sm:mb-6">
                {SLIDES.map((item, index) => (
                  <button
                    key={item.image}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={step === index ? "step" : undefined}
                    onClick={() => {
                      tick();
                      goToStep(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed0018] ${
                      step === index
                        ? "w-10 bg-[#ed0018]"
                        : "w-2 bg-[#061744]/20 hover:bg-[#061744]/40"
                    }`}
                  />
                ))}

                <span className="ml-2 text-[11px] font-bold tabular-nums tracking-[0.14em] text-[#061744]/50">
                  0{step + 1} / 0{SLIDES.length}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${step}`}
                  exit={
                    reduce
                      ? undefined
                      : { opacity: 0, transition: { duration: 0.15 } }
                  }
                >
                  {/* Eyebrow pill */}
                  <motion.p
                    className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ed0018]/25 bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ed0018] shadow-[0_4px_14px_rgba(237,0,24,0.08)] backdrop-blur-sm sm:mb-5 sm:text-xs"
                    {...fadeUp(0)}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ed0018]" />
                    {currentSlide.eyebrow}
                  </motion.p>

                  {/* Headline */}
                  <h1 className="flex flex-col items-start font-extrabold tracking-[-0.055em]">
                    <RevealLine
                      text={currentSlide.lead}
                      delay={0.08}
                      reduce={reduce}
                      className="mb-1 text-[clamp(3rem,8.6vw,3rem)] leading-[1.02] sm:mb-2 sm:text-[clamp(2.8rem,6vw,4.2rem)] lg:text-[clamp(3rem,4vw,4.8rem)]"
                    />

                    <RevealLine
                      text={currentSlide.accent}
                      delay={
                        0.08 + currentSlide.lead.trim().split(" ").length * 0.07
                      }
                      accent
                      reduce={reduce}
                      className="text-[clamp(2rem,6vw,2.1rem)] leading-[1.05] sm:text-[clamp(1.9rem,4vw,2.8rem)] lg:text-[clamp(2rem,2.8vw,3.2rem)]"
                    />
                  </h1>

                  {/* Description */}
                  <motion.p
                    className="mt-3 max-w-[46ch] text-sm leading-6 text-[#061744]/75 sm:mt-5 sm:text-base sm:leading-7"
                    {...fadeUp(0.35)}
                  >
                    {currentSlide.body}
                  </motion.p>

                  {/* Note card */}
                  <motion.div
                    className="mt-4 inline-flex items-center gap-2.5 rounded-2xl border border-[#061744]/10 bg-white/85 py-2 pl-2 pr-4 shadow-[0_8px_24px_rgba(6,23,68,0.08)] backdrop-blur-sm sm:mt-6 [@media(max-height:700px)]:hidden"
                    {...fadeUp(0.5)}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#ed0018] text-white">
                      <Check size={15} strokeWidth={3} />
                    </span>

                    <span className="text-xs font-bold text-[#061744] sm:text-sm">
                      {currentSlide.note}
                    </span>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="mt-5 sm:mt-8">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <motion.button
                    type="button"
                    aria-label="Previous slide"
                    onClick={() => {
                      tick();
                      previousStep();
                    }}
                    whileTap={reduce ? undefined : { scale: 0.95 }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#061744]/15 bg-white/80 text-[#061744] transition-colors duration-200 hover:border-[#061744] hover:bg-[#061744] hover:text-white sm:h-14 sm:w-14"
                  >
                    <ArrowLeft size={20} />
                  </motion.button>
                )}

                <motion.button
                  type="button"
                  onClick={() => {
                    tick();
                    nextStep();
                  }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="group flex h-12 min-w-0 flex-1 items-center justify-center gap-3 rounded-full bg-[#ed0018] px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(237,0,24,0.3)] transition-colors duration-200 hover:bg-[#c90015] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ed0018]/30 sm:h-14 sm:max-w-[320px] sm:px-9"
                >
                  <span>{isLast ? "Get started" : "Continue"}</span>

                  <ArrowRight
                    size={19}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </motion.button>
              </div>

              <p className="mt-5 hidden items-center gap-2 text-xs font-medium tracking-[0.04em] text-[#061744]/55 lg:flex">
                <ShieldCheck size={15} className="text-[#ed0018]" />
                Approved merchants. Secure payments.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}