/**
 * AI Service V4 - Scored Router with RAG Priority
 * - RAG first for conceptual questions
 * - Numeric tools for specific data requests
 * - No silent fallbacks to drivers
 * - Timeout guards and telemetry
 */

import { HAS_LLM } from "../config/env";
import { llmWithTools } from "../ai/runtime";
import { Tools, setToolsData } from "../ai/tools";
import { ragSearch, buildRAG } from "../ai/rag";
import { Answer, Answer as AnswerSchema } from "../ai/schemas";
import { scoreRoute } from "../ai/router";
import { composeGroundedAnswer } from "../ai/compose";
import { Telemetry } from "./telemetry";
import type { AppData } from "../types";

// Glossary for legacy RAG (MiniSearch-based)
const GLOSSARY = [
  { term: "ARPU", def: "Average monthly revenue per active subscriber." },
  { term: "IRR", def: "Annualized effective return from strategy cash flows." },
  { term: "CLTV", def: "Lifetime value: net present value of margin per user." },
  {
    term: "EBITDA",
    def: "Earnings before interest, taxes, depreciation, amortization.",
  },
  {
    term: "Churn Rate",
    def: "Percentage of customers who cancel service in a given period.",
  },
];

let ragBuilt = false;

const PLANNER_TIMEOUT_MS = Number(
  import.meta.env.VITE_PLANNER_TIMEOUT_MS || 5000
);

/**
 * Timeout wrapper for planner calls
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms = PLANNER_TIMEOUT_MS
): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("planner-timeout")), ms)
    ),
  ]);
}

/**
 * Main copilot entry point with scored routing
 */
export async function askCopilot({ text }: { text: string }): Promise<Answer> {
  console.log("🎯 askCopilot called with:", text);

  // Score the query to determine route
  const score = scoreRoute(text);
  Telemetry.route(score.preferRag ? "RAG" : "NUMERIC", {
    query: text,
    ragScore: score.rag,
    numericScore: score.numeric,
  });

  try {
    // RAG PATH: Conceptual/strategic questions
    if (score.preferRag) {
      console.log("→ Routing to RAG (conceptual query)");
      return await handleRAGPath(text);
    }

    // NUMERIC PATH: Specific data requests
    console.log("→ Routing to NUMERIC tools (data query)");
    return await handleNumericPath(text);
  } catch (error: any) {
    Telemetry.error("askCopilot", error);

    // Safe fallback: try RAG, never default to drivers
    console.warn("⚠️ Error in primary path, trying RAG fallback:", error.message);
    try {
      return await handleRAGPath(text);
    } catch (ragError) {
      Telemetry.error("RAG fallback", ragError);

      // Ultimate fallback: inform user
      return {
        text: `I encountered an error processing your question: ${error.message}. Please try rephrasing or ask a more specific question.`,
        citations: [{ source: "System", ref: "Error handler" }],
        followUps: [
          "Show customer risk distribution",
          "Compare ROI across strategies",
          "Explain churn economics",
        ],
      };
    }
  }
}

/**
 * Handle RAG path for conceptual questions
 */
async function handleRAGPath(text: string): Promise<Answer> {
  const ragResult = await Tools.rag_search({
    query: text,
    top_k: Number(import.meta.env.VITE_RAG_TOP_K) || 6,
  });

  if (!ragResult.text || !ragResult.text.trim()) {
    throw new Error("No RAG context found for query");
  }

  // Extract citations from RAG result and convert to expected format
  const citations = (ragResult.citations || []).map((c) => ({
    section_id: c.source,
    title: c.ref,
  }));

  Telemetry.ragSuccess(text, citations.length);

  // Compose grounded answer
  const answer = composeGroundedAnswer(text, ragResult.text, citations);

  AnswerSchema.parse(answer);
  return answer;
}

/**
 * Handle numeric path for specific data requests
 */
async function handleNumericPath(text: string): Promise<Answer> {
  if (!HAS_LLM) {
    // No LLM: use deterministic routing
    return await handleNumericPathNoLLM(text);
  }

  // Use LLM with tools
  try {
    const res = await withTimeout(llmWithTools(text));

    if (res.fromTool) {
      Telemetry.numericSuccess(text, res.fn || "unknown");

      const { out } = res;

      // Check if a conceptual question was routed to numeric tool (bypass detection)
      const conceptualKeywords =
        /why|how|what is|explain|define|describe|tell me about|business|theory|economics|best practice/i;
      if (conceptualKeywords.test(text) && res.fn !== "rag_search") {
        Telemetry.bypass(text, res.fn || "unknown", "rag_search");
      }

      const answer: Answer = {
        text: out.text || "Here are the insights based on your telco data.",
        citations: out.citations || [
          { source: "ExecutiveDashboard", ref: "Overview" },
        ],
        chart: out.chart,
        followUps: [
          "Compare ROI across all strategies",
          "Show ARPU impact of 2% churn reduction",
          "Explain churn economics",
        ].slice(0, 3),
      };

      AnswerSchema.parse(answer);
      return answer;
    } else {
      // LLM returned text only - unexpected for numeric path
      console.warn("LLM returned text-only for numeric path");
      const answer: Answer = {
        text:
          res.text ||
          "I understand your question but need more specific details.",
        citations: [{ source: "ExecutiveDashboard", ref: "Overview" }],
        followUps: [
          "Show customer risk distribution",
          "Compare ROI across strategies",
          "Explain churn economics",
        ],
      };
      AnswerSchema.parse(answer);
      return answer;
    }
  } catch (error: any) {
    if (error.message === "planner-timeout") {
      console.warn("⏱️ Planner timeout, throwing to trigger RAG fallback");
    }
    throw error; // Re-throw to trigger RAG fallback
  }
}

