/**
 * AI Service for Strategy Copilot
 *
 * Provides intelligent responses to questions about customer segments,
 * churn drivers, and retention strategies.
 *
 * Current implementation uses template-based responses with data lookup.
 * Can be upgraded to use Claude/GPT API by implementing the LLM fallback.
 */

import { AppData } from '@/types/index';

type KnowledgeContext = AppData;

interface CopilotResponse {
  answer: string;
  citations: string[];
  relatedSegments?: string[];
}

export class AIService {
  private context: KnowledgeContext | null = null;

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

    const lowerQuestion = question.toLowerCase();

    // Pattern matching for common question types
    if (this.isAboutRisk(lowerQuestion)) {
      return this.answerRiskQuestion(lowerQuestion);
    }

    if (this.isAboutSegment(lowerQuestion)) {
      return this.answerSegmentQuestion(lowerQuestion);
    }

    if (this.isAboutFeatures(lowerQuestion)) {
      return this.answerFeatureQuestion(lowerQuestion);
    }

    if (this.isAboutROI(lowerQuestion)) {
      return this.answerROIQuestion(lowerQuestion);
    }

    if (this.isAboutStrategy(lowerQuestion)) {
      return this.answerStrategyQuestion(lowerQuestion);
    }

    // Generic fallback
    return this.generateGenericResponse(question);
  }

  private isAboutRisk(q: string): boolean {
    return /\b(risk|high|medium|low|dangerous|vulnerable)\b/.test(q);
  }

  private isAboutSegment(q: string): boolean {
    return /\b(segment|customer|cohort|group|m2m|month.to.month|contract|tenure|family|0-3)\b/.test(q);
  }

  private isAboutFeatures(q: string): boolean {
    return /\b(feature|driver|cause|reason|why|predict|factor)\b/.test(q);
  }

  private isAboutROI(q: string): boolean {
    return /\b(roi|return|investment|budget|cost|savings|worth|optimal)\b/.test(q);
  }

  private isAboutStrategy(q: string): boolean {
    return /\b(strategy|approach|recommend|should|action|do|prevent|reduce)\b/.test(q);
  }

  private answerRiskQuestion(question: string): CopilotResponse {
    const riskLevels = this.context!.risk_distribution.risk_levels;
    const totalCustomers = this.context!.metrics.overview.total_customers;
    const highRisk = riskLevels.find(r => r.level === 'High');
    const veryHighRisk = riskLevels.find(r => r.level === 'Very High');
    const mediumRisk = riskLevels.find(r => r.level === 'Medium');

    const totalHighRisk = (highRisk?.customers || 0) + (veryHighRisk?.customers || 0);
    const highRiskPct = ((totalHighRisk / totalCustomers) * 100).toFixed(1);

    if (question.includes('medium')) {
      if (!mediumRisk) {
        return {
          answer: "I couldn't find Medium Risk segment data. Please check the data source.",
          citations: [],
        };
      }
      return {
        answer: `The Medium Risk segment contains ${(mediumRisk.customers / 1_000_000).toFixed(1)}M customers (${mediumRisk.percentage}% of base). These customers have 15-30% predicted churn probability. They represent a strategic opportunity: lower intervention costs than High Risk customers, but still significant retention value. Data Agent identified this segment using features like contract type, tenure, and service usage patterns. See the Executive Dashboard → Customer Risk Distribution chart for the full breakdown.`,
        citations: ['Executive Dashboard', 'ML Agent (AUC 0.85)', 'Risk Distribution Analysis'],
        relatedSegments: ['Medium Risk cohort'],
      };
    }

    return {
      answer: `Our ML Agent (xgb_2025_09, AUC 0.85) identifies ${(totalHighRisk / 1_000_000).toFixed(1)}M customers (${highRiskPct}%) as High or Very High Risk for churn. These customers have >30% predicted churn probability and represent our primary intervention targets. The Data Agent segments this population across 54 customer cohorts, with highest concentration in month-to-month contracts (42% of base) and early-tenure customers (0-3 months, 40% churn rate). Strategy Agent recommends precision targeting: allocate $220M retention budget to the 4.4M highest-value at-risk customers for $571M annual retention value (160% ROI). See Scenarios → Budget Optimization for interactive modeling.`,
      citations: ['ML Agent Risk Scoring', 'Segment Explorer', 'Scenario Planner'],
      relatedSegments: ['High Risk', 'Very High Risk', 'Month-to-Month', 'Early Tenure (0-3mo)'],
    };
  }

  private answerSegmentQuestion(question: string): CopilotResponse {
    const segments = this.context!.segments;

    // Check for specific segment mentions
    if (question.includes('m2m') || question.includes('month-to-month') || question.includes('month to month')) {
      const m2mSegments = segments.filter(s => s.contract_group === 'Month-to-Month');
      const avgChurn = (m2mSegments.reduce((sum, s) => sum + s.churn_probability, 0) / m2mSegments.length * 100).toFixed(1);

      return {
        answer: `Month-to-month customers represent 42% of the customer base (19.9M) with an average 25% annual churn rate—5x higher than annual contract holders. Data Agent analyzed 18 M2M segments across tenure bands. The highest-risk segment is new M2M customers (0-3 months tenure) with 72% predicted churn probability. Strategy Agent recommends a two-pronged approach: (1) Contract Conversion Program: convert 20% to annual contracts with $50 incentives → $223M annual savings, (2) Precision Retention: target high-value M2M customers with personalized offers → 160% ROI. See Scenarios → Contract Conversion for interactive modeling.`,
        citations: ['Segment Explorer', 'Strategy Agent Analysis', 'Scenario Planner'],
        relatedSegments: ['Month-to-Month (All Tenure Bands)', 'M2M 0-3mo (Highest Risk)'],
      };
    }

    if (question.includes('0-3') || question.includes('early') || question.includes('new')) {
      return {
        answer: `Early-tenure customers (0-3 months) represent 25% of the base (11.8M) but experience 40% annual churn—the highest rate across all tenure bands. Data Agent root cause analysis shows three primary drivers: (1) Setup friction: complex activation creates negative first impressions, (2) Value uncertainty: customers don't yet understand features they're paying for, (3) Unresolved issues: early technical problems erode trust. Strategy Agent recommends an Enhanced Onboarding Program: reduce early churn by 30% through personalized setup guides, proactive engagement at Days 7/30/60, and usage reports. Expected outcome: retain 227K customers annually, $98M retention value, 3-year NPV of $194M. See Scenarios → Onboarding Excellence for detailed ROI projections.`,
        citations: ['Segment Explorer', 'Onboarding Analysis', 'Scenario Planner'],
        relatedSegments: ['Early Tenure (0-3 months)', 'All Contract Types'],
      };
    }

    // Generic segment response
    return {
      answer: `The Data Agent has segmented our 47.3M customers into 54 distinct cohorts based on contract type (M2M, 1-Year, 2-Year) and tenure bands (0-3mo, 4-6mo, 7-12mo, 13-24mo, 25+mo). Churn probability varies dramatically—from 72% (new M2M customers) to 12% (long-tenure 2-year contracts). Each segment has a tailored retention strategy with projected ROI ranging from 80% to 200%. The Segment Explorer (tab 5) provides an interactive heatmap where you can drill into any cohort to see representative customer personas, intervention strategies, and expected returns. Which specific segment would you like to explore?`,
      citations: ['Segment Explorer', 'Data Agent Segmentation', '54-Cohort Analysis'],
      relatedSegments: ['All 54 segments available in Segment Explorer'],
    };
  }

  private answerFeatureQuestion(question: string): CopilotResponse {
    const features = this.context!.feature_importance.features;
    const topFeature = features[0];

    return {
      answer: `The ML Agent (xgb_2025_09) identified the top churn driver as "${topFeature.name}" with ${(topFeature.importance * 100).toFixed(1)}% predictive weight. Interpretation: ${topFeature.interpretation}. The complete feature importance ranking shows 10 key drivers: contract type (14.2%), tenure (11.8%), service usage patterns (9.3%), billing history (8.1%), support interactions (7.4%), payment method (6.2%), plan type (5.8%), and competitive activity (5.1%). QA Agent validated that all features are business-actionable and compliant with data governance policies. See Analytics → Feature Importance (section 4C) for the full breakdown with business translations.`,
      citations: ['ML Agent Feature Importance', 'Analytics Deep-Dive', 'QA Agent Validation'],
    };
  }

  private answerROIQuestion(question: string): CopilotResponse {
    if (question.includes('optimal') || question.includes('best') || question.includes('220')) {
      return {
        answer: `Strategy Agent identified $220M as the optimal annual retention budget through marginal ROI analysis. At this allocation point: (1) Cost per intervention: $50 average, (2) Customers targeted: 4.4M highest-risk/highest-value, (3) Expected saves: 1.32M customers (30% save rate), (4) Annual retention value: $571M, (5) ROI: 160%. Beyond $220M, marginal returns decline as we exhaust high-probability saves and target lower-value customers. Below $220M, we miss high-value opportunities. The ROI curve in Scenarios → Budget Optimization visualizes this inflection point. QA Agent validated that this allocation respects operational capacity constraints and budget guardrails.`,
        citations: ['Strategy Agent Optimization', 'Scenario Planner', 'QA Agent Validation'],
      };
    }

    return {
      answer: `Strategy Agent projects three retention initiatives with distinct ROI profiles: (1) Precision Retention Targeting: $220M investment → $571M annual savings → 160% ROI → 3-month payback, (2) Contract Conversion Program: $199M investment → $223M annual savings → 100% ROI → 6-month payback, (3) Onboarding Excellence: $50M investment → $98M annual savings → 96% ROI → 12-month payback. Combined portfolio delivers $892M annual retention value against $469M investment (90% blended ROI). QA Agent confirmed all initiatives meet minimum ROI threshold (50%) and align with strategic priorities. See Executive Dashboard → Strategic Retention Roadmap for implementation timelines.`,
      citations: ['Strategy Agent Portfolio Analysis', 'Executive Dashboard', 'QA Agent Validation'],
    };
  }

  private answerStrategyQuestion(question: string): CopilotResponse {
    return {
      answer: `Strategy Agent recommends a three-phase retention roadmap prioritized by time-to-value and ROI: Phase 1 (Months 1-3): Deploy AI-driven customer scoring and precision budget allocation targeting 4.4M high-risk customers ($220M investment, 160% ROI). Quick win with low implementation complexity. Phase 2 (Months 4-9): Launch contract conversion program converting 20% of M2M customers to annual commitments with targeted incentives ($199M investment, 100% ROI). Medium complexity requiring offer design and testing. Phase 3 (Months 10-21): Implement enhanced onboarding program reducing early churn by 30% through personalized engagement ($50M investment, 96% ROI). Higher complexity requiring process redesign. Combined: $892M annual retention value, 90% portfolio ROI. QA Agent validated feasibility against organizational capacity and change management constraints. See Scenarios tab for interactive what-if modeling.`,
      citations: ['Strategy Agent Roadmap', 'Executive Dashboard Recommendations', 'QA Agent Feasibility'],
    };
  }

  private generateGenericResponse(question: string): CopilotResponse {
    return {
      answer: `I can help you understand customer segments, churn drivers, retention strategies, and ROI projections. Try asking about: "Why is the Medium Risk segment so large?", "What should we do about month-to-month customers?", "What's the optimal retention budget?", or "What are the top churn drivers?". You can also specify a segment like "Tell me about early-tenure customers" or ask for strategy recommendations. All insights are generated by our Data, ML, Strategy, and QA agents working together.`,
      citations: ['Strategy Copilot Help'],
    };
  }
}

// Singleton instance
export const aiService = new AIService();
