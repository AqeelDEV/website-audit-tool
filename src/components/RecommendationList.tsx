"use client";

import { Recommendation } from "@/types";

const impactStyles: Record<Recommendation["impact"], string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export default function RecommendationList({
  recommendations,
}: RecommendationListProps) {
  const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      {sorted.map((rec, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {rec.priority}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-semibold">{rec.title}</h3>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase ${impactStyles[rec.impact]}`}
              >
                {rec.impact} impact
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-2">
              {rec.description}
            </p>
            <p className="text-xs text-[var(--muted)] italic">
              {rec.reasoning}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
