export const RAG_ENV = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  EMBED_MODEL: import.meta.env.VITE_OPENAI_EMBED_MODEL || "text-embedding-3-large",
  TOP_K: Number(import.meta.env.VITE_RAG_TOP_K || 6)
};
