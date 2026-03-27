/**
 * POST /api/analyze
 *
 * Main audit endpoint. Accepts a URL, orchestrates:
 * 1. Scrape the webpage for metrics (lib/scraper)
 * 2. Send metrics to AI for analysis (lib/ai)
 * 3. Return the combined AuditResult to the client
 */

import { NextRequest, NextResponse } from "next/server";
import { scrapePageMetrics } from "@/lib/scraper";
import { analyzeWithAI } from "@/lib/ai";
import { AuditResult } from "@/types";

function isRateLimitError(message: string): boolean {
  return /429|quota|rate.?limit/i.test(message);
}

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { url } = body;
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'url' field in request body" },
      { status: 400 }
    );
  }

  try {
    const metrics = await scrapePageMetrics(url);
    const { analysis, logId, log } = await analyzeWithAI(metrics);

    const result: AuditResult = { metrics, analysis, logId, promptLog: log };
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Audit failed:", message);

    if (isRateLimitError(message)) {
      return NextResponse.json(
        {
          error: "API rate limit reached. Please wait a moment and try again, or use a different API key.",
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
