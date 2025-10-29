/**
 * Scored Router for RAG vs Numeric Tool Selection
 * Prevents silent fallbacks and prioritizes RAG for conceptual questions
 */

export type Route = "rag" | "numeric" | "generic";

export interface RouteScore {
  rag: number;
  numeric: number;
  preferRag: boolean;
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

  return { rag: ragScore, numeric: numericScore, preferRag };
}

/**
 * Determine the route based on score
 */
export function getRoute(query: string): Route {
  const score = scoreRoute(query);

  if (score.preferRag) {
    return "rag";
  }

  if (score.numeric > 0) {
    return "numeric";
  }

  return "generic";
}
