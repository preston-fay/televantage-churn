/**
 * Scored Router for RAG vs Numeric Tool Selection
 * Prevents silent fallbacks and prioritizes RAG for conceptual questions
 */

export type Route = "rag" | "numeric" | "hybrid" | "generic";

export interface RouteScore {
  rag: number;
  numeric: number;
  preferRag: boolean;
  isHybrid: boolean;  // True if query wants both data AND explanation
}

/**
 * Score a query to determine whether it should use RAG or numeric tools
 */
export function scoreRoute(query: string): RouteScore {
  const s = query.toLowerCase();

  // Strong conceptual phrases that MUST use RAG (definitions, explanations)
  const strongConceptualPhrases = [
    "what is",
    "define",
    "explain",
    "describe",
    "how does",
    "why does",
    "why is"
  ];

  // Conceptual/strategic keywords that indicate RAG should be used
  const conceptualHints = [
    "what is",
    "define",
    "explain",
    "describe",
    "tell me",
    "how does",
    "why",
    "overview",
    "everything",
    "framework",
    "kpi",
    "glossary",
    "business",
    "economics",
    "theory",
    "best practice",
    "methodology",
    "approach",
    "strategy",
    "benchmark",
    "playbook",
    "lifecycle",
    "segmentation",
    "fundamentals",
    "principles",
    "concepts",
    "terminology",
    "background",
    "context",
    "history",
  ];

  // Numeric/data keywords that indicate data tools should be used
  const numericHints = [
    "roi",
    "irr",
    "arpu",
    "mrr",
    "cltv",
    "budget",
    "conversion",
    "cost per intervention",
    "risk distribution",
    "compare",
    "by strategy",
    "calculate",
    "show me",
    "what is the",
    "get",
    "fetch",
    "feature importance",
    "drivers",
    "churn drivers",
    "factors",
    "importance",
    "top",
    "month-to-month",
    "mtm",
    "m2m",
    "segment",
    "segments",
    "contract",
    "tenure",
    "annual",
    "yearly",
    "early-tenure",
    "early tenure",
  ];

  // MANDATORY numeric keywords: if present, ALWAYS route to numeric regardless of conceptual phrasing
  const mandatoryNumericKeywords = [
    "month-to-month",
    "mtm",
    "m2m",
    "tenure",
    "contract",
    "segment",
    "roi",
    "arpu",
    "cltv",
    "drivers",
    "feature importance",
    "risk distribution",
  ];

  // Check if query contains any mandatory numeric keywords
  const hasMandatoryNumeric = mandatoryNumericKeywords.some(kw => s.includes(kw));

  // Check if query has strong conceptual intent (definitions, explanations)
  const hasStrongConceptualIntent = strongConceptualPhrases.some(phrase => s.includes(phrase));

  // Score based on keyword matches
  const ragScore =
    conceptualHints.reduce((total, keyword) => {
      return total + (s.includes(keyword) ? 1 : 0);
    }, 0) + Math.min(2, Math.floor(s.length / 60)); // Bonus for longer, explanatory queries

  const numericScore = numericHints.reduce((total, keyword) => {
    return total + (s.includes(keyword) ? 1 : 0);
  }, 0);

  // ROUTING PRIORITY:
  // 1. Strong conceptual intent (what is, define, explain) → FORCE RAG
  // 2. Mandatory numeric keywords → FORCE NUMERIC
  // 3. Ties → default to RAG
  const preferRag = hasStrongConceptualIntent ? true :
                    hasMandatoryNumeric ? false :
                    ragScore >= numericScore;

  // Detect hybrid queries: wants data visualization + conceptual explanation
  // E.g., "Show me customer risk distribution" (wants chart + context about risk)
  // Also: Exploratory queries like "Tell me about X" where X is a data topic
  const visualizationKeywords = ["show", "chart", "graph", "plot", "visualiz", "distribution"];
  const exploratoryPhrases = ["tell me about", "why is", "why does", "what about"];

  const hasVisualization = visualizationKeywords.some(kw => s.includes(kw));
  const hasExploratory = exploratoryPhrases.some(phrase => s.includes(phrase));
  const hasDataTopic = numericScore > 0;  // Mentions specific metrics/data

  // Hybrid if: (viz + data) OR (exploratory + data)
  const isHybrid = hasDataTopic &&
                   (hasVisualization || hasExploratory) &&
                   s.split(/\s+/).length >= 4;

  return { rag: ragScore, numeric: numericScore, preferRag, isHybrid };
}

/**
 * Determine the route based on score
 */
export function getRoute(query: string): Route {
  const score = scoreRoute(query);

  // Hybrid route: needs both data visualization AND conceptual context
  if (score.isHybrid) {
    return "hybrid";
  }

  if (score.preferRag) {
    return "rag";
  }

  if (score.numeric > 0) {
    return "numeric";
  }

  return "generic";
}
