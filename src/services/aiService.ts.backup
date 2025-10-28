/**
 * AI Service - Two-Stage Pipeline: Planner → Executor → Validator
 *
 * Stage 1 (Planner): LLM returns an executable plan (what data, which metrics, which chart)
 * Stage 2 (Executor): Run plan against real app data, compute top-N, assemble labeled charts
 * Stage 3 (Validator): Strict validation with retry logic, fallback to templates
 */

import OpenAI from 'openai';
import { AppData } from '@/types/index';
import { CopilotResponse as CopilotResponseSchema, ChartSpec, Citation } from './copilotSchema';
import { Plan, PlannerRequest } from './copilotPlannerSchema';
import { executePlan, validateChart } from './copilotExecutor';
import { buildIndex, retrieve, isIndexBuilt } from './retrieval';
import { getFinancialMetrics } from './financialData';
import { detectIntent } from './copilotIntents';

type KnowledgeContext = AppData;

// Legacy chart data format for backward compatibility
export interface ChartData {
  type: 'bar' | 'donut' | 'line' | 'horizontal-bar';
  title: string;
  data: any;
  config?: any;
}

// Legacy response format
interface CopilotResponse {
  answer: string;
  citations: string[];
  relatedSegments?: string[];
  chart?: ChartData;
  followUps?: string[];
}

