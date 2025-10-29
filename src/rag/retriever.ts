/**
 * Client-side RAG retrieval with cosine similarity ranking
 */

import { RAG_ENV } from '../config/ragEnv';

export interface SectionIndex {
  section_id: string;
  title: string;
  tags: string[];
  summary: string;
}

export interface EmbeddedChunk {
  id: string;
  section_id: string;
  text: string;
  token_count: number;
  start_offset: number;
  end_offset: number;
  embedding: number[];
}

export interface CorpusData {
  version: string;
  created: string;
  model: string;
  chunks: EmbeddedChunk[];
  index: SectionIndex[];
}

export interface RetrievalResult {
  chunk: EmbeddedChunk;
  section: SectionIndex;
  score: number;
}

export interface RetrievalOptions {
  topK?: number;
  sectionIds?: string[];
  tags?: string[];
  minScore?: number;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * RAG Retriever class
 */
export class RAGRetriever {
  private corpus: CorpusData | null = null;
  private loading: Promise<CorpusData> | null = null;

  /**
   * Load corpus from public/rag/v2/telco_corpus.json
   */
  async loadCorpus(force = false): Promise<CorpusData> {
    if (this.corpus && !force) {
      return this.corpus;
    }

    if (this.loading && !force) {
      return this.loading;
    }

    this.loading = (async () => {
      const response = await fetch('/rag/v2/telco_corpus.json');
      if (!response.ok) {
        throw new Error(`Failed to load corpus: ${response.status} ${response.statusText}`);
      }
      this.corpus = await response.json();
      return this.corpus!;
    })();

    return this.loading;
  }

  /**
   * Get embedding for query text using OpenAI API
   */
  async getQueryEmbedding(query: string): Promise<number[]> {
    const apiKey = RAG_ENV.OPENAI_API_KEY;
    const model = RAG_ENV.EMBED_MODEL;

    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: query,
        model: model
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(query: string, options: RetrievalOptions = {}): Promise<RetrievalResult[]> {
    const {
      topK = RAG_ENV.TOP_K,
      sectionIds,
      tags,
      minScore = 0.5
    } = options;

    // Load corpus
    const corpus = await this.loadCorpus();

    // Get query embedding
    const queryEmbedding = await this.getQueryEmbedding(query);

    // Build section lookup
    const sectionMap = new Map<string, SectionIndex>();
    for (const section of corpus.index) {
      sectionMap.set(section.section_id, section);
    }

    // Filter chunks by section_id and tags if specified
    let candidateChunks = corpus.chunks;

    if (sectionIds && sectionIds.length > 0) {
      candidateChunks = candidateChunks.filter(chunk =>
        sectionIds.includes(chunk.section_id)
      );
    }

    if (tags && tags.length > 0) {
      candidateChunks = candidateChunks.filter(chunk => {
        const section = sectionMap.get(chunk.section_id);
        if (!section) return false;
        return tags.some(tag => section.tags.includes(tag));
      });
    }

    // Calculate cosine similarity for each chunk
    const scored = candidateChunks.map(chunk => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      const section = sectionMap.get(chunk.section_id)!;
      return { chunk, section, score };
    });

    // Filter by minimum score and sort by score descending
    const filtered = scored.filter(result => result.score >= minScore);
    filtered.sort((a, b) => b.score - a.score);

    // Return top K
    return filtered.slice(0, topK);
  }

  /**
   * Format retrieval results for LLM context
   */
  formatContext(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return 'No relevant context found.';
    }

    const sections: string[] = [];

    for (const result of results) {
      sections.push(
        `[${result.section.section_id}] ${result.section.title}\n` +
        `${result.chunk.text}\n` +
        `(relevance: ${(result.score * 100).toFixed(1)}%)`
      );
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Extract citation section IDs from results
   */
  getCitations(results: RetrievalResult[]): Array<{ section_id: string; title: string }> {
    const seen = new Set<string>();
    const citations: Array<{ section_id: string; title: string }> = [];

    for (const result of results) {
      if (!seen.has(result.section.section_id)) {
        citations.push({
          section_id: result.section.section_id,
          title: result.section.title
        });
        seen.add(result.section.section_id);
      }
    }

    return citations;
  }
}

// Singleton instance
let retrieverInstance: RAGRetriever | null = null;

export function getRetriever(): RAGRetriever {
  if (!retrieverInstance) {
    retrieverInstance = new RAGRetriever();
  }
  return retrieverInstance;
}
