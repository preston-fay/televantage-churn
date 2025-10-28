/**
 * AI Service for Strategy Copilot - LIVE GPT-4o Integration
 *
 * Provides intelligent responses using OpenAI GPT-4o with fallback templates.
 */

import OpenAI from 'openai';
import { AppData } from '@/types/index';

type KnowledgeContext = AppData;

export interface ChartData {
  type: 'bar' | 'donut' | 'line' | 'horizontal-bar';
  title: string;
  data: any;
  config?: any;
}

interface CopilotResponse {
  answer: string;
  citations: string[];
  relatedSegments?: string[];
  chart?: ChartData;
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
      console.log('✅ Strategy Copilot: GPT-4o LIVE mode enabled');
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
        citations: [],
      };
    }

    // Try GPT-4o first if available
    if (this.openai) {
      try {
        return await this.askGPT4o(question);
      } catch (error) {
        console.error('GPT-4o error, falling back to templates:', error);
        // Fall through to templates
      }
    }

    // Fallback to smart templates
    return this.askTemplates(question);
  }

  private async askGPT4o(question: string): Promise<CopilotResponse> {
    const contextSummary = this.buildContextSummary();

    const systemPrompt = `You are an expert data analyst for TeleVantage, analyzing customer churn.

DATA AVAILABLE:
${contextSummary}

RESPONSE FORMAT (JSON):
{
  "answer": "2-3 sentence answer with specific numbers",
  "citations": ["Data source 1", "Data source 2"],
  "relatedSegments": ["Segment 1", "Segment 2"] (optional),
  "chart": {
    "type": "donut|bar|horizontal-bar",
    "title": "Chart title",
    "data": [...],
    "config": {"width": 500, "height": 400}
  } (optional - only if genuinely helpful)
}

CHART FORMATS:
- donut: [{"label": "High Risk", "value": 5000000, "percentage": 25}]
- bar: [{"category": "Budget\\nOpt", "value": 160, "label": "$571M"}]
- horizontal-bar: [{"name": "Contract Type", "value": 14.2}]

RULES:
- Use REAL numbers from the data
- Keep answers brief (2-3 sentences)
- Only add chart if it adds real value
- Use actual segment/feature names from data
- Cite specific sources (ML Agent, Segment Explorer, etc.)
- For risk questions, use risk_distribution data
- For features, use feature_importance data
- For ROI, reference: Budget(160%), Contract(112%), Onboarding(96%)`;

    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      answer: result.answer || "I couldn't generate a response.",
      citations: result.citations || ['AI Analysis'],
      relatedSegments: result.relatedSegments,
      chart: result.chart
    };
  }

  private buildContextSummary(): string {
    if (!this.context) return '';

    const riskLevels = this.context.risk_distribution.risk_levels;
    const topFeatures = this.context.feature_importance.features.slice(0, 5);
    const totalCustomers = this.context.metrics.overview.total_customers;

    return `CUSTOMERS: ${(totalCustomers / 1_000_000).toFixed(1)}M total

RISK:
${riskLevels.map(r => `${r.level}: ${(r.customers / 1_000_000).toFixed(1)}M (${r.percentage}%)`).join(', ')}

TOP CHURN DRIVERS:
${topFeatures.map((f, i) => `${i + 1}. ${f.name} (${(f.importance * 100).toFixed(1)}%): ${f.interpretation}`).join('\n')}

SEGMENTS: ${this.context.segments.length} cohorts
- M2M: 19.9M (42%, 25% churn)
- 1-Year: 16.6M (35%, 12% churn)
- 2-Year: 10.9M (23%, 5% churn)
- Early tenure (0-3mo): 11.8M (40% churn - HIGHEST)

ROI STRATEGIES:
1. Budget Optimization: $220M → $571M (160% ROI)
2. Contract Conversion: $199M → $223M (112% ROI)
3. Onboarding: $50M → $98M (96% ROI)`;
  }

  // Smart template fallback
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
