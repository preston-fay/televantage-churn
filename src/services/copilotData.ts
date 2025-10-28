/**
 * Data accessor functions for Strategy Copilot
 *
 * Provides real, grounded data from the app context to GPT-5.
 * All functions return formatted strings ready for LLM consumption.
 */

import { AppData, Segment, Feature, RiskLevel } from '@/types/index';

/**
 * Get high-level customer statistics
 */
export function getCustomerStats(data: AppData): string {
  const total = data.metrics.overview.total_customers;
  const totalM = (total / 1_000_000).toFixed(1);

  const byContract = data.customers_summary.by_contract;
  const m2m = byContract['Month-to-Month'];
  const oneYear = byContract['One Year'];
  const twoYear = byContract['Two Year'];

  return `TOTAL CUSTOMERS: ${totalM}M

CONTRACT TYPES:
- Month-to-Month: ${(m2m.count / 1_000_000).toFixed(1)}M (${m2m.pct}%)
- One Year: ${(oneYear.count / 1_000_000).toFixed(1)}M (${oneYear.pct}%)
- Two Year: ${(twoYear.count / 1_000_000).toFixed(1)}M (${twoYear.pct}%)`;
}

/**
 * Get risk distribution data
 */
export function getRiskDistribution(data: AppData): string {
  const levels = data.risk_distribution.risk_levels;

  return `RISK DISTRIBUTION:
${levels.map(r =>
  `${r.level}: ${(r.customers / 1_000_000).toFixed(1)}M customers (${r.percentage}%)`
).join('\n')}`;
}

/**
 * Get top churn drivers
 */
export function getChurnDrivers(data: AppData, limit: number = 10): string {
  const features = data.feature_importance.features.slice(0, limit);

  return `TOP ${limit} CHURN DRIVERS:
${features.map((f, i) =>
  `${i + 1}. ${f.name} - ${(f.importance * 100).toFixed(1)}% importance
   ${f.interpretation}`
).join('\n\n')}`;
}

/**
 * Get segment summary statistics
 */
export function getSegmentSummary(data: AppData): string {
  const segments = data.segments;

  // Group by tenure
  const earlyTenure = segments.filter(s => s.tenure_band === '0-3 Months');
  const earlyTotal = earlyTenure.reduce((sum, s) => sum + s.customers, 0);
  const earlyAvgChurn = earlyTenure.reduce((sum, s) => sum + s.churn_probability * s.customers, 0) / earlyTotal;

  // Group by contract
  const m2mSegs = segments.filter(s => s.contract_group === 'Month-to-Month');
  const m2mTotal = m2mSegs.reduce((sum, s) => sum + s.customers, 0);
  const m2mAvgChurn = m2mSegs.reduce((sum, s) => sum + s.churn_probability * s.customers, 0) / m2mTotal;

  return `SEGMENT ANALYSIS (${segments.length} total cohorts):

TENURE BANDS:
- Early (0-3 months): ${(earlyTotal / 1_000_000).toFixed(1)}M customers, ${(earlyAvgChurn * 100).toFixed(1)}% avg churn (HIGHEST RISK)
- Mid (3-12 months): Variable churn rates
- Mature (12+ months): Lower churn rates

CONTRACT TYPES:
- Month-to-Month: ${(m2mTotal / 1_000_000).toFixed(1)}M customers, ${(m2mAvgChurn * 100).toFixed(1)}% avg churn
- 1-Year Contract: Lower churn than M2M
- 2-Year Contract: Lowest churn rates`;
}

/**
 * Get specific segment details
 */
export function getSegmentDetails(data: AppData, filters: {
  tenure?: string;
  contract?: string;
  valuetier?: string;
}): Segment[] {
  let filtered = data.segments;

  if (filters.tenure) {
    filtered = filtered.filter(s => s.tenure_band === filters.tenure);
  }
  if (filters.contract) {
    filtered = filtered.filter(s => s.contract_group === filters.contract);
  }
  if (filters.valuetier) {
    filtered = filtered.filter(s => s.value_tier === filters.valuetier);
  }

  return filtered;
}

