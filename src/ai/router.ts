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
  ];

  // Score based on keyword matches
  const ragScore =
    conceptualHints.reduce((total, keyword) => {
      return total + (s.includes(keyword) ? 1 : 0);
    }, 0) + Math.min(2, Math.floor(s.length / 60)); // Bonus for longer, explanatory queries

  const numericScore = numericHints.reduce((total, keyword) => {
    return total + (s.includes(keyword) ? 1 : 0);
  }, 0);

  // RAG wins on ties (default to knowledge base for ambiguous queries)
  const preferRag = ragScore >= numericScore;

  // Detect hybrid queries: wants data visualization + conceptual explanation
  // E.g., "Show me customer risk distribution" (wants chart + context about risk)
  const visualizationKeywords = ["show", "chart", "graph", "plot", "visualiz", "distribution"];
  const hasVisualization = visualizationKeywords.some(kw => s.includes(kw));
  const hasDataTopic = numericScore > 0;  // Mentions specific metrics/data
  const isHybrid = hasVisualization && hasDataTopic && s.split(/\s+/).length >= 4;

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
