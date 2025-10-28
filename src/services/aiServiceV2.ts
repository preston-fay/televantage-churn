/**
 * AI Service V3 - Production-grade LLM Data Analyst
 * Clean architecture: LLM + Tool-calling + RAG + Strict validation
 */

import { HAS_LLM } from "../config/env";
import { llmWithTools } from "../ai/runtime";
import { Tools, setToolsData } from "../ai/tools";
import { ragSearch, buildRAG } from "../ai/rag";
import { Answer, Answer as AnswerSchema } from "../ai/schemas";
import type { AppData } from "../types";

// Glossary for RAG
const GLOSSARY = [
  { term:"ARPU", def:"Average monthly revenue per active subscriber." },
  { term:"IRR", def:"Annualized effective return from strategy cash flows." },
  { term:"CLTV", def:"Lifetime value: net present value of margin per user." },
  { term:"EBITDA", def:"Earnings before interest, taxes, depreciation, amortization." },
  { term:"Churn Rate", def:"Percentage of customers who cancel service in a given period." }
];

let ragBuilt = false;

export async function askCopilot({ text }: { text: string }): Promise<Answer> {
  console.log("🎯 askCopilot called with:", text);

  try {
    if (HAS_LLM) {
      console.log("✅ LLM available, calling OpenAI with function calling");
      const res = await llmWithTools(text);

      if (res.fromTool) {
        console.log("🔧 Tool executed:", res.fn, "with args:", res.args);
        const { out } = res;
        const hits = ragSearch(text, 3);

        const answer: Answer = {
          text: out.text || "Here are the insights based on your telco data.",
          citations: out.citations || [{ source:"ExecutiveDashboard", ref:"Overview" }],
          chart: out.chart,
          followUps: [
            "Compare ROI across all strategies",
            "Show ARPU impact of 2% churn reduction",
            ...(hits.length ? [`Tell me about ${hits[0].term}`] : ["Show top churn drivers"])
          ].slice(0, 3)
        };

        AnswerSchema.parse(answer);
        console.log("✅ Answer validated and ready");
        return answer;
      } else {
        // LLM returned text only without tool call
        console.log("📝 LLM returned text-only response");
        const answer: Answer = {
          text: res.text || "Based on the data, here are the key considerations.",
          citations: [{ source:"ExecutiveDashboard", ref:"Overview" }],
          followUps: ["Show customer risk distribution", "Show ARPU impact of 2% churn reduction", "Compare ROI across strategies"]
        };
        AnswerSchema.parse(answer);
        return answer;
      }
    }

    // No LLM: intelligent deterministic fallback
    console.log("⚠️  LLM unavailable, using deterministic fallback");
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
      // Default: feature importance
      out = Tools.get_feature_importance({ topN: 10 });
    }

    const answer: Answer = {
      text: out.text || "Here are the top insights from your data (LLM unavailable - using deterministic fallback).",
      citations: out.citations || [{ source:"ModelingDeepDive", ref:"Data analysis" }],
      chart: out.chart,
      followUps: ["Show customer risk distribution", "Show ARPU impact of 2% churn reduction", "Compare ROI across strategies"]
    };

    AnswerSchema.parse(answer);
    return answer;

  } catch (e: any) {
    console.error("❌ Error in askCopilot:", e);
    // Hard fallback on any error
    const out = Tools.get_feature_importance({ topN: 10 });
    const answer: Answer = {
      text: `I encountered an error (${e.message}), but here are the top churn drivers from the model.`,
      citations: [{ source:"ModelingDeepDive", ref:"Feature importance" }],
      chart: out.chart,
      followUps: ["Show customer risk distribution", "Compare ROI across strategies"]
    };
    AnswerSchema.parse(answer);
    return answer;
  }
}

// Initialize context
export function setContext(appData: AppData) {
  console.log("🔧 setContext called");
  setToolsData(appData);

  if (!ragBuilt) {
    const features = (appData.feature_importance?.features || []).map(f => ({
      feature: f.name,
      definition: f.interpretation
    }));
    const segments = (appData.segments || []).map(s => ({
      name: `${s.tenure_band} / ${s.contract_group}`,
      description: `${s.risk_level} risk segment with ${s.customers} customers`
    }));
    buildRAG({ glossary: GLOSSARY, features, segments });
    ragBuilt = true;
    console.log("✅ RAG index built");
  }
}

// Export for backwards compatibility
export const aiService = {
  ask: async (question: string) => {
    const answer = await askCopilot({ text: question });

    // Convert to legacy format if needed by existing UI
    return {
      answer: answer.text,
      citations: answer.citations.map(c => `${c.source}: ${c.ref}`),
      chart: answer.chart ? convertChartToLegacy(answer.chart) : undefined,
      followUps: answer.followUps
    };
  },
  setContext
};

function convertChartToLegacy(chart: any) {
  const series = chart.series?.[0];
  if (!series) return undefined;

  if (chart.kind === "donut") {
    // DonutChart expects: { level, customers, percentage, color }
    const colors = ['#7823DC', '#C8A5F0', '#A5A5A5', '#D2D2D2'];
    const totalCustomers = series.data.reduce((sum: number, d: any) => sum + d.y, 0);

    return {
      type: "donut",
      title: chart.title,
      data: series.data.map((d: any, i: number) => ({
        level: String(d.x),
        customers: d.y,
        percentage: d.y / totalCustomers,
        color: colors[i % colors.length]
      })),
      config: { width: 500, height: 400 }
    };
  }

  // Bar/horizontal-bar - HorizontalBarChart expects: { label, value }
  return {
    type: "bar",
    title: chart.title,
    data: series.data.map((d: any) => ({
      label: String(d.x),
      value: d.y,
      category: String(d.x),
      name: String(d.x)
    })),
    config: {
      width: 600,
      height: 450,
      yAxisLabel: chart.yLabel,
      xAxisLabel: chart.xLabel
    }
  };
}
