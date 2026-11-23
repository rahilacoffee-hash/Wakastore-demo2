import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import WakastoreLogo from "../components/ui/WakastoreLogo";
import HalftoneReveal from "../components/ui/HalftoneReveal";

const EASE = [0.22, 1, 0.36, 1];

const SLIDES = [
  {
    eyebrow: "Work smart not hard",
    lead: "Build Better,",
    accent: "Source Smarter.",
    body: "One marketplace for cement, steel, tiles, electricals and more, from merchants we approve.",
    note: "Simple requests. Clear next steps.",
    image: "/onboarding.png",
    posMobile: "78% 20%",
  },
  {
    eyebrow: "Trusted help, matched to you",
    lead: "One Material List.",
    accent: "Multiple Merchant Matching.",
    body: "Merchants that can supply at least 60% of your product lines qualify. Compare prices item by item.",
    note: "Local merchants. Verified profiles.",
    image: "/onboarding1.png",
    posMobile: "center 12%",
  },
  {
    eyebrow: "From request to resolved",
    lead: "Secure Your Delivery.",
    accent: "Secure Your Payment.",
    body: "One checkout, even across several merchants. Each merchant ships and updates separately.",
    note: "Updates at every step.",
    image: "/onboarding2.png",
    posMobile: "60% center",
  },
];

const LAST_INDEX = SLIDES.length - 1;

