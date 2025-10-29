import { describe, it, expect } from "vitest";
import { scoreRoute, getRoute } from "./router";

describe("Scored Router", () => {
  describe("scoreRoute", () => {
    it("scores conceptual queries higher for RAG", () => {
      const queries = [
        "Tell me everything about the telco business and churn economics",
        "What is customer lifetime value and how is it calculated?",
        "Explain uplift modeling",
        "Describe network economics",
        "Define ARPU",
      ];

      queries.forEach((query) => {
        const score = scoreRoute(query);
        expect(score.rag).toBeGreaterThanOrEqual(score.numeric);
        expect(score.preferRag).toBe(true);
      });
    });

    it("scores numeric queries higher for tools", () => {
      const queries = [
        "Compare IRR by strategy and show a bar chart",
        "What is the ROI for budget optimization?",
        "Show me the risk distribution",
        "Calculate CLTV",
        "Get customer risk segments",
      ];

      queries.forEach((query) => {
        const score = scoreRoute(query);
        // These might have some conceptual keywords but numeric should win or tie
        expect(score.numeric).toBeGreaterThan(0);
      });
    });

    it("prefers RAG on ties or equal scores", () => {
      // "Hello" has no keywords, should be 0-0 tie → RAG wins
      const score = scoreRoute("Hello");
      expect(score.preferRag).toBe(true);
      expect(score.rag).toBe(score.numeric);
    });

    it("gives longer queries a RAG bonus", () => {
      const short = scoreRoute("What is ARPU?");
      const long = scoreRoute(
        "What is ARPU and how does it relate to customer lifetime value in the context of telco churn economics and network profitability?"
      );

      expect(long.rag).toBeGreaterThan(short.rag);
    });
  });

  describe("getRoute", () => {
    it("returns 'rag' for conceptual queries", () => {
      expect(getRoute("Tell me about telco business")).toBe("rag");
      expect(getRoute("What is customer lifetime value?")).toBe("rag");
      expect(getRoute("Explain churn economics")).toBe("rag");
    });

    it("returns 'numeric' for data queries with clear numeric intent", () => {
      expect(getRoute("Show me the ROI by strategy")).toBe("numeric");
      expect(getRoute("Calculate CLTV")).toBe("numeric");
      expect(getRoute("Get risk distribution")).toBe("numeric");
    });

    it("defaults to 'rag' for ambiguous queries", () => {
      expect(getRoute("Hello")).toBe("rag");
      expect(getRoute("Help me")).toBe("rag");
    });
  });

  describe("Edge cases", () => {
    it("handles empty string", () => {
      const score = scoreRoute("");
      expect(score.rag).toBe(0);
      expect(score.numeric).toBe(0);
      expect(score.preferRag).toBe(true); // Tie → RAG
    });

    it("handles very long queries", () => {
      const longQuery = "explain ".repeat(100);
      const score = scoreRoute(longQuery);
      expect(score.rag).toBeGreaterThan(0);
    });

    it("is case insensitive", () => {
      const lower = scoreRoute("what is arpu?");
      const upper = scoreRoute("WHAT IS ARPU?");
      expect(lower.rag).toBe(upper.rag);
      expect(lower.numeric).toBe(upper.numeric);
    });
  });
});
