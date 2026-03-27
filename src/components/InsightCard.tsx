"use client";

import { AuditInsight } from "@/types";

const categoryLabels: Record<AuditInsight["category"], string> = {
  seo: "SEO",
  messaging: "Messaging",
  cta: "CTA",
  content_depth: "Content Depth",
  ux: "UX",
};

const severityStyles: Record<AuditInsight["severity"], { bg: string; text: string; dot: string }> = {
  good: {
    bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    text: "Good",
    dot: "bg-green-500",
  },
  warning: {
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    text: "Warning",
    dot: "bg-amber-500",
  },
  critical: {
    bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    text: "Critical",
    dot: "bg-red-500",
  },
};

interface InsightCardProps {
  insight: AuditInsight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  const severity = severityStyles[insight.severity];

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {categoryLabels[insight.category]}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${severity.bg}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />
          {severity.text}
        </span>
      </div>
      <h3 className="text-base font-semibold mb-2">{insight.title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        {insight.analysis}
      </p>
      {insight.metricReferences.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {insight.metricReferences.map((ref, i) => (
            <span
              key={i}
              className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
