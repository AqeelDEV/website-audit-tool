"use client";

import { m } from "motion/react";
import { AuditInsight } from "@/types";
import { fadeUp } from "@/lib/animations";

const categoryLabels: Record<AuditInsight["category"], string> = {
  seo: "SEO",
  messaging: "Messaging",
  cta: "CTA",
  content_depth: "Content Depth",
  ux: "UX",
};

const severityStyles: Record<
  AuditInsight["severity"],
  { badge: string; dot: string; text: string }
> = {
  good: {
    badge: "bg-[var(--status-good-bg)] text-status-good",
    dot: "bg-status-good shadow-[0_0_6px_var(--status-good)]",
    text: "Good",
  },
  warning: {
    badge: "bg-[var(--status-warning-bg)] text-status-warning",
    dot: "bg-status-warning shadow-[0_0_6px_var(--status-warning)]",
    text: "Warning",
  },
  critical: {
    badge: "bg-[var(--status-critical-bg)] text-status-critical",
    dot: "bg-status-critical shadow-[0_0_6px_var(--status-critical)]",
    text: "Critical",
  },
};

interface InsightCardProps {
  insight: AuditInsight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  const severity = severityStyles[insight.severity];

  return (
    <m.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="glass rounded-xl p-5 transition-shadow duration-300 hover:shadow-card-hover"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-[var(--accent-violet-soft)] bg-glass-strong px-2.5 py-0.5 text-xs font-medium text-accent-cyan">
          {categoryLabels[insight.category]}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${severity.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />
          {severity.text}
        </span>
      </div>
      <h3 className="mb-2 text-base font-semibold">{insight.title}</h3>
      <p className="text-sm leading-relaxed text-muted">{insight.analysis}</p>
      {insight.metricReferences.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {insight.metricReferences.map((ref, i) => (
            <span
              key={i}
              className="inline-block rounded border border-glass-border bg-glass-strong px-2 py-0.5 font-mono text-xs text-muted"
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </m.div>
  );
}
