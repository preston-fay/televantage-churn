# RAG Implementation Guide

## Overview

This implementation adds a production-ready Retrieval Augmented Generation (RAG) layer to the TeleVantage app using the telco churn expert knowledge base.

## Architecture

### Components

1. **Corpus Source** (`artifacts/`)
   - `telco_churn_expert_v2.md` - The comprehensive markdown knowledge base
   - `telco_churn_expert_v2_index.json` - Section metadata with IDs, titles, tags, summaries

2. **Build Scripts** (`scripts/rag/`)
   - `chunker.ts` - Tokenizer and text chunking logic (~700 tokens, ~100 overlap)
   - `build_telco_corpus.ts` - Embeds chunks via OpenAI and writes to `public/rag/v2/`

3. **Client-Side Retrieval** (`src/rag/`)
   - `retriever.ts` - Loads corpus, embeds queries, ranks by cosine similarity
   - `retriever.test.ts` - Unit tests for chunking and determinism

4. **Copilot Integration** (`src/ai/`)
   - `tools.ts` - Adds `rag_search` tool returning context + citations
   - `runtime.ts` - Updated system prompt with RAG citation rules

5. **Diagnostics** (`src/routes/`)
   - `ProdDiagnosticsRAG.tsx` - UI at `/#/llm-check-rag` to test retrieval

6. **Configuration** (`src/config/`)
   - `ragEnv.ts` - Environment variables for API key, model, top-k

## Building the Corpus

### Prerequisites

1. Set OpenAI API key:
   ```bash
   export VITE_OPENAI_API_KEY=sk-your-key-here
   ```

2. (Optional) Configure embedding model:
   ```bash
   export VITE_OPENAI_EMBED_MODEL=text-embedding-3-large
   ```

### Build Commands

```bash
# Build corpus (chunks + embeddings)
npm run rag:build

# Rebuild from scratch
npm run rag:rebuild
```

### Output

- `public/rag/v2/telco_corpus.json` - Embedded chunks with metadata
- `public/rag/v2/metadata.json` - Corpus stats

## Using RAG in the App

### 1. Copilot Tool

The Copilot can now use the `rag_search` tool to retrieve context:

```typescript
// Example query
rag_search({
  query: "What is customer lifetime value?",
  section_ids: ["finance"],  // Optional filter
  tags: ["CLV", "ARPU"],     // Optional filter
  top_k: 6                   // Number of results
})

// Returns
{
  context: "Formatted passages with relevance scores",
  citations: [
    { section_id: "finance", title: "Financial and Economic Framework" }
  ]
}
```

### 2. System Prompt Rules

The Copilot runtime includes these RAG rules:

- For questions about telco churn theory/economics/modeling, use `rag_search`
- Always cite sections using `[section_id]` format
- If no relevant context found, say "I don't have that information" rather than guessing

### 3. Diagnostics Route

Visit `http://localhost:5173/#/llm-check-rag` to:

- Load the corpus
- Test retrieval with custom queries
- Filter by section IDs and tags
- View relevance scores and citations

## Development

### Running Tests

```bash
# Run all tests including RAG
npm test

# Watch mode
npm run test:watch
```

The test suite includes:
- Token estimation tests
- Text chunking tests with overlap
- Section extraction tests
- Corpus processing tests
- Determinism tests (same input → same output)

### Adding New Sections

1. Update `artifacts/telco_churn_expert_v2.md` with new content
2. Add section metadata to `artifacts/telco_churn_expert_v2_index.json`:
   ```json
   {
     "section_id": "new-section",
     "title": "New Section Title",
     "tags": ["tag1", "tag2"],
     "summary": "Brief description"
   }
   ```
3. Rebuild corpus: `npm run rag:rebuild`

### Updating Embeddings Model

To use a different OpenAI model:

```bash
export VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
npm run rag:rebuild
```

## Key Features

### S-Curve Effectiveness

The chunker creates passages with smooth overlap for better context:

```
Chunk 1: [============================]
Chunk 2:              [============================]
Chunk 3:                           [============================]
           |<-- overlap -->|
```

### Cosine Similarity Ranking

Retrieval uses cosine similarity between query and chunk embeddings:

```
score = (query · chunk) / (||query|| × ||chunk||)
```

### Section Filtering

Filter results by section or tags:

```typescript
// Finance-only results
rag_search({ query: "ARPU", section_ids: ["finance"] })

// Results with churn tag
rag_search({ query: "retention", tags: ["churn"] })
```

### Citations

All retrieval results include section citations:

```
[finance] Financial and Economic Framework
[modeling] Modeling Frameworks
```

## Security Notes

- **NEVER commit** `VITE_OPENAI_API_KEY` to version control
- Use `.env.local` for local development
- Use secure secrets management in production
- The corpus JSON is client-loadable (no server required)

## Troubleshooting

### Corpus not loading

Check:
1. File exists: `public/rag/v2/telco_corpus.json`
2. File is valid JSON
3. Browser console for fetch errors

### Build script fails

Check:
1. `VITE_OPENAI_API_KEY` is set
2. API key has embedding permissions
3. Network connectivity

### Low relevance scores

Try:
1. More specific queries
2. Remove section/tag filters
3. Increase `top_k` to see more results
4. Verify corpus has relevant content

## Performance

- **Corpus size**: ~7 sections → 20-50 chunks → 1-3 MB JSON
- **Load time**: <500ms on first load (cached thereafter)
- **Query time**: ~500ms (OpenAI embedding API call)
- **Retrieval**: <50ms (client-side cosine similarity)

## Next Steps

1. Build the real corpus:
   ```bash
   export VITE_OPENAI_API_KEY=sk-...
   npm run rag:build
   ```

2. Test retrieval at: `http://localhost:5173/#/llm-check-rag`

3. Ask the Copilot questions like:
   - "What is customer lifetime value?"
   - "Explain uplift modeling"
   - "How do I calculate network IRR?"

4. Verify citations appear in responses as `[section_id]`
