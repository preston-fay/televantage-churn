/**
 * Build script: chunk telco_churn_expert_v2.md, embed with OpenAI, write to public/rag/v2/
 *
 * Usage:
 *   VITE_OPENAI_API_KEY=sk-xxx npm run rag:build
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { processCorpus, Chunk } from './chunker.js';

interface SectionIndex {
  section_id: string;
  title: string;
  tags: string[];
  summary: string;
}

interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

interface CorpusOutput {
  version: string;
  created: string;
  model: string;
  chunks: EmbeddedChunk[];
  index: SectionIndex[];
}

/**
 * Call OpenAI embeddings API
 */
async function getEmbedding(text: string, apiKey: string, model: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
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
 * Batch embeddings with rate limiting
 */
async function batchEmbed(
  chunks: Chunk[],
  apiKey: string,
  model: string,
  batchSize = 10,
  delayMs = 1000
): Promise<EmbeddedChunk[]> {
  const embedded: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    console.log(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)...`);

    const batchPromises = batch.map(async (chunk) => {
      const embedding = await getEmbedding(chunk.text, apiKey, model);
      return { ...chunk, embedding };
    });

    const batchResults = await Promise.all(batchPromises);
    embedded.push(...batchResults);

    // Rate limiting delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return embedded;
}

/**
 * Main build function
 */
async function buildCorpus() {
  console.log('🚀 Building ChurnIQ RAG corpus...\n');

  // 1. Read environment
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  const model = process.env.VITE_OPENAI_EMBED_MODEL || 'text-embedding-3-large';

  if (!apiKey) {
    console.error('❌ Error: VITE_OPENAI_API_KEY environment variable not set');
    console.error('Usage: VITE_OPENAI_API_KEY=sk-xxx npm run rag:build');
    process.exit(1);
  }

  // 2. Read source files
  const projectRoot = join(process.cwd());
  const corpusPath = join(projectRoot, 'artifacts/telco_churn_expert_v2.md');
  const indexPath = join(projectRoot, 'artifacts/telco_churn_expert_v2_index.json');

  console.log(`📖 Reading corpus: ${corpusPath}`);
  const markdown = readFileSync(corpusPath, 'utf-8');

  console.log(`📋 Reading index: ${indexPath}`);
  const index: SectionIndex[] = JSON.parse(readFileSync(indexPath, 'utf-8'));

  console.log(`✅ Found ${index.length} sections\n`);

  // 3. Chunk corpus (increased density for better coverage)
  const targetTokens = Number(process.env.CHUNK_TOKENS) || 800;
  const overlapTokens = Number(process.env.OVERLAP_TOKENS) || 120;
  console.log(`✂️  Chunking corpus (target: ${targetTokens} tokens, overlap: ${overlapTokens})...`);
  const chunks = processCorpus(markdown, index, targetTokens, overlapTokens);
  console.log(`✅ Created ${chunks.length} chunks\n`);

  // 4. Embed chunks
  console.log(`🔮 Embedding with ${model}...`);
  const embeddedChunks = await batchEmbed(chunks, apiKey, model);
  console.log(`✅ Embedded ${embeddedChunks.length} chunks\n`);

  // 5. Build output
  const output: CorpusOutput = {
    version: 'v2',
    created: new Date().toISOString(),
    model: model,
    chunks: embeddedChunks,
    index: index
  };

  // 6. Write to public/rag/v2/
  const outputDir = join(projectRoot, 'public/rag/v2');
  const outputPath = join(outputDir, 'telco_corpus.json');

  console.log(`💾 Writing corpus to: ${outputPath}`);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  // 7. Write metadata
  const metaPath = join(outputDir, 'metadata.json');
  const metadata = {
    version: 'v2',
    created: output.created,
    model: output.model,
    chunk_count: chunks.length,
    section_count: index.length,
    total_tokens: chunks.reduce((sum, c) => sum + c.token_count, 0)
  };
  writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

  console.log(`✅ Corpus built successfully!`);
  console.log(`   - ${chunks.length} chunks`);
  console.log(`   - ${index.length} sections`);
  console.log(`   - ${metadata.total_tokens.toLocaleString()} total tokens`);
  console.log(`   - ${(Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2)} MB\n`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildCorpus().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
}

export { buildCorpus };
