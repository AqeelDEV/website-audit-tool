"use client";

type Status = "good" | "warning" | "critical" | "neutral";

interface MetricsCardProps {
  label: string;
  value: string | number;
  detail?: string;
  status?: Status;
}

const statusStyles: Record<Status, string> = {
  good: "border-green-500/40 bg-green-50 dark:bg-green-950/20",
  warning: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20",
  critical: "border-red-500/40 bg-red-50 dark:bg-red-950/20",
  neutral: "border-[var(--border)] bg-[var(--card-bg)]",
};

const valueDot: Record<Status, string> = {
  good: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  neutral: "bg-gray-400",
};

export default function MetricsCard({
  label,
  value,
  detail,
  status = "neutral",
}: MetricsCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${statusStyles[status]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-block h-2 w-2 rounded-full ${valueDot[status]}`}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      {detail && (
        <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
      )}
    </div>
  );
}
