/**
 * Copilot Intent Detection
 *
 * Detects financial and operational intents from user questions
 * to route to appropriate response templates and data.
 */

export type CopilotIntent =
  | 'arpu'
  | 'irr'
  | 'cltv'
  | 'ebitda'
  | 'nps'
  | 'mrr'
  | 'sac'
  | 'roi'
  | 'financial_overview'
  | 'risk'
  | 'churn_drivers'
  | 'strategies'
  | 'segments'
  | 'generic';

/**
 * Detect intent from user question
 * @param question - User's question text
 * @returns Detected intent type
 */
export function detectIntent(question: string): CopilotIntent {
  const q = question.toLowerCase();

  // Financial KPI intents
  if (/\barpu\b/.test(q)) return 'arpu';
  if (/\birr\b/.test(q)) return 'irr';
  if (/\b(cltv|ltv|lifetime value)\b/.test(q)) return 'cltv';
  if (/\bebitda\b/.test(q)) return 'ebitda';
  if (/\bnps\b|net promoter/.test(q)) return 'nps';
  if (/\bmrr\b|monthly recurring/.test(q)) return 'mrr';
  if (/\bsac\b|acquisition cost/.test(q)) return 'sac';
  if (/\broi\b|return on investment/.test(q)) return 'roi';

  // Financial overview
  if (/(financial|kpi|metric)s?\b|financials/.test(q)) return 'financial_overview';

  // Operational intents (existing)
  if (/risk|distribution|high|medium|low/i.test(q)) return 'risk';
  if (/feature|driver|cause|factor|why|predict/i.test(q)) return 'churn_drivers';
  if (/roi|return|compare|strateg/i.test(q)) return 'strategies';
  if (/segment|cohort|group|customer/i.test(q)) return 'segments';

  return 'generic';
}

/**
 * Get intent display name
 */
export function getIntentName(intent: CopilotIntent): string {
  const names: Record<CopilotIntent, string> = {
    arpu: 'ARPU Analysis',
    irr: 'IRR Analysis',
    cltv: 'CLTV Analysis',
    ebitda: 'EBITDA Analysis',
    nps: 'NPS Analysis',
    mrr: 'MRR Analysis',
    sac: 'SAC Analysis',
    roi: 'ROI Analysis',
    financial_overview: 'Financial Overview',
    risk: 'Risk Analysis',
    churn_drivers: 'Churn Drivers',
    strategies: 'Strategy Comparison',
    segments: 'Segment Analysis',
    generic: 'General Query'
  };

  return names[intent] || 'General Query';
}

/**
 * Get suggested follow-ups based on intent
 */
export function getSuggestedFollowUps(intent: CopilotIntent): string[] {
  const followUps: Record<CopilotIntent, string[]> = {
    arpu: [
      'How does ARPU vary by contract type?',
      'What strategies improve ARPU?',
      'Compare ARPU to industry benchmarks'
    ],
    irr: [
      'Which strategy has the highest IRR?',
      'How is IRR calculated?',
      'Compare IRR to ROI across strategies'
    ],
    cltv: [
      'What factors drive CLTV?',
      'How does churn affect CLTV?',
      'Show CLTV by customer segment'
    ],
    ebitda: [
      'What retention strategies maximize EBITDA?',
      'How does churn reduction impact EBITDA?',
      'Show EBITDA impact by scenario'
    ],
    nps: [
      'How does NPS correlate with churn?',
      'Which segments have highest NPS?',
      'What drives NPS improvements?'
    ],
    mrr: [
      'What is our MRR growth rate?',
      'How does churn affect MRR?',
      'Show MRR by customer segment'
    ],
    sac: [
      'What is the SAC payback period?',
      'How does SAC vary by channel?',
      'Compare SAC to CLTV ratio'
    ],
    roi: [
      'Compare ROI across all strategies',
      'What is the ROI timeline?',
      'Show ROI vs IRR comparison'
    ],
    financial_overview: [
      'Show all financial KPIs',
      'What is our financial health score?',
      'Compare financials to industry benchmarks'
    ],
    risk: [
      'What are the top churn drivers for High Risk customers?',
      'How should we target Medium Risk customers?',
      'Compare High vs Very High risk intervention strategies'
    ],
    churn_drivers: [
      'Why do month-to-month customers churn more?',
      'What\'s the ROI of converting M2M to annual contracts?',
      'Show me early-tenure churn statistics'
    ],
    strategies: [
      'What\'s the optimal retention budget?',
      'How long does Contract Conversion take to implement?',
      'Show me Budget Optimization segment targeting'
    ],
    segments: [
      'Which segments have highest churn risk?',
      'What retention strategies work best for each segment?',
      'Show segment profitability analysis'
    ],
    generic: [
      'Show me customer risk distribution',
      'What are the top churn drivers?',
      'Compare ROI across all strategies',
      'What is our ARPU?'
    ]
  };

  return followUps[intent] || followUps.generic;
}
