"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";

type LoadingPhase = "scraping" | "analyzing";

const PHASE_TEXT: Record<LoadingPhase, string> = {
  scraping: "Scraping page metrics...",
  analyzing: "Generating AI insights...",
};

export default function AnalysisLoader({ phase }: { phase: LoadingPhase }) {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative h-20 w-20">
        {/* Static base ring */}
        <div className="absolute inset-0 rounded-full border border-glass-border" />

        {reduced ? (
          <m.span
            className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-gradient shadow-glow-violet"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <>
            {/* Pulsing gradient core */}
            <m.span
              className="absolute left-1/2 top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full bg-accent-gradient shadow-glow-violet"
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Outer orbit — violet satellite */}
            <m.span
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-violet shadow-glow-violet" />
            </m.span>
            {/* Inner orbit — cyan satellite, counter-rotating */}
            <m.span
              className="absolute inset-3"
              animate={{ rotate: -360 }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan shadow-glow-cyan" />
            </m.span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.p
          key={phase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6 text-sm text-muted"
        >
          {PHASE_TEXT[phase]}
        </m.p>
      </AnimatePresence>
    </div>
  );
}
