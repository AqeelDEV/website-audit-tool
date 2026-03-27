/**
 * AI Analysis Orchestration Module
 *
 * Sends scraped page metrics to Google Gemini via OpenRouter's
 * OpenAI-compatible API. No special SDK needed — just fetch.
 * Every call is logged via the prompt logger for full AI transparency.
 * Includes retry logic with backoff for rate limits.
 */

import { v4 as uuidv4 } from "uuid";
import { PageMetrics, AIAnalysis, PromptLog } from "@/types";
import { savePromptLog } from "@/lib/logger";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "google/gemini-2.0-flash-001";
const LOG_MODEL_NAME = "google/gemini-2.0-flash-001 (via OpenRouter)";
const MAX_RETRIES = 2;
const MIN_RETRY_DELAY_MS = 4000;
const DEFAULT_RETRY_DELAY_S = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return apiKey;
}

function buildSystemPrompt(): string {
  return `You are a senior web strategist at a top-tier digital marketing agency. You audit webpages across four disciplines: SEO, conversion optimization, content clarity, and UX.

You will receive structured metrics extracted from a webpage plus a sample of the page's visible text content. Your job is to analyze these metrics and produce actionable insights.

CRITICAL RULES:
1. Every insight MUST reference specific metrics from the provided data. Do not make claims without citing the numbers.
2. Respond ONLY with valid JSON matching the exact schema below. No markdown, no backticks, no explanation outside the JSON.
3. Provide exactly 5 insights — one for each category: seo, messaging, cta, content_depth, ux.
4. Provide 3 to 5 prioritized recommendations.
5. Each recommendation's "reasoning" field must tie back to specific metrics from the data.

Response JSON schema:
{
  "insights": [
    {
      "category": "seo" | "messaging" | "cta" | "content_depth" | "ux",
      "title": "string",
      "analysis": "string (detailed analysis referencing specific metrics)",
      "severity": "good" | "warning" | "critical",
      "metricReferences": ["string (specific metric values cited)"]
    }
  ],
  "recommendations": [
    {
      "priority": number (1 = highest),
      "title": "string",
      "description": "string",
      "reasoning": "string (tied to specific metrics)",
      "impact": "high" | "medium" | "low"
    }
  ],
  "summary": "string (2-3 sentence overall assessment)"
}`;
}

/**
 * Builds a condensed user prompt with only metric counts (not full text arrays)
 * to minimize input tokens for free-tier TPM limits.
 */
function buildUserPrompt(metrics: PageMetrics): string {
  const condensed = {
    url: metrics.url,
    wordCount: metrics.wordCount,
    headings: {
      h1: { count: metrics.headings.h1.count, sample: metrics.headings.h1.texts.slice(0, 3) },
      h2: { count: metrics.headings.h2.count, sample: metrics.headings.h2.texts.slice(0, 3) },
      h3: { count: metrics.headings.h3.count, sample: metrics.headings.h3.texts.slice(0, 3) },
    },
    ctaCount: metrics.ctaCount,
    ctaSample: metrics.ctaTexts.slice(0, 5),
    links: metrics.links,
    images: metrics.images,
    meta: metrics.meta,
  };

  return `Audit this webpage. Metrics:

${JSON.stringify(condensed, null, 2)}

Page content (trimmed):

${metrics.pageText}

Respond with the JSON structure from your instructions.`;
}

/**
 * Strips markdown code fences from model output if present.
 */
function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Parses retry delay in seconds from a 429 error message.
 */
function parseRetryDelay(errorMessage: string): number {
  const match = errorMessage.match(/retry\s*(?:in|Delay['"]:?\s*['""]?)(\d+(?:\.\d+)?)\s*s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]));
  }
  return DEFAULT_RETRY_DELAY_S;
}

/**
 * Calls OpenRouter with retry logic for 429 rate limit errors.
 * Max 2 retries, with parsed or default delay between attempts.
 */
async function callOpenRouterWithRetry(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ rawOutput: string; inputTokens: number; outputTokens: number }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error?.message || JSON.stringify(data);
        throw new Error(`OpenRouter API error (${response.status}): ${errMsg}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`Empty response from OpenRouter. Full response: ${JSON.stringify(data).slice(0, 500)}`);
      }

      return {
        rawOutput: content,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      };
    } catch (error: unknown) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit = /429|quota|rate.?limit/i.test(message);

      if (!isRateLimit || attempt >= MAX_RETRIES) {
        throw error;
      }

      const parsedDelay = parseRetryDelay(message) * 1000;
      const delayMs = Math.max(parsedDelay, MIN_RETRY_DELAY_MS);
      console.log(`Retry attempt ${attempt + 1} after ${delayMs / 1000}s delay...`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Sends page metrics to Gemini (via OpenRouter) and returns structured audit analysis.
 * Logs the full prompt/response cycle for transparency.
 */
export async function analyzeWithAI(
  metrics: PageMetrics
): Promise<{ analysis: AIAnalysis; logId: string; log: PromptLog }> {
  const apiKey = getApiKey();
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(metrics);

  const { rawOutput, inputTokens, outputTokens } = await callOpenRouterWithRetry(
    apiKey,
    systemPrompt,
    userPrompt
  );

  const cleanedOutput = cleanJsonResponse(rawOutput);

  let analysis: AIAnalysis;
  try {
    analysis = JSON.parse(cleanedOutput) as AIAnalysis;
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw output: ${rawOutput.slice(0, 500)}`
    );
  }

  const logId = uuidv4();

  const log: PromptLog = {
    id: logId,
    timestamp: new Date().toISOString(),
    url: metrics.url,
    systemPrompt,
    userPrompt,
    structuredInput: {
      metrics,
      contentSample: metrics.pageText.slice(0, 2000),
    },
    rawModelOutput: rawOutput,
    parsedOutput: analysis,
    model: LOG_MODEL_NAME,
    tokenUsage: {
      input: inputTokens,
      output: outputTokens,
    },
  };

  await savePromptLog(log);

  return { analysis, logId, log };
}
