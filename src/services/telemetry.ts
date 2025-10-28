/**
 * Telemetry Module
 * Simple counters and error tracking for Strategy Copilot
 */

export const Telemetry = {
  llmCalls: 0,
  llmErrors: 0,
  planned: 0,
  executed: 0,
  fallbacks: 0,
  lastError: "" as string,

  log(err: any) {
    this.llmErrors++;
    this.lastError = String(err?.message || err);
    console.error("❌ Copilot Error:", err);
  },

  reset() {
    this.llmCalls = 0;
    this.llmErrors = 0;
    this.planned = 0;
    this.executed = 0;
    this.fallbacks = 0;
    this.lastError = "";
  },

  getStats() {
    return {
      llmCalls: this.llmCalls,
      llmErrors: this.llmErrors,
      planned: this.planned,
      executed: this.executed,
      fallbacks: this.fallbacks,
      successRate: this.llmCalls > 0 ? ((this.llmCalls - this.llmErrors) / this.llmCalls * 100).toFixed(1) + '%' : 'N/A',
      lastError: this.lastError
    };
  }
};
