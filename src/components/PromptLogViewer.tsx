"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { PromptLog } from "@/types";
import { EASE } from "@/lib/animations";

interface PromptLogViewerProps {
  log: PromptLog;
}

const PRE_CLASSES =
  "max-h-64 overflow-y-auto overflow-x-auto rounded-lg border border-glass-border bg-black/5 p-3 text-xs leading-relaxed dark:bg-black/40";

export default function PromptLogViewer({ log }: PromptLogViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass rounded-xl">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl p-4 text-left text-sm font-medium transition-colors hover:bg-glass-strong"
      >
        <span>View Prompt Log (AI Transparency)</span>
        <m.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="h-4 w-4 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </m.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-glass-border p-4">
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-md border border-glass-border bg-glass-strong px-2 py-1 font-mono">
                  Model: {log.model}
                </span>
                <span className="rounded-md border border-glass-border bg-glass-strong px-2 py-1 font-mono">
                  Input tokens: {log.tokenUsage.input}
                </span>
                <span className="rounded-md border border-glass-border bg-glass-strong px-2 py-1 font-mono">
                  Output tokens: {log.tokenUsage.output}
                </span>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  System Prompt
                </h4>
                <pre className={PRE_CLASSES}>{log.systemPrompt}</pre>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  User Prompt
                </h4>
                <pre className={PRE_CLASSES}>{log.userPrompt}</pre>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Raw Model Output
                </h4>
                <pre className={PRE_CLASSES}>{log.rawModelOutput}</pre>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
