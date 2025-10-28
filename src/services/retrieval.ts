/**
 * Retrieval Module
 * Lightweight search over glossary, features, and segments using MiniSearch
 */

import MiniSearch from "minisearch";

let index: MiniSearch | null = null;

export function buildIndex(glossary: any[], features: any[], segments: any[]) {
  index = new MiniSearch({
    fields: ["term", "text"],
    storeFields: ["kind", "term", "text"]
  });

  const docs: any[] = [];

  // Add glossary terms
  glossary.forEach((g, i) => {
    docs.push({
      id: `g${i}`,
      kind: "glossary",
      term: g.term,
      text: g.def || g.definition || ""
    });
  });

  // Add features
  features.forEach((f, i) => {
    docs.push({
      id: `f${i}`,
      kind: "feature",
      term: f.feature || f.name || f.label || "",
      text: f.definition || f.interpretation || String(f.feature || f.name || "")
    });
  });

  // Add segments
  segments.forEach((s, i) => {
    docs.push({
      id: `s${i}`,
      kind: "segment",
      term: s.name || s.segment || "",
      text: s.description || s.notes || s.summary || ""
    });
  });

  if (docs.length > 0) {
    index.addAll(docs);
  }
}

export function retrieve(query: string, k = 5) {
  if (!index) {
    return [];
  }

  try {
    const results = index.search(query, { prefix: true });
    return results.slice(0, k);
  } catch (error) {
    console.warn("Retrieval error:", error);
    return [];
  }
}

export function isIndexBuilt() {
  return index !== null;
}
