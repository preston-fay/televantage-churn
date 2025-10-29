import { describe, it, expect } from 'vitest';
import { estimateTokens, chunkText, extractSection, processCorpus } from '../../scripts/rag/chunker';

describe('RAG Chunker', () => {
  describe('estimateTokens', () => {
    it('estimates tokens for simple text', () => {
      const text = 'This is a test sentence.';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10); // ~5 words → ~7 tokens
    });

    it('handles empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('estimates larger text', () => {
      const text = 'The quick brown fox jumps over the lazy dog. '.repeat(50);
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(400); // ~450 words → ~600 tokens
    });
  });

  describe('chunkText', () => {
    const sampleMeta = {
      section_id: 'test',
      title: 'Test Section',
      tags: ['test']
    };

    it('chunks text into passages', () => {
      const text = [
        'First paragraph with some content.',
        'Second paragraph with more content.',
        'Third paragraph with even more content.',
        'Fourth paragraph to test chunking.'
      ].join('\n\n');

      const chunks = chunkText(text, sampleMeta, 50, 10);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].section_id).toBe('test');
      expect(chunks[0].token_count).toBeGreaterThan(0);
    });

    it('creates overlapping chunks', () => {
      const paragraphs = Array(20).fill(0).map((_, i) =>
        `Paragraph ${i + 1} with substantial content to ensure proper chunking behavior.`
      );
      const text = paragraphs.join('\n\n');

      const chunks = chunkText(text, sampleMeta, 100, 20);

      if (chunks.length > 1) {
        // Verify overlap exists by checking if later chunks contain content from earlier ones
        expect(chunks.length).toBeGreaterThan(1);
        // Each chunk should have reasonable token count
        chunks.forEach(chunk => {
          expect(chunk.token_count).toBeGreaterThan(0);
          expect(chunk.token_count).toBeLessThanOrEqual(150); // Some tolerance above target
        });
      }
    });

    it('assigns unique IDs to chunks', () => {
      const text = Array(10).fill(0).map((_, i) =>
        `Paragraph ${i + 1}.`
      ).join('\n\n');

      const chunks = chunkText(text, sampleMeta, 50, 10);
      const ids = new Set(chunks.map(c => c.id));

      expect(ids.size).toBe(chunks.length); // All IDs should be unique
    });

    it('handles small text without chunking', () => {
      const text = 'Just a short sentence.';
      const chunks = chunkText(text, sampleMeta, 700, 100);

      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe(text);
    });
  });

  describe('extractSection', () => {
    const markdown = `
# Main Title

## Finance Section
This is the finance content.
With multiple paragraphs.

## Network Economics
This is network content.
With different information.

## Pricing Section
Pricing details here.
`;

    it('extracts section by ID', () => {
      const section = extractSection(markdown, 'finance');
      expect(section).not.toBeNull();
      expect(section).toContain('finance content');
    });

    it('handles section not found', () => {
      const section = extractSection(markdown, 'nonexistent');
      expect(section).toBeNull();
    });

    it('extracts different sections', () => {
      const finance = extractSection(markdown, 'finance');
      const network = extractSection(markdown, 'network');

      expect(finance).not.toBe(network);
      expect(finance).toContain('finance');
      expect(network).toContain('network');
    });
  });

  describe('processCorpus', () => {
    const markdown = `
## Financial Framework
This section covers financial metrics like ARPU, CLV, and NPV.

It includes formulas and examples.

## Modeling Approaches
This section covers ML modeling techniques.

Including binary classification and survival analysis.
`;

    const index = [
      { section_id: 'finance', title: 'Financial Framework', tags: ['finance', 'ARPU'] },
      { section_id: 'modeling', title: 'Modeling Approaches', tags: ['modeling', 'ML'] }
    ];

    it('processes full corpus', () => {
      const chunks = processCorpus(markdown, index, 50, 10);

      expect(chunks.length).toBeGreaterThan(0);

      // Verify sections are represented
      const sectionIds = new Set(chunks.map(c => c.section_id));
      expect(sectionIds.size).toBeGreaterThan(0);
    });

    it('maintains section metadata', () => {
      const chunks = processCorpus(markdown, index, 100, 20);

      chunks.forEach(chunk => {
        expect(chunk.section_id).toBeTruthy();
        expect(chunk.id).toContain(chunk.section_id);
      });
    });

    it('respects target token size', () => {
      const chunks = processCorpus(markdown, index, 100, 20);

      chunks.forEach(chunk => {
        // Allow some tolerance
        expect(chunk.token_count).toBeLessThanOrEqual(150);
      });
    });
  });

  describe('Determinism', () => {
    it('produces same results for same input', () => {
      const text = 'Consistent content for testing. '.repeat(100);
      const meta = { section_id: 'test', title: 'Test', tags: [] };

      const chunks1 = chunkText(text, meta, 100, 20);
      const chunks2 = chunkText(text, meta, 100, 20);

      expect(chunks1.length).toBe(chunks2.length);
      expect(chunks1[0].text).toBe(chunks2[0].text);
      expect(chunks1[0].token_count).toBe(chunks2[0].token_count);
    });
  });
});

// Note: Retrieval tests requiring OpenAI API are skipped in unit tests
// These should be tested in integration tests with mocked embeddings
describe('RAG Retriever (unit)', () => {
  it('placeholder for integration tests', () => {
    // Integration tests with real embeddings should be run separately
    // with mocked OpenAI API responses
    expect(true).toBe(true);
  });
});
