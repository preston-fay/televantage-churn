/**
 * Planner Module - LLM-based query planning
 * LLM decides which operations and metrics to use; executor does the actual work
 */

import { ENV } from "../config/env";
import { Telemetry } from "./telemetry";
import type { Plan } from "./schemas";
import { Plan as PlanSchema } from "./schemas";

async function llm(messages: any) {
  Telemetry.llmCalls++;

  const res = await fetch(`${ENV.OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: ENV.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages
    })
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`LLM ${res.status}: ${text}`);
    Telemetry.log(error);
    throw error;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function plan(question: string, ctx: any): Promise<Plan> {
  const sys = [
    "You are a telco churn analyst creating execution plans.",
    "Return ONLY valid JSON matching the Plan schema.",
    "Pick intent from: arpu, cltv, irr, roi_compare, risk_dist, drivers, segment_deepdive, financial_kpis, generic.",
    "If the question asks about ARPU impact or churn reduction effect on ARPU, use: { op:'compute', compute:{ kind:'arpuImpact', params:{ churnDeltaPct:2 } } }",
    "If it asks risk distribution or segments, use: { op:'slice', from:'risk_distribution' } with donut chart.",
    "If it asks about churn drivers or features, use: { op:'topN', from:'feature_importance', orderBy:{field:'importance',dir:'desc'}, limit:10 }",
    "If it asks ROI comparison, use: { op:'aggregate', from:'roi_by_strategy' }",
    "Always include chart.title (descriptive, 5+ words), chart.xLabel, chart.yLabel (except donut).",
    "Include citations like 'ExecutiveDashboard: Risk Tier Analysis' or 'ScenarioPlanner: ARPU Model'.",
    "narrativeFocus should list 2-3 key points to emphasize in the response text."
  ].join("\n");

  const contextSummary = {
    risk_levels: ctx.risk_distribution?.length || 0,
    features: ctx.feature_importance?.length || 0,
    strategies: 3,
    financials: { arpu: ctx.financials?.arpu || 65, churn: ctx.financials?.churn || 0.02 }
  };

  try {
    const content = await llm([
      { role: "system", content: sys },
      {
        role: "user",
        content: `Question: "${question}"\n\nContext summary: ${JSON.stringify(contextSummary)}`
      }
    ]);

    const planData = JSON.parse(content);
    const validatedPlan = PlanSchema.parse(planData);
    Telemetry.planned++;
    return validatedPlan;
  } catch (error) {
    Telemetry.log(error);
    throw new Error("Planner failed: " + (error instanceof Error ? error.message : String(error)));
  }
}
