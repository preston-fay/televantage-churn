/**
 * Compose grounded answers from RAG context with proper citations
 */

import type { Answer } from "./schemas";

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    // Remove headers (##, ###, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic (**text**, *text*, __text__, _text_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove list markers (-, *, 1., etc.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove escaped characters (backslashes)
    .replace(/\\(.)/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Summarize RAG context into a concise answer (max 3 sentences)
 */
function summarize(context: string): string {
  // Split into passages (separated by ---) and take first 2-3
  const passages = context.split(/\n---\n/).filter((p) => p.trim());

  if (passages.length === 0) return "No relevant information found.";

  // Take first passage and extract just the text (remove relevance scores)
  const firstPassage = passages[0]
    .split("\n")
    .filter((line) => !line.startsWith("(relevance:") && !line.startsWith("["))
    .join("\n")
    .trim();

  // Strip markdown formatting
  const cleanText = stripMarkdown(firstPassage);

  // Limit to ~300 chars for conciseness
  if (cleanText.length > 300) {
    return cleanText.substring(0, 297) + "...";
  }

  return cleanText;
}

/**
 * Compose a grounded answer from RAG context with citations
 */
export function composeGroundedAnswer(
  query: string,
  context: string,
  citations: Array<{ section_id: string; title: string }>
): Answer {
  // Check if user wants a chart
  const wantsChart = /\b(chart|graph|plot|show|bar|donut|line|visual)\b/i.test(
    query
  );

  // Format unique citations
  const uniqueCitations = Array.from(
    new Map(citations.map((c) => [c.section_id, c])).values()
  );
  const citeStr = uniqueCitations.map((c) => `[${c.section_id}]`).join(" ");

  // Build answer text
  const summaryText = summarize(context);
  const text = summaryText;

  // Format citations for Answer schema (ensure at least one citation)
  const formattedCitations = uniqueCitations.length > 0
    ? uniqueCitations.map((c) => ({
        source: c.section_id,
        ref: c.title,
      }))
    : [{ source: "system", ref: "No relevant sources found" }];

  // Generate context-aware follow-ups
  const followUps = generateFollowUps(citations);

  // Return answer with citations and follow-ups
  // Note: Chart detection removed - hybrid path handles charts separately
  return {
    text,
    citations: formattedCitations,
    followUps,
  };
}

/**
 * Generate intelligent follow-up suggestions based on retrieved sections
 */
function generateFollowUps(
  citations: Array<{ section_id: string; title: string }>
): string[] {
  const followUpMap: Record<string, string[]> = {
    finance: [
      "Explain ARPU calculation",
      "Define customer lifetime value",
      "Show ROI by strategy",
    ],
    "network-economics": [
      "Explain network IRR",
      "Describe capex structure",
      "How does 5G affect economics?",
    ],
    "pricing-elasticity": [
      "Define price elasticity",
      "How does pricing affect churn?",
      "Explain ARPU optimization",
    ],
    lifecycle: [
      "Describe customer lifecycle stages",
      "Explain acquisition vs retention",
      "What is win-back strategy?",
    ],
    modeling: [
      "Explain uplift modeling",
      "Describe survival analysis",
      "What is reinforcement learning for churn?",
    ],
    ops: [
      "How do you integrate churn models?",
      "Explain NBA systems",
      "Describe campaign ROI measurement",
    ],
    geo: [
      "How does coverage affect churn?",
      "Explain competitive analysis",
      "Describe geospatial features",
    ],
  };

  // Collect follow-ups from retrieved sections
  const sectionIds = Array.from(
    new Set(citations.map((c) => c.section_id))
  ).slice(0, 3);
  const followUps: string[] = [];

  for (const sectionId of sectionIds) {
    const suggestions = followUpMap[sectionId];
    if (suggestions && suggestions.length > 0) {
      followUps.push(suggestions[0]); // Take first suggestion from each section
    }
  }

  // Fill with defaults if needed
  while (followUps.length < 3) {
    const defaults = [
      "Compare ROI across strategies",
      "Show customer risk distribution",
      "Explain churn drivers",
    ];
    const next = defaults[followUps.length];
    if (next && !followUps.includes(next)) {
      followUps.push(next);
    } else {
      break;
    }
  }

  return followUps.slice(0, 3);
}
