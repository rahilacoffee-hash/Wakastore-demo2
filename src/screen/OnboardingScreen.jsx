
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";


import WakastoreLogo from "../components/ui/WakastoreLogo";
import HalftoneReveal from "../components/ui/HalftoneReveal";

const EASE = [0.22, 1, 0.36, 1];

const SLIDES = [
  {
    eyebrow: "Work smart not hard",
    lead: "Build better,",
    accent: " source smarter.",
    body: "One marketplace for cement, steel, tiles, electricals and more, from merchants we approve.",
    note: "Simple requests. Clear next steps.",
    image: "/hero.webp",
    posMobile: "78% 20%",
  },
  {
    eyebrow: "Trusted help, matched to you",
    lead: "Paste your list.",
    accent: "We do the matching.",
    body: "Merchants that can supply at least 60% of your product lines qualify. Compare prices item by item.",
      note: "Local Merchant. Verified profiles.",
    image: "/onboardingScreen2.webp",
    posMobile: "center 12%",
  },
  {
    eyebrow: "From request to resolved",
    lead: "Pay once.",
    accent: "Track every delivery.",
    body: "One checkout, even across several merchants. Each merchant ships and updates separately.",
    note: "Updates at every step.",
    image: "/onboardingScreen3.webp",
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
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }

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

/* Clean headline reveal */
function RevealWords({ text, delay = 0, reduce, accent = false }) {
  return text.split(" ").map((word, index) => (
    <span
      key={`${word}-${index}`}
      className="inline-block overflow-hidden pb-[0.12em] align-top"
    >
      <motion.span
        className={`inline-block ${
          accent ? "text-[#ed0018]" : "text-white"
        }`}
        initial={reduce ? false : { y: "105%", opacity: 0 }}
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
  ));
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
      navigate(`/onboarding/${validSlide}`, {
        replace: true,
      });
    }
  }, [navigate, slideParam, step]);

  /* ---------- Navigation ---------- */

  const finishOnboarding = useCallback(() => {
    onFinish?.();

    navigate("/welcome", {
      replace: true,
    });
  }, [navigate, onFinish]);

  const goToStep = useCallback(
    (next) => {
      const bounded = Math.min(
        Math.max(next, 0),
        LAST_INDEX,
      );

      navigate(`/onboarding/${bounded + 1}`, {
        replace: true,
      });
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
    if (step > 0) {
      goToStep(step - 1);
    }
  }, [goToStep, step]);

  /* ---------- Keyboard navigation ---------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target instanceof HTMLElement &&
        (
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
          event.target.isContentEditable
        )
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
  }, [
    finishOnboarding,
    isLast,
    nextStep,
    previousStep,
    step,
  ]);

  /* ---------- Touch navigation ---------- */

  const handleTouchStart = (event) => {
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
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
    initial: reduce
      ? false
      : {
          opacity: 0,
          y: 14,
        },

    animate: {
      opacity: 1,
      y: 0,
    },

    transition: {
      duration: 0.55,
      ease: EASE,
      delay,
    },
  });

  /* ---------- Mobile: photo panel + bottom sheet (SmartFixer-style) ---------- */

  if (!isDesktop) {
    return (
      <main
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-[#171717]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative min-h-0 flex-[1.15] overflow-hidden rounded-b-[32px] bg-[#B90013]">
          {SLIDES.map((item, index) => (
            <img
              key={item.image}
              src={item.image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                index === step ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectPosition: item.posMobile }}
            />
          ))}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute left-5 top-[max(18px,env(safe-area-inset-top))] [&_img]:h-7 [&_img]:w-auto [&_img]:brightness-0 [&_img]:invert">
            <WakastoreLogo />
          </div>
          <button
            type="button"
            onClick={finishOnboarding}
            className="absolute right-4 top-[max(14px,env(safe-area-inset-top))] h-10 rounded-full bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur"
          >
            Skip
          </button>
        </div>

        <section className="shrink-0 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`m-${step}`}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ED0018]">
                {currentSlide.eyebrow}
              </p>
              <h1 className="mt-2 font-[Manrope] text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">
                {currentSlide.lead}
                <span className="text-[#ED0018]">{currentSlide.accent}</span>
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-[#55515A]">{currentSlide.body}</p>
              <div className="mt-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ED0018] text-white">
                  <Check size={14} strokeWidth={2.8} />
                </span>
                <span className="text-sm font-semibold text-[#171717]">{currentSlide.note}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex items-center gap-2">
            {SLIDES.map((item, index) => (
              <button
                key={item.image}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToStep(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === index ? "w-8 bg-[#ED0018]" : "w-3 bg-[#E9E6E7]"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={previousStep}
                className="h-14 shrink-0 rounded-full border border-[#E9E6E7] px-6 text-base font-semibold"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                tick();
                nextStep();
              }}
              className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#ED0018] text-base font-bold text-white shadow-[0_10px_24px_rgba(227,6,19,.28)]"
            >
              {isLast ? "Get started" : "Continue"}
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* ---------- Render ---------- */

  return (
    <main
      className="relative h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-[#061744] text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background photography */}

      <div className="onboarding-background absolute inset-0 z-0 bg-[#061744]">
        {canWebGL2 && isDesktop ? (
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide.image}
              className="absolute inset-0"
              style={{ touchAction: "pan-y" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduce ? 0 : 0.8,
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
                index === step
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              style={{
                objectPosition: item.posMobile,
              }}
            />
          ))
        )}
      </div>

      {/* Desktop image contrast */}

      <div
        className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
        style={{
          background:"linear-gradient(90deg, rgba(176, 131, 131, 0.8) 0%, rgba(233, 178, 178, 0.34) 32%, rgba(55, 4, 4, 0.03) 58%, rgba(55, 4, 4, 0) 100%)",
        }}
      />

      {/* Mobile image contrast */}

      <div
        className="pointer-events-none absolute inset-0 z-10 lg:hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(176, 131, 131, 0.8) 0%, rgba(233, 178, 178, 0.34) 32%, rgba(4, 18, 55, 0.03) 58%, rgba(4, 18, 55, 0) 100%)",
        }}
      />

      {/* Main layout */}

      <div className="onboarding-fullscreen-layout pointer-events-none relative z-20 mx-auto flex h-full w-full max-w-[1800px] flex-col px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-[max(env(safe-area-inset-top),14px)] sm:px-8 sm:pb-5 sm:pt-6 lg:px-14 lg:pb-7 lg:pt-8">

        {/* Header */}

        <header className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="[&_img]:max-w-[142px] [&_img]:brightness-0 [&_img]:invert sm:[&_img]:max-w-[165px]">
              <WakastoreLogo />
            </div>

            <span className="hidden h-7 w-px bg-white/25 sm:block" />

            <span className="hidden text-[10px] font-semibold tracking-[0.2em] text-white/65 sm:block">
              BUILDING MATERIALS, SIMPLIFIED
            </span>
          </div>

        
        </header>

        {/* Main content */}

        <div className="flex min-h-0 flex-1 items-end pt-4 lg:items-center lg:pb-10">
          <section className="onboarding-fullscreen-copy w-full max-w-[760px]">

            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${step}`}
                exit={
                  reduce
                    ? undefined
                    : {
                        opacity: 0,
                        transition: {
                          duration: 0.15,
                        },
                      }
                }
              >
                {/* Eyebrow */}

                <motion.div
                  className="mb-3 flex items-center gap-3 sm:mb-5"
                  {...fadeUp(0)}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#ed0018]" />

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f24052] sm:text-xs sm:tracking-[0.2em]">
                    {currentSlide.eyebrow}
                  </p>
                </motion.div>

                {/* Headline */}

                <h1 className="flex max-w-[14ch] flex-wrap gap-x-[0.24em] text-[clamp(2rem,min(9.5vw,6.4svh),3.6rem)] font-extrabold leading-[1.02] tracking-[-0.06em] text-white [text-shadow:0_2px_24px_rgba(4,18,55,.55)] sm:max-w-[13ch] sm:text-[clamp(2.6rem,7vw,4.6rem)] lg:text-[clamp(3.4rem,5.6vw,5.8rem)] lg:leading-[0.98]">
                  <RevealWords
                    text={currentSlide.lead}
                    delay={0.1}
                    reduce={reduce}
                  />

                  <RevealWords
                    text={currentSlide.accent}
                    delay={
                      0.1 +
                      currentSlide.lead.split(" ").length * 0.07
                    }
                    accent
                    reduce={reduce}
                  />
                </h1>

                {/* Description */}

                <motion.p
                  className="mt-3 max-w-[48ch] text-sm leading-6 text-white/90 [text-shadow:0_1px_16px_rgba(4,18,55,.7)] sm:mt-6 sm:text-base sm:leading-8 lg:text-lg"
                  {...fadeUp(0.4)}
                >
                  {currentSlide.body}
                </motion.p>

                {/* Reassurance message */}

                <motion.div
                  className="mt-5 flex items-center gap-2.5 sm:mt-7"
                  {...fadeUp(0.55)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ed0018] text-white">
                    <Check size={14} strokeWidth={2.8} />
                  </span>

                  <span className="text-xs font-semibold tracking-[0.01em] text-white/85 sm:text-sm">
                    {currentSlide.note}
                  </span>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Slide progress */}

            <div className="mt-7 flex items-center gap-2.5 sm:mt-9">
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
                  className={`pointer-events-auto h-1.5 rounded-full transition-all duration-300 ${
                    step === index
                      ? "w-10 bg-[#ed0018]"
                      : "w-5 bg-white/35 hover:bg-white/65"
                  }`}
                />
              ))}

              <span className="ml-2 text-[11px] font-semibold tabular-nums tracking-[0.12em] text-white/65">
                0{step + 1} / 0{SLIDES.length}
              </span>
            </div>

            {/* Navigation actions */}

            <div className="pointer-events-auto mt-5 flex items-center gap-3 sm:mt-8">

              <motion.button
                type="button"
                onClick={() => {
                  tick();
                  nextStep();
                }}
                whileTap={
                  reduce
                    ? undefined
                    : { scale: 0.98 }
                }
                className="group order-2 flex h-12 min-w-0 flex-1 items-center justify-center gap-3 rounded-full bg-[#ed0018] px-6 text-sm font-bold text-white shadow-[0_10px_30px_rgba(176, 131, 131, 0.8)] transition-colors duration-200 hover:bg-[#ed0018] sm:order-1 sm:h-14 sm:min-w-[230px] sm:flex-none sm:gap-4 sm:px-8"
              >
                <span>
                  {isLast ? "Get started" : "Continue"}
                </span>

                <ArrowRight
                  size={19}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </motion.button>

              {step > 0 && (
                <motion.button
                  type="button"
                  onClick={() => {
                    tick();
                    previousStep();
                  }}
                  whileTap={
                    reduce
                      ? undefined
                      : { scale: 0.98 }
                  }
                  className="order-1 h-12 shrink-0 rounded-full border border-white/35 bg-white/[0.06] px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/[0.14] sm:order-2 sm:h-14 sm:min-w-[145px] sm:px-9"
                >
                  Back
                </motion.button>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}

        <footer className="mt-auto hidden shrink-0 items-center justify-between gap-3 border-t border-white/15 pt-4 text-xs font-medium tracking-[0.06em] text-white/65 sm:flex">
          <span>
            WakaStores · Building materials made simple
          </span>

          <span className="flex items-center gap-2">
            <ShieldCheck
              size={15}
              className="text-[#ed0018]"
            />

            Built around your peace of mind
          </span>
        </footer>
      </div>
    </main>
  );
}
