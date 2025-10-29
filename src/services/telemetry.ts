/**
 * Telemetry for tracking routing decisions and detecting bypasses
 */

export const Telemetry = {
  route: (name: string, meta: Record<string, any> = {}) => {
    console.info("🎯 Route:", name, meta);
  },

  bypass: (query: string, toolUsed: string, shouldHaveUsed: string) => {
    console.warn("⚠️ RAG BYPASS DETECTED", {
      query,
      toolUsed,
      shouldHaveUsed,
      timestamp: new Date().toISOString(),
    });
  },

  ragSuccess: (query: string, citations: number) => {
    console.log("✅ RAG Success:", { query, citations });
  },

  numericSuccess: (query: string, tool: string) => {
    console.log("✅ Numeric Tool Success:", { query, tool });
  },

  error: (context: string, error: Error | unknown) => {
    console.error("❌ Error:", context, error);
  },
};
