/**
 * Webpage Metric Extraction Module
 *
 * Uses cheerio for static HTML parsing rather than puppeteer/playwright because:
 * - Lightweight: no headless browser process, minimal memory footprint
 * - Fast: parses raw HTML strings without rendering overhead
 * - Sufficient: marketing pages are typically server-rendered, so static
 *   HTML contains the content we need for audit metrics
 * - Serverless-friendly: no binary dependencies, works in edge/serverless environments
 *
 * This module extracts FACTUAL metrics only — no AI, no opinions, pure data.
 */

import * as cheerio from "cheerio";
import { PageMetrics } from "@/types";

const CTA_PATTERNS = [
  "get started",
  "sign up",
  "buy",
  "try",
  "contact",
  "schedule",
  "book",
  "download",
  "subscribe",
  "learn more",
  "start",
  "request",
  "join",
];

const EXCLUDED_TEXT_TAGS = new Set(["script", "style", "noscript", "svg"]);

const MAX_PAGE_TEXT_LENGTH = 4000;

/**
 * Strips heavy/non-content tags from raw HTML before cheerio parsing.
 * Removes <script>, <style>, <svg>, <noscript>, and <img> tags and their
 * contents to reduce memory usage and keep text extraction clean.
 */
function preprocessHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<img\b[^>]*\/?>/gi, "");
}

/**
 * Normalizes a URL by prepending https:// if no protocol is present.
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Fetches HTML content from a URL with a 30-second timeout.
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  console.log(`Fetching URL: ${url}...`);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "WebsiteAuditTool/1.0 (compatible; audit bot; +https://github.com/website-audit-tool)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }

    return await response.text();
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after 30s for ${url}`);
    }
    if (error instanceof TypeError && (error.message.includes("fetch") || error.message.includes("network"))) {
      throw new Error(`Failed to fetch ${url}: network error or invalid URL`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extracts visible text from the page, excluding script/style/noscript/svg content.
 * Strips excessive whitespace and trims to MAX_PAGE_TEXT_LENGTH.
 */
function extractPageText($: cheerio.CheerioAPI): string {
  const cloned = $.root().clone();

  cloned.find(Array.from(EXCLUDED_TEXT_TAGS).join(", ")).remove();

  const rawText = cloned.text();
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  return cleaned.slice(0, MAX_PAGE_TEXT_LENGTH);
}

/**
 * Counts words in visible page text.
 */
function countWords(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Extracts heading counts and texts for h1, h2, h3.
 */
function extractHeadings($: cheerio.CheerioAPI) {
  const extract = (tag: string) => {
    const texts: string[] = [];
    $(tag).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    });
    return { count: texts.length, texts };
  };

  return {
    h1: extract("h1"),
    h2: extract("h2"),
    h3: extract("h3"),
  };
}

/**
 * Identifies CTA elements: buttons, submit inputs, and links with action-oriented text.
 * Returns deduplicated CTA texts.
 */
function extractCTAs($: cheerio.CheerioAPI): { ctaCount: number; ctaTexts: string[] } {
  const ctaSet = new Set<string>();

  // All <button> elements
  $("button").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) ctaSet.add(text);
  });

  // <a> with role="button"
  $('a[role="button"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) ctaSet.add(text);
  });

  // <input type="submit">
  $('input[type="submit"]').each((_, el) => {
    const value = $(el).attr("value")?.trim();
    if (value) ctaSet.add(value);
  });

  // <a> tags whose text matches CTA action words
  $("a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    const lower = text.toLowerCase();
    for (const pattern of CTA_PATTERNS) {
      if (lower.includes(pattern)) {
        ctaSet.add(text);
        break;
      }
    }
  });

  const ctaTexts = Array.from(ctaSet);
  return { ctaCount: ctaTexts.length, ctaTexts };
}

/**
 * Classifies links as internal or external relative to the base URL domain.
 * Ignores mailto:, tel:, javascript:, and anchor-only (#) links.
 */
function extractLinks($: cheerio.CheerioAPI, baseUrl: string): { internal: number; external: number } {
  let internal = 0;
  let external = 0;

  let baseDomain: string;
  try {
    baseDomain = new URL(baseUrl).hostname;
  } catch {
    return { internal: 0, external: 0 };
  }

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;

    // Skip non-navigational links
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:") ||
      href === "#" ||
      (href.startsWith("#") && !href.startsWith("#/"))
    ) {
      return;
    }

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === baseDomain) {
        internal++;
      } else {
        external++;
      }
    } catch {
      // Malformed URL — skip
    }
  });

  return { internal, external };
}

/**
 * Extracts image metrics: total count, missing alt count, and percentage.
 */
function extractImages($: cheerio.CheerioAPI) {
  const imgs = $("img");
  const total = imgs.length;
  let missingAlt = 0;

  imgs.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") {
      missingAlt++;
    }
  });

  return {
    total,
    missingAlt,
    missingAltPercent: total > 0 ? Math.round((missingAlt / total) * 100) : 0,
  };
}

/**
 * Extracts meta title and description from standard and Open Graph tags.
 */
function extractMeta($: cheerio.CheerioAPI) {
  const title =
    $("title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  return {
    title,
    description,
    titleLength: title.length,
    descriptionLength: description.length,
  };
}

/**
 * Scrapes a webpage and extracts structured metrics for audit analysis.
 * @param url - The URL of the webpage to scrape
 * @returns Extracted page metrics
 */
export async function scrapePageMetrics(url: string): Promise<PageMetrics> {
  const normalizedUrl = normalizeUrl(url);
  const rawHtml = await fetchHtml(normalizedUrl);

  // Parse the full HTML for structured element extraction (headings, CTAs, links, images, meta)
  const $full = cheerio.load(rawHtml);

  // Parse preprocessed HTML (heavy tags stripped) for clean text extraction
  const $clean = cheerio.load(preprocessHtml(rawHtml));
  const pageText = extractPageText($clean);

  return {
    url: normalizedUrl,
    scrapedAt: new Date().toISOString(),
    wordCount: countWords(pageText),
    headings: extractHeadings($full),
    ...extractCTAs($full),
    links: extractLinks($full, normalizedUrl),
    images: extractImages($full),
    meta: extractMeta($full),
    pageText,
  };
}