/**
 * Handle numeric path without LLM (deterministic fallback)
 */
async function handleNumericPathNoLLM(text: string): Promise<Answer> {
  console.log("⚠️ LLM unavailable, using deterministic fallback");
  const s = text.toLowerCase();

  let out;
  if (s.includes("risk") && (s.includes("distribution") || s.includes("segment"))) {
    out = Tools.get_risk_distribution();
  } else if (s.includes("arpu")) {
    const match = s.match(/(\d+(\.\d+)?)\s*%/);
    const pct = match ? parseFloat(match[1]) : 2;
    out = Tools.compute_arpu_impact({ churnDeltaPct: pct });
  } else if (s.includes("roi") || s.includes("strateg")) {
    out = Tools.get_roi_by_strategy();
  } else if (s.includes("cltv") || s.includes("lifetime")) {
    out = Tools.compute_cltv();
  } else {
    // NO AUTO-DEFAULT TO DRIVERS
    // Instead, suggest the user be more specific
    return {
      text: "I need a more specific question to help you. Try asking about specific metrics like ROI, ARPU, risk distribution, or CLTV.",
      citations: [{ source: "System", ref: "Deterministic fallback" }],
      followUps: [
        "Show customer risk distribution",
        "Compare ROI across strategies",
        "Calculate CLTV",
      ],
    };
  }

  const answer: Answer = {
    text:
      out.text ||
      "Here are the insights from your data (LLM unavailable - using deterministic fallback).",
    citations: out.citations || [
      { source: "ModelingDeepDive", ref: "Data analysis" },
    ],
    chart: out.chart,
    followUps: [
      "Show customer risk distribution",
      "Compare ROI across strategies",
      "Explain churn economics",
    ],
  };

  AnswerSchema.parse(answer);
  return answer;
}

// Initialize context
export function setContext(appData: AppData) {
  console.log("🔧 setContext called");
  setToolsData(appData);

  if (!ragBuilt) {
    const features = (appData.feature_importance?.features || []).map((f) => ({
      feature: f.name,
      definition: f.interpretation,
    }));
    const segments = (appData.segments || []).map((s) => ({
      name: `${s.tenure_band} / ${s.contract_group}`,
      description: `${s.risk_level} risk segment with ${s.customers} customers`,
    }));
    buildRAG({ glossary: GLOSSARY, features, segments });
    ragBuilt = true;
    console.log("✅ Legacy RAG index built");
  }
}

// Export for backwards compatibility
export const aiService = {
  ask: async (question: string) => {
    const answer = await askCopilot({ text: question });

    // Convert to legacy format if needed by existing UI
    return {
      answer: answer.text,
      citations: answer.citations.map((c) => `${c.source}: ${c.ref}`),
      chart: answer.chart ? convertChartToLegacy(answer.chart) : undefined,
      followUps: answer.followUps,
    };
  },
  setContext,
};

function convertChartToLegacy(chart: any) {
  const series = chart.series?.[0];
  if (!series) return undefined;

  if (chart.kind === "donut") {
    const colors = ["#7823DC", "#C8A5F0", "#A5A5A5", "#D2D2D2"];
    const totalCustomers = series.data.reduce(
      (sum: number, d: any) => sum + d.y,
      0
    );

    return {
      type: "donut",
      title: chart.title,
      data: series.data.map((d: any, i: number) => ({
        level: String(d.x),
        customers: d.y,
        percentage: d.y / totalCustomers,
        color: colors[i % colors.length],
      })),
      config: { width: 500, height: 400 },
    };
  }

  const isCurrency =
    chart.yLabel && /\$|dollar|arpu|revenue|price|cost/i.test(chart.yLabel);
  const valueFormatter = isCurrency
    ? (v: number) => `$${v.toFixed(2)}`
    : undefined;

  return {
    type: "bar",
    title: chart.title,
    data: series.data.map((d: any) => ({
      label: String(d.x),
      value: d.y,
      category: String(d.x),
      name: String(d.x),
    })),
    config: {
      width: 600,
      height: 450,
      yAxisLabel: chart.yLabel,
      xAxisLabel: chart.xLabel,
      valueFormatter,
    },
  };
}
