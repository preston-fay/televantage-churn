import { useState } from 'react';
import { getRetriever } from '../rag/retriever';
import type { RetrievalResult } from '../rag/retriever';
import { RAG_ENV } from '../config/ragEnv';

export default function ProdDiagnosticsRAG() {
  const [query, setQuery] = useState('What is customer lifetime value?');
  const [sectionIds, setSectionIds] = useState('');
  const [tags, setTags] = useState('');
  const [topK, setTopK] = useState(6);
  const [results, setResults] = useState<RetrievalResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corpusLoaded, setCorpusLoaded] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const retriever = getRetriever();

      const retrievalResults = await retriever.retrieve(query, {
        topK,
        sectionIds: sectionIds ? sectionIds.split(',').map(s => s.trim()) : undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined
      });

      setResults(retrievalResults);
      setCorpusLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCorpus = async () => {
    setLoading(true);
    setError(null);
    try {
      const retriever = getRetriever();
      await retriever.loadCorpus(true); // Force reload
      setCorpusLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load corpus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>RAG Diagnostics</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Test the TeleVantage RAG retrieval system. Search the telco churn expert knowledge base
        and verify retrieval + citations work correctly.
      </p>

      {/* Environment Status */}
      <div style={{
        padding: '1rem',
        background: RAG_ENV.OPENAI_API_KEY ? '#d4edda' : '#f8d7da',
        border: `1px solid ${RAG_ENV.OPENAI_API_KEY ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <div><strong>OpenAI API Key:</strong> {RAG_ENV.OPENAI_API_KEY ? `✅ Configured (${RAG_ENV.OPENAI_API_KEY.substring(0, 15)}...)` : '❌ NOT CONFIGURED'}</div>
        <div><strong>Embedding Model:</strong> {RAG_ENV.EMBED_MODEL}</div>
        <div><strong>Top K Default:</strong> {RAG_ENV.TOP_K}</div>
      </div>

      {/* Corpus Status */}
      <div style={{
        padding: '1rem',
        background: corpusLoaded ? '#d4edda' : '#f8f9fa',
        border: `1px solid ${corpusLoaded ? '#c3e6cb' : '#dee2e6'}`,
        borderRadius: '4px',
        marginBottom: '2rem'
      }}>
        <strong>Corpus Status:</strong> {corpusLoaded ? '✅ Loaded' : '⚠️ Not loaded'}
        <button
          onClick={handleLoadCorpus}
          disabled={loading}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem 1rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Load Corpus'}
        </button>
      </div>

      {/* Search Form */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Query:
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What is customer lifetime value?"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Section IDs (comma-separated, optional):
          </label>
          <input
            type="text"
            value={sectionIds}
            onChange={(e) => setSectionIds(e.target.value)}
            placeholder="finance, modeling"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <small style={{ color: '#666' }}>
            Available: finance, network-economics, pricing-elasticity, lifecycle, modeling, ops, geo
          </small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Tags (comma-separated, optional):
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ARPU, CLV, churn"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <small style={{ color: '#666' }}>
            Available: finance, ARPU, NPV, IRR, CLV, network, capex, fiber, 5G, pricing, elasticity, etc.
          </small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Top K:
          </label>
          <input
            type="number"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            min={1}
            max={20}
            style={{
              width: '100px',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '2rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>
            Results ({results.length} chunks)
          </h2>

          {/* Citations Summary */}
          {results.length > 0 && (
            <div style={{
              padding: '1rem',
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '4px',
              marginBottom: '2rem'
            }}>
              <strong>Citations:</strong>{' '}
              {Array.from(new Set(results.map(r => r.section.section_id)))
                .map(id => `[${id}]`)
                .join(', ')}
            </div>
          )}

          {/* Individual Results */}
          {results.map((result, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem',
                background: '#f9f9f9'
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    background: '#007bff',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    marginRight: '0.5rem'
                  }}
                >
                  [{result.section.section_id}]
                </span>
                <strong>{result.section.title}</strong>
                <span style={{ color: '#666', marginLeft: '1rem' }}>
                  Score: {(result.score * 100).toFixed(1)}%
                </span>
              </div>

              <div
                style={{
                  background: 'white',
                  padding: '1rem',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }}
              >
                {result.chunk.text}
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                Chunk ID: {result.chunk.id} • Tokens: {result.chunk.token_count}
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              No results found. Try a different query or remove filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
