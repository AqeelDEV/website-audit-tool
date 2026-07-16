"use client";

import { m } from "motion/react";
import { Recommendation } from "@/types";
import { fadeUp, staggerContainer } from "@/lib/animations";

const impactStyles: Record<Recommendation["impact"], string> = {
  high: "bg-[var(--status-critical-bg)] text-status-critical",
  medium: "bg-[var(--status-warning-bg)] text-status-warning",
  low: "bg-[var(--glow-cyan)] text-accent-cyan",
};

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export default function RecommendationList({
  recommendations,
}: RecommendationListProps) {
  const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <m.div variants={staggerContainer(0.1)} className="space-y-4">
      {sorted.map((rec, i) => (
        <m.div
          key={i}
          variants={fadeUp}
          whileHover={{ x: 4 }}
          className="glass flex gap-4 rounded-xl p-5 transition-shadow duration-300 hover:shadow-card-hover"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-sm font-bold text-white shadow-glow-violet">
            {rec.priority}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{rec.title}</h3>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase ${impactStyles[rec.impact]}`}
              >
                {rec.impact} impact
              </span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-muted">
              {rec.description}
            </p>
            <p className="text-xs italic text-muted">{rec.reasoning}</p>
          </div>
        </m.div>
      ))}
    </m.div>
  );
}
