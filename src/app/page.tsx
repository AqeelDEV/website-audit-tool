"use client";

import { useState, FormEvent, useEffect } from "react";
import { AuditResult } from "@/types";
import MetricsCard from "@/components/MetricsCard";
import InsightCard from "@/components/InsightCard";
import RecommendationList from "@/components/RecommendationList";
import PromptLogViewer from "@/components/PromptLogViewer";

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
      <header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Website Audit Tool
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            AI-powered page analysis for SEO, content, and UX
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL (e.g. example.com)"
              className="h-11 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:border-gray-500 dark:focus:ring-gray-500 sm:max-w-md"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="h-11 rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Run Audit"}
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-foreground" />
            <p className="mt-4 text-sm text-[var(--muted)]">
              {loadingPhase === "scraping"
                ? "Scraping page metrics..."
                : "Generating AI insights..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Results */}
        {result && metrics && !loading && (
          <div className="space-y-10">
            <p className="text-sm text-[var(--muted)]">
              Results for{" "}
              <span className="font-medium text-[var(--foreground)]">
                {metrics.url}
              </span>{" "}
              &middot; scraped {new Date(metrics.scrapedAt).toLocaleString()}
            </p>

            {/* Factual Metrics */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Factual Metrics</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <MetricsCard
                  label="Word Count"
                  value={metrics.wordCount.toLocaleString()}
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
                  value={`${metrics.meta.titleLength} chars`}
                  status={titleLenStatus}
                  detail={
                    metrics.meta.title
                      ? metrics.meta.title.slice(0, 60)
                      : "No title found"
                  }
                />
                <MetricsCard
                  label="Meta Description"
                  value={`${metrics.meta.descriptionLength} chars`}
                  status={descLenStatus}
                  detail={
                    metrics.meta.description
                      ? metrics.meta.description.slice(0, 80) +
                        (metrics.meta.description.length > 80 ? "..." : "")
                      : "No description found"
                  }
                />
              </div>
            </section>

            {/* AI Insights & Recommendations */}
            <section>
              <h2 className="text-xl font-semibold mb-2">
                AI Insights & Recommendations
              </h2>
              <p className="text-sm text-[var(--muted)] mb-4">
                {result.analysis.summary}
              </p>

              <h3 className="text-base font-medium mb-3">Insights</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.analysis.insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>

              <h3 className="text-base font-medium mt-6 mb-3">
                Recommendations
              </h3>
              <RecommendationList
                recommendations={result.analysis.recommendations}
              />
            </section>

            {/* Prompt Log */}
            <section>
              <PromptLogViewer log={result.promptLog} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
