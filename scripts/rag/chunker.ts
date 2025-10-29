/**
 * Chunker for RAG corpus
 * Splits markdown into ~700-token passages with ~100-token overlap
 */

export interface ChunkMeta {
  section_id: string;
  title: string;
  tags: string[];
}

export interface Chunk {
  id: string;
  section_id: string;
  text: string;
  token_count: number;
  start_offset: number;
  end_offset: number;
}

/**
 * Simple tokenizer using whitespace + punctuation splitting
 * Approximates GPT tokenization (1 token ≈ 0.75 words)
 */
export function estimateTokens(text: string): number {
  // Rough approximation: split on whitespace and punctuation
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return Math.ceil(words.length / 0.75);
}

/**
 * Chunk markdown text into passages of ~targetTokens with overlap
 */
export function chunkText(
  text: string,
  sectionMeta: ChunkMeta,
  targetTokens = 700,
  overlapTokens = 100
): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by paragraphs (double newline)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  let currentChunk = '';
  let currentTokens = 0;
  let chunkStartOffset = 0;
  let globalOffset = 0;
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    const paraTokens = estimateTokens(para);

    // If adding this paragraph would exceed target, save current chunk
    if (currentTokens > 0 && currentTokens + paraTokens > targetTokens) {
      chunks.push({
        id: `${sectionMeta.section_id}_chunk_${chunkIndex}`,
        section_id: sectionMeta.section_id,
        text: currentChunk.trim(),
        token_count: currentTokens,
        start_offset: chunkStartOffset,
        end_offset: globalOffset
      });

      chunkIndex++;

      // Start new chunk with overlap (keep last ~overlapTokens from previous chunk)
      const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let overlapText = '';
      let overlapCount = 0;

      // Build overlap from end of previous chunk
      for (let j = sentences.length - 1; j >= 0 && overlapCount < overlapTokens; j--) {
        const sent = sentences[j].trim();
        const sentTokens = estimateTokens(sent);
        if (overlapCount + sentTokens <= overlapTokens) {
          overlapText = sent + '. ' + overlapText;
          overlapCount += sentTokens;
        } else {
          break;
        }
      }

      currentChunk = overlapText + '\n\n' + para;
      currentTokens = overlapCount + paraTokens;
      chunkStartOffset = globalOffset - overlapText.length;
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + para;
      } else {
        currentChunk = para;
        chunkStartOffset = globalOffset;
      }
      currentTokens += paraTokens;
    }

    globalOffset += para.length + 2; // +2 for \n\n
  }

  // Save final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${sectionMeta.section_id}_chunk_${chunkIndex}`,
      section_id: sectionMeta.section_id,
      text: currentChunk.trim(),
      token_count: currentTokens,
      start_offset: chunkStartOffset,
      end_offset: globalOffset
    });
  }

  return chunks;
}

/**
 * Extract section from markdown by section_id using markdown headers
 */
export function extractSection(markdown: string, sectionId: string): string | null {
  // Find section by looking for markdown headers followed by content
  // Sections are typically marked with ## or ### headers

  // Simple approach: split by ## headers and find matching section
  const sections = markdown.split(/^## /m);

  for (const section of sections) {
    const lines = section.split('\n');
    const header = lines[0]?.toLowerCase() || '';

    // Check if header contains section_id keywords
    if (header.includes(sectionId.replace('-', ' ')) ||
        header.includes(sectionId.replace('_', ' '))) {
      return section;
    }
  }

  return null;
}

/**
 * Process entire corpus: extract sections, chunk each, return all chunks
 */
export function processCorpus(
  markdown: string,
  index: Array<{ section_id: string; title: string; tags: string[] }>,
  targetTokens = 700,
  overlapTokens = 100
): Chunk[] {
  const allChunks: Chunk[] = [];

  for (const sectionMeta of index) {
    const sectionText = extractSection(markdown, sectionMeta.section_id);

    if (!sectionText) {
      console.warn(`Warning: Section ${sectionMeta.section_id} not found in markdown`);
      continue;
    }

    const chunks = chunkText(sectionText, sectionMeta, targetTokens, overlapTokens);
    allChunks.push(...chunks);
  }

  return allChunks;
}
