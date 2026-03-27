![CI](https://github.com/AqeelDEV/website-audit-tool/actions/workflows/ci.yml/badge.svg)

# Website Audit Tool

An AI-powered webpage auditing tool that extracts factual metrics from any URL and uses AI to generate structured, metric-grounded insights and recommendations.

**Live demo:** https://website-audit-tool-theta.vercel.app/

---

## What It Does

1. Accepts a single URL
2. Scrapes the page and extracts factual metrics (word count, headings, CTAs, links, images, meta tags)
3. Sends those metrics to an AI model with a structured prompt
4. Returns 5 category insights + prioritized recommendations + an overall summary
5. Exposes the full prompt log (system prompt, user prompt, raw model output, token usage) for transparency

---

## Quick Start

```bash
git clone https://github.com/AqeelDEV/website-audit-tool.git
cd website-audit-tool
npm install
```

Create a `.env.local` file:

```
OPENROUTER_API_KEY=your_key_here
```

Get a free key at [openrouter.ai](https://openrouter.ai). The app uses `google/gemini-2.0-flash-001` via OpenRouter.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter any URL, and click **Audit**.

---

## Architecture Overview

```
User enters URL
      │
      ▼
POST /api/analyze
      │
      ├─► lib/scraper  ──► Fetches HTML, strips noise, extracts PageMetrics
      │
      └─► lib/ai       ──► Builds prompts, calls OpenRouter, parses JSON response
                │
                └─► lib/logger ──► Saves PromptLog (file locally, memory on Vercel)
      │
      ▼
AuditResult { metrics, analysis, promptLog } returned to client
```

**Key separation of concerns:**

- `lib/scraper/` — pure data extraction, no AI. Returns a typed `PageMetrics` object.
- `lib/ai/` — pure AI orchestration. Takes `PageMetrics`, returns `AIAnalysis` + `PromptLog`. No scraping logic.
- `lib/logger/` — persistence layer. Swaps between file storage (local) and in-memory (Vercel) based on environment.
- API routes are thin — they only wire the layers together.
- UI components are purely presentational — they render what the API returns.

---

## AI Design Decisions

### Structured input, not raw HTML

The AI never sees raw HTML. The scraper extracts a typed `PageMetrics` object, and the prompt serializes it as clean JSON. This keeps the prompt focused, reproducible, and cost-efficient — Gemini Flash processes ~1,200 input tokens per audit instead of thousands for full HTML.

### Constrained output schema

The system prompt requires the model to return **only valid JSON** matching an exact schema — no markdown, no prose, no backticks. The schema enforces:
- Exactly 5 insights, one per category (`seo`, `messaging`, `cta`, `content_depth`, `ux`)
- Each insight must cite specific metric values in `metricReferences`
- Each recommendation must include `reasoning` tied to the data
- Severity and impact are enums, not free text

This makes the output directly renderable without fragile parsing.

### Metric-grounded prompting

The system prompt has an explicit rule: *"Every insight MUST reference specific metrics from the provided data. Do not make claims without citing the numbers."* This prevents generic AI output like "improve your SEO" and forces responses like "93% of images (28/30) are missing alt text — critical for SEO."

### Model choice

`google/gemini-2.0-flash-001` via OpenRouter — fast, cheap, and follows JSON schema instructions reliably. Flash is appropriate here because the task is structured extraction, not open-ended reasoning.

### Retry with backoff

The AI call layer implements exponential backoff for 429 rate limit errors (up to 3 retries), so transient rate limits don't surface as user-facing errors.

---

## Trade-offs

| Decision | Trade-off |
|---|---|
| Static HTML scraping (Cheerio) | Fast and zero-cost, but misses JS-rendered content. Sites built entirely in React/Vue may show low word counts or missing elements. |
| In-memory log storage on Vercel | Simple — no database needed for a demo. But logs reset on cold starts and are not shared across serverless instances. |
| Single-page analysis only | Keeps scope focused and responses fast. A multi-page crawl would require a queue, async processing, and significantly more complexity. |
| Serializing metrics as JSON in the user prompt | Deterministic and easy to verify. Alternatively, a function-calling schema could be used, but adds SDK complexity with no benefit here. |
| OpenRouter instead of direct Gemini API | Adds one hop but provides a single key for multiple model providers, making it easy to swap models without changing code. |

---

## What I'd Improve With More Time

- **JS rendering** — Use Playwright or Puppeteer for a headless browser pass, so JS-rendered pages (SPAs) produce accurate metrics
- **Persistent log storage** — Replace the in-memory Vercel fallback with Vercel KV or a lightweight database so logs survive cold starts and can be listed/reviewed
- **Audit history** — Store past audits by URL with a comparison view to track improvements over time
- **Confidence indicators** — Flag when the scraper likely missed content (e.g., word count under 100) so the AI insight is contextualized accordingly
- **Export** — PDF or JSON export of the full audit report

---

## Prompt Log Sample

Below is a real prompt log from auditing `eight25media.com`.

### System Prompt

```
You are a senior web strategist at a top-tier digital marketing agency. You audit webpages
across four disciplines: SEO, conversion optimization, content clarity, and UX.

You will receive structured metrics extracted from a webpage plus a sample of the page's
visible text content. Your job is to analyze these metrics and produce actionable insights.

CRITICAL RULES:
1. Every insight MUST reference specific metrics from the provided data. Do not make claims
   without citing the numbers.
2. Respond ONLY with valid JSON matching the exact schema below. No markdown, no backticks,
   no explanation outside the JSON.
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
}
```

### Structured Input (User Prompt)

```json
{
  "url": "https://eight25media.com",
  "wordCount": 360,
  "headings": {
    "h1": { "count": 1, "sample": ["Digital experiencesfor the modern enterprise"] },
    "h2": { "count": 5, "sample": ["The world's best companies", "choose to work with eight25", "Insights"] },
    "h3": { "count": 10, "sample": ["Google", "Qlik", "Intralinks"] }
  },
  "ctaCount": 5,
  "ctaSample": ["Submit", "Services", "Learn More", "Contact Us", "Facebook"],
  "links": { "internal": 5, "external": 46 },
  "images": { "total": 30, "missingAlt": 28, "missingAltPercent": 93 },
  "meta": {
    "title": "B2B Digital Agency for Enterprises | eight25",
    "description": "Global B2B digital agency offering enterprise web design, mobile apps, and strategic consulting for Fortune 500 firms.",
    "titleLength": 44,
    "descriptionLength": 118
  }
}
```

### Raw Model Output (before parsing)

```json
{
  "insights": [
    {
      "category": "seo",
      "title": "High Percentage of Images Missing Alt Text",
      "analysis": "A staggering 93% of images (28 out of 30) are missing alt text. This is a critical SEO issue as alt text helps search engines understand the content of the images, impacting overall page ranking and accessibility.",
      "severity": "critical",
      "metricReferences": ["93%", "28", "30"]
    },
    {
      "category": "messaging",
      "title": "Headline Hierarchy Could Be Improved",
      "analysis": "The page uses a single H1 tag, which is good, but the large number of H3 tags (10) compared to H2 tags (5) may dilute the importance of the main sections. Additionally, many H3s are just company names, which don't add semantic value.",
      "severity": "warning",
      "metricReferences": ["1", "10", "5"]
    },
    {
      "category": "cta",
      "title": "Generic CTA Labels",
      "analysis": "The CTA labels are fairly generic, using terms like 'Learn More,' 'Contact Us,' and 'Submit.' Such labels don't create a sense of urgency or convey a clear benefit to the user, potentially lowering click-through rates.",
      "severity": "warning",
      "metricReferences": ["Learn More", "Contact Us", "Submit"]
    },
    {
      "category": "content_depth",
      "title": "Limited Text Content on the Homepage",
      "analysis": "The word count is relatively low at 360 words. For a homepage that needs to communicate the agency's value proposition and services, this might not be sufficient to thoroughly address user questions or demonstrate expertise.",
      "severity": "warning",
      "metricReferences": ["360"]
    },
    {
      "category": "ux",
      "title": "Excessive External Links",
      "analysis": "While internal links are low at 5, there are 46 external links. Too many external links can dilute the page's authority and potentially distract users from the primary conversion goals.",
      "severity": "warning",
      "metricReferences": ["5", "46"]
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "title": "Add Alt Text to All Images",
      "description": "Provide descriptive alt text for every image on the page to improve SEO and accessibility.",
      "reasoning": "93% of the images are missing alt text, which negatively impacts SEO and accessibility.",
      "impact": "high"
    },
    {
      "priority": 2,
      "title": "Refine CTA Labels",
      "description": "Use more specific and action-oriented language in CTA labels to encourage user engagement and improve conversion rates.",
      "reasoning": "The current CTA labels are generic and lack a compelling call to action, potentially reducing clickthroughs.",
      "impact": "medium"
    },
    {
      "priority": 3,
      "title": "Expand Homepage Content",
      "description": "Increase the amount of text content on the homepage to provide more details about the agency's services, expertise, and value proposition.",
      "reasoning": "The word count is low at 360, suggesting that the homepage may not be providing enough information to engage visitors.",
      "impact": "medium"
    },
    {
      "priority": 4,
      "title": "Review and Reduce External Links",
      "description": "Audit all external links and remove any that are not essential or detract from the page's primary goals.",
      "reasoning": "There are 46 external links which can dilute the page's authority and distract users.",
      "impact": "medium"
    },
    {
      "priority": 5,
      "title": "Review and Restructure Heading Hierarchy",
      "description": "Ensure headings effectively convey content structure. Limit the use of company logos as H3s.",
      "reasoning": "Having 10 H3 elements relative to 5 H2s, with company names as headings, dilutes the heading structure.",
      "impact": "low"
    }
  ],
  "summary": "The webpage has SEO and UX issues that need attention. Addressing the missing alt text and optimizing CTAs could yield significant improvements. Increasing the content depth should improve the page's ability to engage visitors and convert them into leads."
}
```

**Token usage:** 1,261 input / 1,094 output · Model: `google/gemini-2.0-flash-001`

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Scraping:** Cheerio (static HTML parsing)
- **AI:** Google Gemini 2.0 Flash via OpenRouter
- **Styling:** Tailwind CSS with CSS variables (light/dark mode)
- **Deployment:** Vercel
