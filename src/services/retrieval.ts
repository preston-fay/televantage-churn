/**
 * Lightweight Retrieval Service
 *
 * Uses MiniSearch for fast term lookup in glossary, features, and segments.
 * Helps copilot use correct telco terminology in explanations.
 */

import MiniSearch from "minisearch";

let searchIndex: MiniSearch | null = null;

interface Document {
  id: string;
  kind: "glossary" | "feature" | "segment";
  term: string;
  text: string;
}

/**
 * Build search index from glossary, features, and segments
 */
export function buildIndex(
  glossary: Array<{ term: string; def: string }>,
  features: any[],
  segments: any[]
) {
  const docs: Document[] = [];

  // Add glossary terms
  glossary.forEach((g, i) => {
    docs.push({
      id: `g${i}`,
      kind: "glossary",
      term: g.term,
      text: g.def
    });
  });

  // Add features
  features.forEach((f, i) => {
    docs.push({
      id: `f${i}`,
      kind: "feature",
      term: f.name || f.feature || `Feature ${i}`,
      text: f.interpretation || f.definition || f.name || ""
    });
  });

  // Add segments
  segments.forEach((s, i) => {
    const segmentName = `${s.tenure_band} | ${s.contract_group} | ${s.value_tier}`;
    docs.push({
      id: `s${i}`,
      kind: "segment",
      term: segmentName,
      text: `${s.strategy || ""} ${s.risk_level || ""} risk`
    });
  });

  searchIndex = new MiniSearch({
    fields: ["term", "text"],
    storeFields: ["kind", "term", "text"],
    searchOptions: {
      boost: { term: 2 },
      prefix: true,
      fuzzy: 0.2
    }
  });

  searchIndex.addAll(docs);

  console.log(`✅ Retrieval index built: ${docs.length} documents`);
}

/**
 * Retrieve relevant terms for a query
 */
export function retrieve(query: string, limit: number = 5): Array<{
  kind: string;
  term: string;
  text: string;
  score: number;
}> {
  if (!searchIndex) {
    console.warn("Retrieval index not initialized");
    return [];
  }

  try {
    const results = searchIndex.search(query, {
      prefix: true,
      fuzzy: 0.2,
      boost: { term: 2 }
    });

    return results.slice(0, limit).map(r => ({
      kind: (r as any).kind,
      term: (r as any).term,
      text: (r as any).text,
      score: r.score
    }));
  } catch (error) {
    console.error("Retrieval error:", error);
    return [];
  }
}

/**
 * Get all glossary terms for context
 */
export function getGlossaryTerms(): string[] {
  if (!searchIndex) return [];

  const allDocs = (searchIndex as any)._documentIds || [];
  const glossaryTerms: string[] = [];

  allDocs.forEach((id: string) => {
    if (id.startsWith('g')) {
      const doc = (searchIndex as any)._storedFields[id];
      if (doc && doc.term) {
        glossaryTerms.push(doc.term);
      }
    }
  });

  return glossaryTerms;
}

/**
 * Check if index is built
 */
export function isIndexBuilt(): boolean {
  return searchIndex !== null;
}
