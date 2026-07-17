import type { Variants } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const staggerContainer = (stagger = 0.07, delay = 0.1): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

// Spread onto AnimatePresence children for view switches (idle/loading/results)
export const viewTransition = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: EASE },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
} as const;

export const viewportOnce = { once: true, margin: "-64px 0px" } as const;
