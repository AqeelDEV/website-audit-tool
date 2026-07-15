"use client";

import { useEffect } from "react";
import { m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { fadeUp } from "@/lib/animations";

type Status = "good" | "warning" | "critical" | "neutral";

interface MetricsCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  detail?: string;
  status?: Status;
}

const statusBorder: Record<Status, string> = {
  good: "border-[var(--status-good-border)]",
  warning: "border-[var(--status-warning-border)]",
  critical: "border-[var(--status-critical-border)]",
  neutral: "",
};

const statusDot: Record<Status, string> = {
  good: "bg-status-good shadow-[0_0_8px_var(--status-good)]",
  warning: "bg-status-warning shadow-[0_0_8px_var(--status-warning)]",
  critical: "bg-status-critical shadow-[0_0_8px_var(--status-critical)]",
  neutral: "bg-muted",
};

function CountUpValue({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    // rAF count-up driving the motion value directly — avoids pulling
    // Motion's standalone animate() engine into the LazyMotion bundle
    const duration = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      mv.set(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced, mv]);

  return <m.span>{display}</m.span>;
}

export default function MetricsCard({
  label,
  value,
  suffix,
  detail,
  status = "neutral",
}: MetricsCardProps) {
  return (
    <m.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className={`glass rounded-xl p-4 transition-shadow duration-300 hover:shadow-card-hover ${statusBorder[status]}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${statusDot[status]}`}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
      </div>
      <p className="text-2xl font-semibold">
        {typeof value === "number" ? <CountUpValue value={value} /> : value}
        {suffix}
      </p>
      {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
    </m.div>
  );
}