function parseSlide(param) {
  if (!/^\d+$/.test(param ?? "")) return 0;
  const parsed = Number(param);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed - 1, 0), LAST_INDEX);
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function detectWebGL2() {
  try {
    if (typeof document === "undefined") return false;
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/* One headline line, word-by-word reveal, centered */
function RevealLine({ text, delay = 0, reduce, accent = false }) {
  return (
    <span className="flex flex-wrap justify-center gap-x-[0.24em]">
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
                accent ? "text-[#ff3b4e]" : "text-white"
              }`}
              initial={reduce ? false : { y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.7,
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [canWebGL2] = useState(detectWebGL2);

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
    if (typeof navigator !== "undefined") navigator.vibrate?.(8);
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

      if (event.key === "Escape") finishOnboarding();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      if (delta < 0) nextStep();
      else previousStep();
    }

    touchStartX.current = null;
  };

  /* ---------- Animation helpers ---------- */

  const fadeUp = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  /* ---------- Render ---------- */

  return (
    <main
      className="relative h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-[#061744] text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background photography */}
      <div className="onboarding-background absolute inset-0 z-0 bg-[#061744]">
        {canWebGL2 ? (
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide.image}
              className="absolute inset-0"
              style={{ touchAction: "pan-y" }}
              initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduce ? 0 : 0.9,
                ease: "easeInOut",
              }}
            >
              <HalftoneReveal
                src={currentSlide.image}
                fit="cover"
                mode="duotone"
                shape="dot"
                cellSize={isDesktop ? 7 : 6}
                angle={45}
                inkColor="#7cc0ff"
                accentColor="#ed0018"
                paperColor="#e2a7ad"
                contrast={1.15}
                brightness={0.02}
                dotScale={1}
                revealRadius={isDesktop ? 150 : 100}
                softness={0.7}
                linger={1.2}
                reverse
                clickBurst
                intro={false}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          SLIDES.map((item, index) => (
            <img
              key={item.image}
              src={item.image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none lg:object-center ${
                index === step ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectPosition: item.posMobile }}
            />
          ))
        )}
      </div>

      {/* Centered navy overlay so the middle text always reads */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 65% at 50% 52%, rgba(4,18,55,0.9) 0%, rgba(4,18,55,0.74) 45%, rgba(4,18,55,0.32) 75%, rgba(4,18,55,0.12) 100%)",
        }}
      />

      {/* Top and bottom fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,18,55,0.75), transparent)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40"
        style={{
          background:
            "linear-gradient(0deg, rgba(4,18,55,0.75), transparent)",
        }}
      />

      {/* Red glow behind the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ed0018]/20 blur-[120px]"
      />

      {/* Big outlined slide number behind the content */}
      <AnimatePresence mode="wait">
        <motion.span
          key={`num-${step}`}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(14rem,70vw,22rem)] font-extrabold leading-none tracking-[-0.08em] text-transparent lg:text-[clamp(20rem,34vw,34rem)]"
          style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.09)" }}
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          0{step + 1}
        </motion.span>
      </AnimatePresence>

      {/* Main layout */}
      <div className="onboarding-fullscreen-layout pointer-events-none relative z-20 mx-auto flex h-full w-full max-w-[1800px] flex-col px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-[max(env(safe-area-inset-top),14px)] sm:px-8 sm:pb-5 sm:pt-4 lg:px-14 lg:pb-7 lg:pt-8">
        {/* Story-style progress */}
      

        {/* Header */}
        <header className="relative mt-2 flex shrink-0 items-center justify-between gap-4 sm:mt-4">
          <div className="[&_img]:max-w-[130px] [&_img]:brightness-0 [&_img]:invert sm:[&_img]:max-w-[165px]">
            <WakastoreLogo />
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={() => {
                tick();
                finishOnboarding();
              }}
              className="pointer-events-auto inline-flex h-9 items-center rounded-full border border-white/25 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b4e]"
            >
              Skip
            </button>
          ) : (
            <span className="h-9" />
          )}
        </header>

        {/* Centered content */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-4">
          <section className="onboarding-fullscreen-copy mx-auto w-full max-w-[760px] text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${step}`}
                exit={
                  reduce
                    ? undefined
                    : { opacity: 0, transition: { duration: 0.15 } }
                }
              >
                {/* Eyebrow chip */}
                <motion.div
                  className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-md sm:mb-6"
                  {...fadeUp(0)}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff3b4e] opacity-70 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3b4e]" />
                  </span>

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white sm:text-xs sm:tracking-[0.2em]">
                    {currentSlide.eyebrow}
                  </p>
                </motion.div>

                {/* Headline: lead on line one, accent on line two */}
                <h1 className="flex flex-col items-center text-center text-[clamp(2.9rem,min(9vw,6.2svh),3.2rem)] font-extrabold leading-[1.04] tracking-[-0.055em] text-white [text-shadow:0_2px_28px_rgba(4,18,55,.6)] sm:text-[clamp(2.6rem,6vw,4.4rem)] lg:text-[clamp(3.2rem,4.8vw,5.2rem)] lg:leading-[1]">
                  <RevealLine
                    text={currentSlide.lead}
                    delay={0.1}
                    reduce={reduce}
                  />

                  <RevealLine
                    text={currentSlide.accent}
                    delay={
                      0.1 + currentSlide.lead.trim().split(" ").length * 0.07
                    }
                    accent
                    reduce={reduce}
                  />
                </h1>

                {/* Description */}
                <motion.p
                  className="mx-auto mt-4 max-w-[48ch] text-sm leading-6 text-white/85 [text-shadow:0_1px_16px_rgba(4,18,55,.7)] sm:mt-6 sm:text-base sm:leading-8 lg:text-lg"
                  {...fadeUp(0.4)}
                >
                  {currentSlide.body}
                </motion.p>

                {/* Reassurance chip */}
                <motion.div
                  className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-1.5 pr-4 backdrop-blur-md sm:mt-7"
                  {...fadeUp(0.55)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ed0018] text-white">
                    <Check size={14} strokeWidth={2.8} />
                  </span>

                  <span className="text-xs font-semibold tracking-[0.01em] text-white/90 sm:text-sm">
                    {currentSlide.note}
                  </span>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="pointer-events-auto mt-7 flex items-center justify-center gap-3 sm:mt-9">
              {step > 0 && (
                <motion.button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => {
                    tick();
                    previousStep();
                  }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20 sm:h-14 sm:w-14"
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
                className="group relative flex h-12 min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden rounded-full bg-[#ed0018] px-6 text-sm font-bold text-white shadow-[0_12px_34px_rgba(237,0,24,0.4)] transition-colors duration-200 hover:bg-[#ff1a30] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff3b4e]/40 sm:h-14 sm:min-w-[240px] sm:max-w-[320px] sm:gap-4 sm:px-9"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover:left-[110%] group-hover:opacity-100"
                />

                <span className="relative">
                  {isLast ? "Get started" : "Continue"}
                </span>

                <ArrowRight
                  size={19}
                  className="relative transition-transform duration-200 group-hover:translate-x-1"
                />
              </motion.button>
            </div>

            <p className="mt-4 text-[11px] font-semibold tabular-nums tracking-[0.14em] text-white/60">
              0{step + 1} / 0{SLIDES.length}
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-auto hidden shrink-0 items-center justify-between gap-3 border-t border-white/15 pt-4 text-xs font-medium tracking-[0.06em] text-white/65 sm:flex">
          <span>WakaStore · Nigeria's building materials marketplace</span>

          <span className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-[#ff3b4e]" />
            Approved merchants. Secure payments.
          </span>
        </footer>
      </div>
    </main>
  );
}