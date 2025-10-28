/**
 * AI Service for Strategy Copilot - GPT-5 Integration with Schema Validation
 *
 * Provides intelligent, grounded responses using OpenAI GPT-5 with strict validation.
 */

import OpenAI from 'openai';
import { AppData } from '@/types/index';
import { CopilotResponse as CopilotResponseSchema } from './copilotSchema';
import {
  buildFullContext,
  getRiskDistribution,
  getChurnDrivers,
  getCustomerStats,
  getROIStrategies,
  getHighRiskCustomers,
  getRiskChartData,
  getFeatureChartData,
  findRelatedSegments,
  getSegmentSummary
} from './copilotData';

type KnowledgeContext = AppData;

// Legacy chart data format for backward compatibility
export interface ChartData {
  type: 'bar' | 'donut' | 'line' | 'horizontal-bar';
  title: string;
  data: any;
  config?: any;
}

// Legacy response format (converted from schema)
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

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // For demo - use backend in production
      });
      console.log('✅ Strategy Copilot: GPT-5 LIVE mode enabled');
    } else {
      console.warn('⚠️ Strategy Copilot: Running in template mode (no API key)');
    }
  }

  setContext(context: KnowledgeContext) {
    this.context = context;
  }

  async ask(question: string): Promise<CopilotResponse> {
    if (!this.context) {
      return {
        answer: "Knowledge base not initialized. Please ensure data is loaded.",
        citations: ["System"],
      };
    }

    // Try GPT-5 first if available
    if (this.openai) {
      try {
        return await this.askGPT5(question);
      } catch (error) {
        console.error('GPT-5 error, falling back to templates:', error);
        // Fall through to templates
      }
    }

    // Fallback to smart templates
    return this.askTemplates(question);
  }

  private async askGPT5(question: string): Promise<CopilotResponse> {
    const contextData = buildFullContext(this.context!);

    const systemPrompt = `You are an expert data analyst for TeleVantage, analyzing customer churn data.

AVAILABLE DATA:
${contextData}

YOUR TASK:
Answer the user's question with REAL data from above. ALWAYS follow this response structure:

{
  "text": "2-4 sentence answer with specific numbers from the data",
  "citations": [
    {"source": "ExecutiveDashboard|ScenarioPlanner|SegmentExplorer|AIPoweredIntelligence|ModelingDeepDive", "ref": "specific metric or chart name"}
  ],
  "chart": {
    "kind": "bar|donut|line|horizontal-bar",
    "title": "Descriptive Chart Title",
    "xLabel": "X-axis label",
    "yLabel": "Y-axis label",
    "series": [
      {"name": "Series Name", "data": [{"x": "Category", "y": 123.45}]}
    ]
  },
  "relatedSegments": ["Segment description 1", "Segment description 2"],
  "followUps": [
    "What about...",
    "How does...",
    "Compare..."
  ]
}

RULES:
1. TEXT: Always 20+ characters, use EXACT numbers from the data provided
2. CITATIONS: Minimum 1, reference specific tabs/charts (e.g., "Risk Distribution Chart" from "SegmentExplorer")
3. CHART: Optional - only include if it genuinely adds value and helps answer the question
   - Always include descriptive title
   - Include xLabel and yLabel when appropriate
   - Use exact data values from context
   - Chart types:
     * donut: for distributions (risk levels, contract types)
     * bar: for comparisons (ROI strategies)
     * horizontal-bar: for rankings (top churn drivers)
     * line: for trends (not commonly used in this dataset)
4. RELATED SEGMENTS: 2-3 relevant customer segments based on the question
5. FOLLOW-UPS: 2-5 specific follow-up questions the user might want to ask

EXAMPLES OF GOOD RESPONSES:

Q: "Show me risk distribution"
A: {
  "text": "Our ML model identifies 5.0M customers as High Risk and 2.5M as Very High Risk (combined 15.8% of base). These customers have >30% churn probability and are primary intervention targets. The Medium Risk segment is our largest at 47.3% of customers.",
  "citations": [{"source": "SegmentExplorer", "ref": "Risk Distribution Chart"}],
  "chart": {
    "kind": "donut",
    "title": "Customer Risk Distribution (47.3M Total)",
    "series": [{
      "name": "Customers",
      "data": [
        {"x": "Low", "y": 8100000},
        {"x": "Medium", "y": 22400000},
        {"x": "High", "y": 14400000},
        {"x": "Very High", "y": 2500000}
      ]
    }]
  },
  "relatedSegments": ["0-3 Months | Month-to-Month | Low Value", "3-6 Months | Month-to-Month | Medium Value"],
  "followUps": [
    "What are the top churn drivers for High Risk customers?",
    "How should we target Medium Risk customers?",
    "Compare High vs Very High risk intervention strategies"
  ]
}

Q: "What are top churn drivers?"
A: {
  "text": "The #1 churn driver is Contract Type with 14.2% predictive weight - month-to-month customers have 3-5x higher churn than contract customers. Tenure follows at 12.8% importance, with early-tenure (0-3 months) showing 40% churn rates.",
  "citations": [{"source": "ModelingDeepDive", "ref": "Feature Importance Analysis"}],
  "chart": {
    "kind": "horizontal-bar",
    "title": "Top 10 Churn Predictors (ML Importance)",
    "yLabel": "Feature",
    "xLabel": "Importance (%)",
    "series": [{
      "name": "Importance",
      "data": [
        {"x": "Contract Type", "y": 14.2},
        {"x": "Tenure", "y": 12.8},
        {"x": "Monthly Charges", "y": 11.5}
      ]
    }]
  },
  "relatedSegments": ["Month-to-Month contract customers", "Early tenure (0-3 months) customers"],
  "followUps": [
    "Why do month-to-month customers churn more?",
    "What's the ROI of converting M2M to annual contracts?",
    "Show me early-tenure churn statistics"
  ]
}

Q: "Compare ROI strategies"
A: {
  "text": "Three retention strategies show positive ROI: Budget Optimization leads at 160% ROI ($220M → $571M), Contract Conversion delivers 112% ROI ($199M → $223M), and Onboarding Excellence achieves 96% ROI ($50M → $98M). Combined blended portfolio ROI is 90%.",
  "citations": [{"source": "ScenarioPlanner", "ref": "ROI Analysis"}],
  "chart": {
    "kind": "bar",
    "title": "Retention Strategy ROI Comparison",
    "xLabel": "Strategy",
    "yLabel": "ROI (%)",
    "series": [{
      "name": "ROI",
      "data": [
        {"x": "Budget Optimization", "y": 160},
        {"x": "Contract Conversion", "y": 112},
        {"x": "Onboarding Excellence", "y": 96}
      ]
    }]
  },
  "followUps": [
    "What's the optimal retention budget?",
    "How long does Contract Conversion take to implement?",
    "Show me Budget Optimization segment targeting"
  ]
}

Now answer the user's question following this exact structure.`;

    const response = await this.openai!.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const rawResponse = JSON.parse(response.choices[0].message.content || '{}');

    // Validate with zod schema
    const validatedResponse = CopilotResponseSchema.parse(rawResponse);

    // Convert schema format to legacy format for backward compatibility
    return this.convertToLegacyFormat(validatedResponse);
  }

  /**
   * Convert new schema format to legacy UI format
   */
  private convertToLegacyFormat(schemaResponse: any): CopilotResponse {
    const legacy: CopilotResponse = {
      answer: schemaResponse.text,
      citations: schemaResponse.citations.map((c: any) =>
        `${c.ref} (${c.source})`
      ),
      relatedSegments: schemaResponse.relatedSegments,
      followUps: schemaResponse.followUps
    };

    // Convert chart format if present
    if (schemaResponse.chart) {
      const chart = schemaResponse.chart;
      const series = chart.series[0]; // Use first series

      // Convert to legacy chart data format
      if (chart.kind === 'donut') {
        legacy.chart = {
          type: 'donut',
          title: chart.title,
          data: series.data.map((d: any) => ({
            label: d.x,
            value: d.y,
            percentage: 0 // Will be calculated by chart component
          })),
          config: { width: 500, height: 400 }
        };
      } else if (chart.kind === 'bar') {
        legacy.chart = {
          type: 'bar',
          title: chart.title,
          data: series.data.map((d: any) => ({
            category: d.x,
            value: d.y,
            label: `${d.y.toFixed(0)}${chart.yLabel?.includes('%') ? '%' : ''}`
          })),
          config: {
            width: 550,
            height: 400,
            yAxisLabel: chart.yLabel || 'Value'
          }
        };
      } else if (chart.kind === 'horizontal-bar') {
        legacy.chart = {
          type: 'horizontal-bar',
          title: chart.title,
          data: series.data.map((d: any) => ({
            name: d.x,
            value: d.y
          })),
          config: {
            width: 600,
            height: 450,
            valueFormatter: (v: number) => `${v.toFixed(1)}%`
          }
        };
      } else if (chart.kind === 'line') {
        legacy.chart = {
          type: 'line',
          title: chart.title,
          data: series.data.map((d: any) => ({
            x: d.x,
            y: d.y
          })),
          config: { width: 600, height: 400 }
        };
      }
    }

    return legacy;
  }

  // Smart template fallback (unchanged from before)
  private askTemplates(question: string): CopilotResponse {
    const lowerQ = question.toLowerCase();

    // Risk questions
    if (/risk|distribution|high|medium|low/i.test(lowerQ)) {
      const riskLevels = this.context!.risk_distribution.risk_levels;
      const high = riskLevels.find(r => r.level === 'High');
      const veryHigh = riskLevels.find(r => r.level === 'Very High');
      const totalHigh = ((high?.customers || 0) + (veryHigh?.customers || 0)) / 1_000_000;

      return {
        answer: `Our ML Agent identifies ${totalHigh.toFixed(1)}M customers as High/Very High Risk (>30% churn probability). These are our primary intervention targets. The chart shows the full risk distribution across all segments.`,
        citations: ['ML Agent (AUC 0.85)', 'Risk Distribution'],
        chart: {
          type: 'donut',
          title: 'Customer Risk Distribution',
          data: riskLevels.map(r => ({ label: r.level, value: r.customers, percentage: r.percentage })),
          config: { width: 500, height: 400 }
        }
      };
    }

    // Feature/driver questions
    if (/feature|driver|cause|factor|why|predict/i.test(lowerQ)) {
      const features = this.context!.feature_importance.features;
      const top = features[0];

      return {
        answer: `The top churn driver is "${top.name}" with ${(top.importance * 100).toFixed(1)}% predictive weight. ${top.interpretation} The chart shows the top 10 drivers ranked by ML importance.`,
        citations: ['ML Agent', 'Feature Importance Analysis'],
        chart: {
          type: 'horizontal-bar',
          title: 'Top 10 Churn Drivers',
          data: features.slice(0, 10).map(f => ({ name: f.name, value: f.importance * 100 })),
          config: { width: 600, height: 450, valueFormatter: (v: number) => `${v.toFixed(1)}%` }
        }
      };
    }

    // ROI comparison
    if (/roi|return|compare|strateg/i.test(lowerQ)) {
      return {
        answer: `Three retention strategies with distinct ROI profiles: Budget Optimization (160% ROI, $571M savings), Contract Conversion (112% ROI, $223M savings), and Onboarding Excellence (96% ROI, $98M savings). Combined portfolio delivers 90% blended ROI.`,
        citations: ['Strategy Agent', 'ROI Analysis'],
        chart: {
          type: 'bar',
          title: 'ROI Comparison Across Strategies',
          data: [
            { category: 'Budget\nOptimization', value: 160, label: '$571M' },
            { category: 'Contract\nConversion', value: 112, label: '$223M' },
            { category: 'Onboarding\nExcellence', value: 96, label: '$98M' }
          ],
          config: { width: 550, height: 400, valueFormatter: (v: number) => `${v}%`, yAxisLabel: 'ROI (%)' }
        }
      };
    }

    // Generic
    return {
      answer: `I can analyze customer segments, churn drivers, and retention strategies. Try: "Show me risk distribution", "What are the top churn drivers?", or "Compare ROI across strategies".`,
      citations: ['Strategy Copilot'],
    };
  }
}

// Singleton instance
export const aiService = new AIService();