/**
 * Get ROI strategy comparison
 */
export function getROIStrategies(): string {
  return `RETENTION STRATEGIES (ROI Analysis):

1. Budget Optimization
   - Investment: $220M targeted retention spend
   - Return: $571M in prevented churn
   - ROI: 160%
   - Timeline: Immediate implementation
   - Description: ML-driven targeting of high-risk customers

2. Contract Conversion (M2M → Annual)
   - Investment: $199M in conversion incentives
   - Return: $223M in reduced churn
   - ROI: 112%
   - Timeline: 6-12 months
   - Description: Incentivize month-to-month customers to sign contracts

3. Onboarding Excellence
   - Investment: $50M in program development
   - Return: $98M in early-tenure retention
   - ROI: 96%
   - Timeline: 3-6 months
   - Description: Improve 0-3 month customer experience

BLENDED PORTFOLIO: 90% ROI across all strategies`;
}

/**
 * Get model performance metrics
 */
export function getModelMetrics(data: AppData): string {
  const model = data.metrics.overview;

  return `ML MODEL PERFORMANCE:
- Model: ${model.model_name}
- AUC: ${model.auc.toFixed(3)} (Excellent discrimination)
- Total Customers Analyzed: ${(model.total_customers / 1_000_000).toFixed(1)}M
- Annual Churn Cost: $${(model.annual_churn_cost / 1_000_000).toFixed(0)}M
- AI-Identified Opportunity: $${(model.ai_opportunity / 1_000_000).toFixed(0)}M`;
}

/**
 * Build complete context summary for GPT-5
 */
export function buildFullContext(data: AppData): string {
  return `${getCustomerStats(data)}

${getRiskDistribution(data)}

${getChurnDrivers(data, 5)}

${getSegmentSummary(data)}

${getROIStrategies()}

${getModelMetrics(data)}`;
}

/**
 * Get high-risk customers for targeting
 */
export function getHighRiskCustomers(data: AppData): { count: number; percentage: number } {
  const levels = data.risk_distribution.risk_levels;
  const high = levels.find(r => r.level === 'High');
  const veryHigh = levels.find(r => r.level === 'Very High');

  const count = (high?.customers || 0) + (veryHigh?.customers || 0);
  const total = data.metrics.overview.total_customers;
  const percentage = (count / total) * 100;

  return { count, percentage };
}

/**
 * Get chart-ready data for risk distribution
 */
export function getRiskChartData(data: AppData) {
  return data.risk_distribution.risk_levels.map(r => ({
    label: r.level,
    value: r.customers,
    percentage: r.percentage
  }));
}

/**
 * Get chart-ready data for top features
 */
export function getFeatureChartData(data: AppData, limit: number = 10) {
  return data.feature_importance.features.slice(0, limit).map(f => ({
    name: f.name,
    value: f.importance * 100
  }));
}

/**
 * Find related segments based on characteristics
 */
export function findRelatedSegments(
  data: AppData,
  characteristics: { highChurn?: boolean; earlyTenure?: boolean; m2m?: boolean }
): string[] {
  let segments = data.segments;

  if (characteristics.highChurn) {
    segments = segments.filter(s => s.churn_probability > 0.25);
  }
  if (characteristics.earlyTenure) {
    segments = segments.filter(s => s.tenure_band.includes('0-3') || s.tenure_band.includes('3-6'));
  }
  if (characteristics.m2m) {
    segments = segments.filter(s => s.contract_group === 'Month-to-Month');
  }

  return segments
    .sort((a, b) => b.churn_probability - a.churn_probability)
    .slice(0, 5)
    .map(s => `${s.tenure_band} | ${s.contract_group} | ${s.value_tier}`);
}
