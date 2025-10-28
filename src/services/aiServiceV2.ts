/**
 * AI Service V2 - Analyst-Grade Planner→Executor Pipeline
 * Deterministic finance compute + LLM planning + strict validation
 */

import { ENV, hasLLM } from "../config/env";
import { Telemetry } from "./telemetry";
import { Plan, CopilotResponse as CopilotResponseV2 } from "./schemas";
import { plan as makePlan } from "./planner";
import { execute } from "./executor";
import { buildIndex, retrieve, isIndexBuilt } from "./retrieval";
import type { AppData } from "../types";

// Global context (set via setContext)
let CONTEXT: any = null;

const GLOSSARY = [
  { term: "ARPU", def: "Average monthly revenue per active subscriber." },
  { term: "IRR", def: "Annualized effective return from a strategy's cash flows." },
  { term: "CLTV", def: "Lifetime value: net present value of margin per user." },
  { term: "EBITDA", def: "Earnings before interest, taxes, depreciation, amortization." },
  { term: "Churn Rate", def: "Percentage of customers who cancel service in a given period." }
];

/**
 * Set context from AppData
 */
export function setContext(appData: AppData) {
  CONTEXT = {
    risk_distribution: appData.risk_distribution?.risk_levels || [],
    feature_importance: appData.feature_importance?.features || [],
    roi_by_strategy: [
      { strategy: "Budget Optimization", roiPct: 160, savings: 571000000, investment: 220000000, irr: 96 },
      { strategy: "Contract Conversion", roiPct: 112, savings: 223000000, investment: 199000000, irr: 67 },
      { strategy: "Onboarding Excellence", roiPct: 96, savings: 98000000, investment: 50000000, irr: 58 }
    ],
    segments: appData.segments || [],
    financials: {
      arpu: 65,
      churn: 0.02,
      grossMargin: 0.62,
      arpuElasticity: 0.6
    },
    glossary: GLOSSARY
  };

  // Build retrieval index once
  if (!isIndexBuilt()) {
    buildIndex(GLOSSARY, CONTEXT.feature_importance, CONTEXT.segments);
  }
}

/**
 * Main entry point for Strategy Copilot
 */
export async function askCopilot({ text }: { text: string }): Promise<CopilotResponseV2> {
  if (!CONTEXT) {
    throw new Error("Context not initialized. Call setContext() first.");
  }

  let p: Plan | null = null;

  try {
    if (!hasLLM) {
      throw new Error("LLMUnavailable: missing VITE_OPENAI_API_KEY or VITE_OPENAI_MODEL_ID");
    }

    p = await makePlan(text, CONTEXT);
    console.log("✅ Plan generated:", p.intent);
  } catch (e) {
    console.warn("⚠️  Planner failed, using intent-aware fallback:", e);
    Telemetry.fallbacks++;

    // Intent-aware local plan (strong defaults for core questions)
    const s = text.toLowerCase();

    if (s.includes("risk") || s.includes("distribution") || s.includes("segment")) {
      p = {
        intent: "risk_dist",
        operations: [{ op: "slice", from: "risk_distribution" }],
        chart: {
          kind: "donut",
          title: "Customer Risk Distribution by Segment"
        },
        citations: ["ExecutiveDashboard: Risk Tier Donut"],
        narrativeFocus: ["risk concentration", "high-risk targets"]
      } as Plan;
    } else if (s.includes("arpu")) {
      const pct = parseFloat((s.match(/(\d+(\.\d+)?)\s*%/) || [])[1] || "2");
      p = {
        intent: "arpu",
        operations: [{
          op: "compute",
          compute: { kind: "arpuImpact", params: { churnDeltaPct: pct } }
        }],
        chart: {
          kind: "bar",
          title: `ARPU Impact of ${pct}% Churn Reduction`,
          xLabel: "Scenario",
          yLabel: "ARPU ($/month)"
        },
        citations: ["ScenarioPlanner: ARPU Elasticity Model"],
        narrativeFocus: ["ARPU increase", "financial benefit"]
      } as Plan;
    } else if (s.includes("roi") || s.includes("compare") || s.includes("strateg")) {
      p = {
        intent: "roi_compare",
        operations: [{ op: "aggregate", from: "roi_by_strategy" }],
        chart: {
          kind: "bar",
          title: "ROI Comparison Across Retention Strategies",
          xLabel: "Strategy",
          yLabel: "ROI (%)"
        },
        citations: ["ScenarioPlanner: Strategy ROI Analysis"],
        narrativeFocus: ["best strategy", "ROI ranking"]
      } as Plan;
    } else {
      // Default: churn drivers
      p = {
        intent: "drivers",
        operations: [{
          op: "topN",
          from: "feature_importance",
          select: ["feature", "importance"],
          orderBy: { field: "importance", dir: "desc" },
          limit: 10
        }],
        chart: {
          kind: "horizontal-bar",
          title: "Top 10 Churn Drivers (ML Feature Importance)",
          xLabel: "Importance Score",
          yLabel: "Feature"
        },
        citations: ["ModelingDeepDive: Feature Importance Rankings"],
        narrativeFocus: ["top driver", "relative importance"]
      } as Plan;
    }
  }

  // Execute plan
  const { chart, lead } = execute(p!, CONTEXT);
  Telemetry.executed++;

  // Retrieval augmentation
  const hits = retrieve(text, 3);
  const retrievedTerms = hits.map(h => h.term).filter(Boolean);

  const response: CopilotResponseV2 = {
    text: lead || "Analysis complete based on your telco data.",
    citations: p!.citations.map(c => {
      const parts = c.split(":");
      return {
        source: parts[0].trim(),
        ref: parts.slice(1).join(":").trim() || parts[0]
      };
    }),
    chart,
    followUps: [
      "Compare ROI across all retention strategies",
      "Show ARPU impact of 2% churn reduction",
      retrievedTerms[0] ? `Deep dive into ${retrievedTerms[0]}` : "Show risk distribution"
    ].slice(0, 3)
  };

  // Strict validation (will throw if invalid)
  const { CopilotResponse: ResponseSchema } = await import("./schemas");
  ResponseSchema.parse(response);

  console.log("✅ Response validated and ready");
  return response;
}

// Export for backwards compatibility with existing UI
export const aiService = {
  ask: async (question: string) => {
    const v2Response = await askCopilot({ text: question });

    // Convert to legacy format expected by StrategyCopilot component
    return {
      answer: v2Response.text,
      citations: v2Response.citations.map(c => `${c.source}: ${c.ref}`),
      chart: v2Response.chart ? convertChartToLegacy(v2Response.chart) : undefined,
      followUps: v2Response.followUps
    };
  },
  setContext: (appData: AppData) => {
    setContext(appData);
  }
};

function convertChartToLegacy(chart: any) {
  const series = chart.series?.[0];
  if (!series) return undefined;

  if (chart.kind === "donut") {
    return {
      type: "donut",
      title: chart.title,
      data: series.data.map((d: any) => ({
        label: d.x,
        value: d.y,
        percentage: 0
      })),
      config: { width: 500, height: 400 }
    };
  }

  // Bar/horizontal-bar
  return {
    type: chart.kind,
    title: chart.title,
    data: series.data.map((d: any) => ({
      category: d.x,
      name: d.x,
      value: d.y,
      label: String(d.y)
    })),
    config: {
      width: chart.kind === "horizontal-bar" ? 600 : 550,
      height: chart.kind === "horizontal-bar" ? 450 : 400,
      yAxisLabel: chart.yLabel,
      xAxisLabel: chart.xLabel
    }
  };
}
