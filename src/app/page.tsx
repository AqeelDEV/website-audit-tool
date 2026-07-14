"use client";

import { useState, FormEvent, useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { AuditResult } from "@/types";
import MetricsCard from "@/components/MetricsCard";
import InsightCard from "@/components/InsightCard";
import RecommendationList from "@/components/RecommendationList";
import PromptLogViewer from "@/components/PromptLogViewer";
import AnalysisLoader from "@/components/AnalysisLoader";
import {
  fadeUp,
  staggerContainer,
  viewTransition,
  viewportOnce,
} from "@/lib/animations";

type LoadingPhase = "scraping" | "analyzing";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("scraping");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    setLoadingPhase("scraping");
    const timer = setTimeout(() => setLoadingPhase("analyzing"), 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      setResult(data as AuditResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const metrics = result?.metrics;

  const view = loading
    ? "loading"
    : error
      ? "error"
      : result
        ? "results"
        : "idle";

  const altStatus =
    metrics && metrics.images.total > 0
      ? metrics.images.missingAltPercent > 50
        ? "critical"
        : metrics.images.missingAltPercent > 20
          ? "warning"
          : "good"
      : "neutral" as const;

  const titleLenStatus =
    metrics
      ? metrics.meta.titleLength === 0
        ? "critical"
        : metrics.meta.titleLength > 60
          ? "warning"
          : "good"
      : "neutral" as const;

  const descLenStatus =
    metrics
      ? metrics.meta.descriptionLength === 0
        ? "critical"
        : metrics.meta.descriptionLength > 160
          ? "warning"
          : "good"
      : "neutral" as const;

  const h1Status =
    metrics
      ? metrics.headings.h1.count === 0
        ? "critical"
        : metrics.headings.h1.count > 1
          ? "warning"
          : "good"
      : "neutral" as const;

  const wordStatus =
    metrics
      ? metrics.wordCount < 300
        ? "warning"
        : "good"
      : "neutral" as const;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-pulse-glow absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 bg-radial-glow blur-3xl" />
          <div className="animate-pulse-glow absolute -right-40 -top-16 h-[28rem] w-[28rem] bg-radial-glow-cyan blur-3xl [animation-delay:2s]" />
        </div>

        <m.div
          variants={staggerContainer(0.12, 0)}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-4xl px-4 py-20 text-center"
        >
          <m.h1
            variants={fadeUp}
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Audit any website{" "}
            <span className="bg-accent-gradient bg-clip-text text-transparent">
              with AI
            </span>
          </m.h1>
          <m.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-muted">
            AI-powered page analysis for SEO, content, and UX, all grounded in
            real scraped metrics.
          </m.p>

          <m.form
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL (e.g. example.com)"
              className="glass h-12 flex-1 rounded-xl px-4 text-sm outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-muted/70 focus:border-accent-violet focus:shadow-glow-violet sm:max-w-md"
              disabled={loading}
            />
            <m.button
              type="submit"
              disabled={loading || !url.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="h-12 rounded-xl bg-accent-gradient px-7 text-sm font-medium text-white shadow-glow-violet transition-shadow duration-300 hover:shadow-glow-cyan disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Run Audit"}
            </m.button>
          </m.form>
        </m.div>
      </section>

      <main className="mx-auto min-h-[40vh] max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {view === "loading" && (
            <m.div key="loading" {...viewTransition}>
              <AnalysisLoader phase={loadingPhase} />
            </m.div>
          )}

          {/* Error */}
          {view === "error" && (
            <m.div
              key="error"
              {...viewTransition}
              className="glass rounded-xl border-[var(--status-critical-border)] p-5"
            >
              <p className="text-sm font-medium text-status-critical">
                {error}
              </p>
            </m.div>
          )}

          {/* Results */}
          {view === "results" && result && metrics && (
            <m.div key="results" {...viewTransition} className="space-y-12">
              <p className="text-sm text-muted">
                Results for{" "}
                <span className="font-medium text-foreground">
                  {metrics.url}
                </span>{" "}
                &middot; scraped {new Date(metrics.scrapedAt).toLocaleString()}
              </p>

              {/* Factual Metrics — visible on results mount, choreographed with view enter */}
              <section>
                <h2 className="font-display mb-4 text-xl font-bold">
                  Factual Metrics
                </h2>
                <m.div
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                >
                  <MetricsCard
                    label="Word Count"
                    value={metrics.wordCount}
                    status={wordStatus}
                    detail={metrics.wordCount < 300 ? "Thin content" : undefined}
                  />
                  <MetricsCard
                    label="H1 Tags"
                    value={metrics.headings.h1.count}
                    status={h1Status}
                    detail={
                      metrics.headings.h1.count === 1
                        ? metrics.headings.h1.texts[0]
                        : metrics.headings.h1.count === 0
                          ? "No H1 found"
                          : `${metrics.headings.h1.count} H1s (should be 1)`
                    }
                  />
                  <MetricsCard
                    label="H2 Tags"
                    value={metrics.headings.h2.count}
                  />
                  <MetricsCard
                    label="H3 Tags"
                    value={metrics.headings.h3.count}
                  />
                  <MetricsCard
                    label="CTAs Found"
                    value={metrics.ctaCount}
                    status={metrics.ctaCount === 0 ? "warning" : "good"}
                    detail={
                      metrics.ctaTexts.length > 0
                        ? metrics.ctaTexts.slice(0, 3).join(", ")
                        : "No CTAs detected"
                    }
                  />
                  <MetricsCard
                    label="Internal Links"
                    value={metrics.links.internal}
                  />
                  <MetricsCard
                    label="External Links"
                    value={metrics.links.external}
                  />
                  <MetricsCard
                    label="Images"
                    value={metrics.images.total}
                    status={altStatus}
                    detail={`${metrics.images.missingAlt} missing alt (${metrics.images.missingAltPercent}%)`}
                  />
                  <MetricsCard
                    label="Meta Title"
                    value={metrics.meta.titleLength}
                    suffix=" chars"
                    status={titleLenStatus}
                    detail={
                      metrics.meta.title
                        ? metrics.meta.title.slice(0, 60)
                        : "No title found"
                    }
                  />
                  <MetricsCard
                    label="Meta Description"
                    value={metrics.meta.descriptionLength}
                    suffix=" chars"
                    status={descLenStatus}
                    detail={
                      metrics.meta.description
                        ? metrics.meta.description.slice(0, 80) +
                          (metrics.meta.description.length > 80 ? "..." : "")
                        : "No description found"
                    }
                  />
                </m.div>
              </section>

              {/* AI Insights & Recommendations — scroll-revealed */}
              <m.section
                variants={staggerContainer(0.08)}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
              >
                <m.h2
                  variants={fadeUp}
                  className="font-display mb-2 text-xl font-bold"
                >
                  AI Insights & Recommendations
                </m.h2>
                <m.p variants={fadeUp} className="mb-6 text-sm text-muted">
                  {result.analysis.summary}
                </m.p>

                <m.h3 variants={fadeUp} className="mb-3 text-base font-medium">
                  Insights
                </m.h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.analysis.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>

                <m.h3
                  variants={fadeUp}
                  className="mb-3 mt-8 text-base font-medium"
                >
                  Recommendations
                </m.h3>
                <RecommendationList
                  recommendations={result.analysis.recommendations}
                />
              </m.section>

              {/* Prompt Log — scroll-revealed */}
              <m.section
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
              >
                <PromptLogViewer log={result.promptLog} />
              </m.section>
            </m.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