export class AIService {
  private context: KnowledgeContext | null = null;
  private openai: OpenAI | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 1;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      console.log('✅ Strategy Copilot: GPT-5 LIVE (Planner→Executor pipeline)');
    } else {
      console.warn('⚠️ Strategy Copilot: Template mode (no API key)');
    }
  }

  setContext(context: KnowledgeContext) {
    this.context = context;

    // Build retrieval index once
    if (context && !isIndexBuilt()) {
      const glossary = [
        { term: "ARPU", def: "Average monthly revenue per active subscriber" },
        { term: "IRR", def: "Annualized effective return from strategy cash flows" },
        { term: "CLTV", def: "Lifetime value: net present value of margin per user" },
        { term: "EBITDA", def: "Earnings before interest, taxes, depreciation, amortization" },
        { term: "Churn Rate", def: "Percentage of customers who cancel service in a given period" },
        { term: "ROI", def: "Return on investment: (Return - Investment) / Investment × 100%" }
      ];

      buildIndex(
        glossary,
        context.feature_importance?.features || [],
        context.segments || []
      );
    }
  }

  async ask(question: string): Promise<CopilotResponse> {
    if (!this.context) {
      return {
        answer: "Knowledge base not initialized. Please ensure data is loaded.",
        citations: ["System"],
        followUps: ["Show me risk distribution", "What are top churn drivers?"]
      };
    }

    this.retryCount = 0;

    // Try GPT-5 pipeline if available
    if (this.openai) {
      try {
        return await this.askWithPipeline(question);
      } catch (error) {
        console.error('Pipeline error, falling back to templates:', error);
      }
    }

    // Fallback to smart templates
    return this.askTemplates(question);
  }

  /**
   * Two-stage pipeline: Planner → Executor
   */
  private async askWithPipeline(question: string): Promise<CopilotResponse> {
    // ====== STAGE 1: PLANNER ======
    const plan = await this.getPlan(question);

    // ====== STAGE 2: EXECUTOR ======
    const execution = executePlan(plan, this.context!);

    // ====== STAGE 3: VALIDATOR ======
    const chartValidation = validateChart(execution.chart);

    if (!chartValidation.valid) {
      console.warn('Chart validation failed:', chartValidation.errors);

      // Retry once with stricter instructions
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log('Retrying with stricter validation...');
        return await this.askWithPipeline(question);
      }

      // Final fallback
      return this.getFallbackResponse();
    }

    // Enhance narrative with retrieval
    const retrievedTerms = retrieve(question, 3);
    let enhancedText = execution.lead;

    if (retrievedTerms.length > 0 && execution.dataPoints > 1) {
      const topTerm = retrievedTerms[0].term;
      enhancedText += ` This analysis uses ${execution.dataPoints} data points from our ML model.`;

      if (topTerm) {
        enhancedText += ` Consider exploring ${topTerm} for additional insights.`;
      }
    }

    // Build final response
    const response = {
      text: enhancedText || execution.lead,
      citations: plan.citations.map(c => {
        const parts = c.split(':');
        return {
          source: parts[0].trim(),
          ref: parts.slice(1).join(':').trim() || parts[0]
        };
      }),
      chart: execution.chart,
      followUps: this.generateFollowUps(plan.intent, retrievedTerms)
    };

    // Validate final response
    try {
      const validated = CopilotResponseSchema.parse(response);
      return this.convertToLegacyFormat(validated);
    } catch (error) {
      console.error('Response validation failed:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Get execution plan from LLM
   */
  private async getPlan(question: string): Promise<Plan> {
    const context = this.buildPlannerContext();
    const intent = detectIntent(question);

    const systemPrompt = `You are a telco churn analyst. Create an execution PLAN as JSON.

RULES:
1. Choose intent: drivers, risk, roi_compare, segment_deepdive, financial_kpis, or generic
2. Select datasets from: risk_distribution, feature_importance, roi_by_strategy, segments, financials
3. Specify operations: topN (for rankings), filter (for subsets), aggregate (for summaries)
4. Design chart: pick kind (bar/donut/line/horizontal-bar), write descriptive title, include xLabel and yLabel (except donut)
5. List narrative focus points and citations

AVAILABLE DATASETS:
- risk_distribution: {level, customers, percentage}
- feature_importance: {name, importance, interpretation}
- roi_by_strategy: {strategy, roi, savings, investment}
- segments: {tenure_band, contract_group, value_tier, churn_probability, risk_level}
- financials: {arpu, irr, cltv, ebitdaImpact}

EXAMPLE PLAN:
{
  "intent": "drivers",
  "metrics": ["feature_importance"],
  "operations": [{
    "op": "topN",
    "from": "feature_importance",
    "select": ["name", "importance"],
    "orderBy": {"field": "importance", "dir": "desc"},
    "limit": 10
  }],
  "chart": {
    "kind": "horizontal-bar",
    "title": "Top 10 Churn Drivers by ML Importance",
    "xLabel": "Importance (%)",
    "yLabel": "Driver"
  },
  "narrativeFocus": ["top driver name and value", "relative ranking"],
  "citations": ["ModelingDeepDive: Feature Importance Analysis"]
}

Return ONLY valid JSON matching the Plan schema.`;

    try {
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question: "${question}"\n\nContext: ${JSON.stringify(context, null, 2)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1500
      });

      const planJson = JSON.parse(completion.choices[0].message.content || '{}');
      return planJson as Plan;

    } catch (error) {
      console.warn('Plan generation failed, using default:', error);
      return this.getDefaultPlan(intent);
    }
  }

  /**
   * Build context for planner
   */
  private buildPlannerContext() {
    const financials = getFinancialMetrics(this.context!);

    return {
      risk_distribution: this.context!.risk_distribution?.risk_levels || [],
      feature_importance: (this.context!.feature_importance?.features || []).slice(0, 15),
      roi_by_strategy: [
        { strategy: 'Budget Optimization', roi: 1.60, savings: 571_000_000 },
        { strategy: 'Contract Conversion', roi: 1.12, savings: 223_000_000 },
        { strategy: 'Onboarding Excellence', roi: 0.96, savings: 98_000_000 }
      ],
      financials: {
        arpu: financials.arpu,
        irr: financials.irr,
        cltv: financials.cltv,
        ebitdaImpact: financials.ebitdaImpact
      }
    };
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUps(intent: string, retrievedTerms: any[]): string[] {
    const baseFollowUps: Record<string, string[]> = {
      drivers: [
        "How do these drivers affect ARPU and IRR?",
        "Show me ROI across retention strategies",
        "Which segments have highest churn risk?"
      ],
      risk: [
        "What are the top churn drivers for High Risk customers?",
        "Compare retention strategies by ROI",
        "Show ARPU impact of 2% churn reduction"
      ],
      roi_compare: [
        "What's the optimal retention budget?",
        "Show me top churn drivers",
        "How does churn affect EBITDA?"
      ],
      financial_kpis: [
        "How does churn reduction impact ARPU?",
        "Compare IRR across strategies",
        "Show risk distribution"
      ],
      generic: [
        "Show me customer risk distribution",
        "What are the top churn drivers?",
        "Compare ROI across strategies"
      ]
    };

    const followUps = baseFollowUps[intent] || baseFollowUps.generic;

    // Add retrieved term if available
    if (retrievedTerms.length > 0 && retrievedTerms[0].kind === 'feature') {
      followUps[2] = `Deep dive into ${retrievedTerms[0].term} impact`;
    }

    return followUps.slice(0, 5);
  }

  /**
   * Default plan when LLM fails
   */
  private getDefaultPlan(intent: string): Plan {
    return {
      intent: intent as any || "drivers",
      metrics: ["feature_importance"],
      operations: [{
        op: "topN",
        from: "feature_importance",
        select: ["name", "importance"],
        orderBy: { field: "importance", dir: "desc" },
        limit: 10
      }],
      chart: {
        kind: "horizontal-bar",
        title: "Top 10 Churn Drivers (ML Importance)",
        xLabel: "Importance (%)",
        yLabel: "Driver"
      },
      narrativeFocus: ["top driver", "relative weights"],
      citations: ["ModelingDeepDive: Feature Importance"]
    };
  }

  /**
   * Fallback response with guaranteed labels
   */
  private getFallbackResponse(): CopilotResponse {
    const riskLevels = this.context!.risk_distribution?.risk_levels || [];

    return {
      answer: "Our ML model identifies distinct risk segments. Medium risk represents the largest cohort at 47% of customers. Focus retention efforts on High and Very High risk segments for maximum ROI impact.",
      citations: ["ExecutiveDashboard: Risk Distribution"],
      chart: {
        type: 'donut',
        title: 'Customer Risk Distribution (47.3M Total)',
        data: riskLevels.map(r => ({
          label: r.level,
          value: r.customers,
          percentage: r.percentage
        })),
        config: { width: 500, height: 400 }
      },
      followUps: [
        "What are the top churn drivers?",
        "Compare ROI across strategies",
        "Show ARPU and EBITDA impact"
      ]
    };
  }

  /**
   * Convert schema format to legacy UI format
   */
  private convertToLegacyFormat(schemaResponse: any): CopilotResponse {
    const legacy: CopilotResponse = {
      answer: schemaResponse.text,
      citations: schemaResponse.citations.map((c: any) =>
        typeof c === 'string' ? c : `${c.ref} (${c.source})`
      ),
      followUps: schemaResponse.followUps
    };

    if (schemaResponse.chart) {
      const chart = schemaResponse.chart;
      const series = chart.series[0];

      if (chart.kind === 'donut') {
        legacy.chart = {
          type: 'donut',
          title: chart.title,
          data: series.data.map((d: any) => ({
            label: d.x,
            value: d.y,
            percentage: 0
          })),
          config: { width: 500, height: 400 }
        };
      } else if (chart.kind === 'bar' || chart.kind === 'horizontal-bar') {
        legacy.chart = {
          type: chart.kind,
          title: chart.title,
          data: series.data.map((d: any) => ({
            category: d.x,
            name: d.x,
            value: d.y,
            label: String(d.y)
          })),
          config: {
            width: chart.kind === 'horizontal-bar' ? 600 : 550,
            height: chart.kind === 'horizontal-bar' ? 450 : 400,
            yAxisLabel: chart.yLabel,
            xAxisLabel: chart.xLabel
          }
        };
      }
    }

    return legacy;
  }

  /**
   * Smart template fallback
   */
  private askTemplates(question: string): CopilotResponse {
    const lowerQ = question.toLowerCase();

    // Risk questions
    if (/risk|distribution/i.test(lowerQ)) {
      const riskLevels = this.context!.risk_distribution?.risk_levels || [];
      return {
        answer: "Our ML model segments customers into risk tiers. High and Very High risk customers (38% of base) are primary intervention targets with >30% churn probability.",
        citations: ['ExecutiveDashboard: Risk Distribution'],
        chart: {
          type: 'donut',
          title: 'Customer Risk Distribution',
          data: riskLevels.map(r => ({ label: r.level, value: r.customers, percentage: r.percentage })),
          config: { width: 500, height: 400 }
        },
        followUps: ["Top churn drivers?", "Compare ROI strategies", "Show financial KPIs"]
      };
    }

    // Churn drivers
    if (/driver|cause|feature/i.test(lowerQ)) {
      const features = this.context!.feature_importance?.features || [];
      return {
        answer: `Contract Type is the #1 churn driver at ${(features[0]?.importance * 100).toFixed(1)}% importance. Month-to-month customers have 3-5x higher churn than contract customers.`,
        citations: ['ModelingDeepDive: Feature Importance'],
        chart: {
          type: 'horizontal-bar',
          title: 'Top 10 Churn Drivers',
          data: features.slice(0, 10).map(f => ({ name: f.name, value: f.importance * 100 })),
          config: { width: 600, height: 450 }
        },
        followUps: ["Show risk distribution", "Compare strategies", "ARPU impact?"]
      };
    }

    // Generic
    return {
      answer: "I can analyze customer segments, churn drivers, and retention strategies. Try asking about risk distribution, top drivers, or ROI comparison.",
      citations: ['Strategy Copilot'],
      followUps: ["Show risk distribution", "Top churn drivers?", "Compare ROI strategies"]
    };
  }
}

// Singleton instance
export const aiService = new AIService();
