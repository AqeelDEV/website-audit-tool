"use client";

import { useState } from "react";
import { PromptLog } from "@/types";

interface PromptLogViewerProps {
  logId: string;
}

export default function PromptLogViewer({ logId }: PromptLogViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [log, setLog] = useState<PromptLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (log) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/logs/${logId}`);
      if (!res.ok) throw new Error("Failed to load prompt log");
      const data: PromptLog = await res.json();
      setLog(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)]">
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between p-4 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-lg"
      >
        <span>View Prompt Log (AI Transparency)</span>
        <svg
          className={`h-4 w-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-[var(--border)] p-4 space-y-4">
          {loading && (
            <p className="text-sm text-[var(--muted)]">Loading prompt log...</p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {log && (
            <>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                <span>Model: {log.model}</span>
                <span>Input tokens: {log.tokenUsage.input}</span>
                <span>Output tokens: {log.tokenUsage.output}</span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                  System Prompt
                </h4>
                <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs leading-relaxed dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                  {log.systemPrompt}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                  User Prompt
                </h4>
                <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs leading-relaxed dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                  {log.userPrompt}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                  Raw Model Output
                </h4>
                <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs leading-relaxed dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                  {log.rawModelOutput}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
