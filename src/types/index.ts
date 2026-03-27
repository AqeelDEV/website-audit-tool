/** Extracted metrics from a scraped webpage */
export interface PageMetrics {
  url: string;
  scrapedAt: string;
  wordCount: number;
  headings: {
    h1: { count: number; texts: string[] };
    h2: { count: number; texts: string[] };
    h3: { count: number; texts: string[] };
  };
  ctaCount: number;
  ctaTexts: string[];
  links: {
    internal: number;
    external: number;
  };
  images: {
    total: number;
    missingAlt: number;
    missingAltPercent: number;
  };
  meta: {
    title: string;
    description: string;
    titleLength: number;
    descriptionLength: number;
  };
  /** Trimmed page text content sent to the AI for analysis */
  pageText: string;
}

/** A single insight produced by AI analysis */
export interface AuditInsight {
  category: "seo" | "messaging" | "cta" | "content_depth" | "ux";
  title: string;
  analysis: string;
  severity: "good" | "warning" | "critical";
  metricReferences: string[];
}

/** A prioritized recommendation from the AI */
export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  /** Reasoning tied back to specific metrics */
  reasoning: string;
  impact: "high" | "medium" | "low";
}

/** Complete AI analysis output */
export interface AIAnalysis {
  insights: AuditInsight[];
  recommendations: Recommendation[];
  summary: string;
}

/** Full audit result combining scrape metrics and AI analysis */
export interface AuditResult {
  metrics: PageMetrics;
  analysis: AIAnalysis;
  logId: string;
  promptLog: PromptLog;
}

/** Full prompt log entry for AI transparency */
export interface PromptLog {
  id: string;
  timestamp: string;
  url: string;
  systemPrompt: string;
  userPrompt: string;
  structuredInput: {
    metrics: PageMetrics;
    contentSample: string;
  };
  rawModelOutput: string;
  parsedOutput: AIAnalysis;
  model: string;
  tokenUsage: {
    input: number;
    output: number;
  };
}
