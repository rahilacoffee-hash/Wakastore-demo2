import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoadingScreen() {
  const reduceMotion = useReducedMotion();

  const navigate = useNavigate();

   useEffect(() => {
      const timer = window.setTimeout(
        () => navigate("/onboarding/1", { replace: true }),
        750,
      );
      return () => window.clearTimeout(timer);
    }, [navigate]);


  return (
    <main
      className="loading-screen"
      role="status"
      aria-label="Loading wakastore"
    >
      <div className="loading-dots" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }
            }
            transition={{ duration: 1, repeat: Infinity, delay: dot * 0.16 }}
          />
        ))}
      </div>
    </main>
  );
}
