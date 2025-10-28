// Data types matching the generated JSON files

import { FinancialMetrics } from './FinancialMetrics';

export interface Model {
  name: string;
  abbrev: string;
  auc: number;
  brier: number;
  average_precision: number;
  training_time_seconds: number;
  winner: boolean;
  rationale: string;
}

export interface Segment {
  tenure_band: string;
  contract_group: string;
  value_tier: string;
  customers: number;
  churn_probability: number;
  threshold: number;
  targeted_customers: number;
  targeting_rate: number;
  avg_ltv: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
  strategy: string;
  expected_roi: number;
  implementation_timeline: string;
}

export interface MetricsOverview {
  total_customers: number;
  annual_churn_cost: number;
  ai_opportunity: number;
  model_auc: number;
  model_name: string;
}

export interface CalibrationBin {
  predicted: number;
  actual: number;
}

export interface ConfusionMatrix {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  labels: {
    true_positives: string;
    false_positives: string;
    false_negatives: string;
    true_negatives: string;
  };
}

export interface Metrics {
  overview: MetricsOverview;
  calibration: {
    bins: CalibrationBin[];
  };
  confusion_matrix: ConfusionMatrix;
}

export interface CustomerDistribution {
  count: number;
  pct: number;
}

export interface CustomersSummary {
  total_customers: number;
  by_contract: Record<string, CustomerDistribution>;
  by_tenure: Record<string, CustomerDistribution>;
  by_value: Record<string, CustomerDistribution>;
}

export interface RiskLevel {
  level: 'Low' | 'Medium' | 'High' | 'Very High';
  customers: number;
  percentage: number;
}

export interface RiskDistribution {
  risk_levels: RiskLevel[];
}

export interface Feature {
  name: string;
  importance: number;
  interpretation: string;
}

export interface FeatureImportance {
  features: Feature[];
}

// Global assumptions for scenario calculator
export interface GlobalAssumptions {
  arpu: number; // Average Revenue Per User (monthly)
  ltv_months: number; // Customer Lifetime (months)
  gross_margin: number; // Gross Margin (decimal, e.g., 0.45)
  save_rate: number; // Win-back rate (decimal, e.g., 0.30)
  discount_rate: number; // Discount rate for NPV (decimal, e.g., 0.10)
}

// Scenario A: Contract Conversion
export interface ContractConversionInputs {
  conversion_rate: number; // 0-0.30 (0% to 30%)
  incentive_cost: number; // $ per customer
}

export interface ContractConversionResults {
  conversions: number;
  new_m2m: number;
  new_1yr: number;
  churn_reduction: number;
  annual_savings: number;
  total_cost: number;
  net_benefit: number;
  roi: number;
}

// Scenario B: Onboarding Excellence
export interface OnboardingInputs {
  churn_reduction: number; // 0-0.50 (0% to 50% reduction)
  program_investment: number; // $ total investment
}

export interface OnboardingResults {
  early_customers: number;
  baseline_churn_count: number;
  new_churn_count: number;
  customers_saved: number;
  annual_savings: number;
  total_cost: number;
  net_benefit: number;
  npv_3yr: number;
}

// Scenario C: Budget Optimization
export interface BudgetOptimizationInputs {
  retention_budget: number; // $50M-$500M
  cost_per_intervention: number; // $ per customer
}

export interface BudgetOptimizationResults {
  interventions: number;
  customers_saved: number;
  annual_savings: number;
  roi: number;
}

export interface ROIPoint {
  budget: number;
  roi: number;
}

// Chart data types
export interface WaterfallBar {
  label: string;
  value: number;
  type: 'loss' | 'gain' | 'total';
}

export interface LineChartData {
  x: string;
  y: number;
  series: string;
}

// Application data context
export interface AppData {
  models: Model[];
  segments: Segment[];
  metrics: Metrics;
  customers_summary: CustomersSummary;
  risk_distribution: RiskDistribution;
  feature_importance: FeatureImportance;
  financials?: FinancialMetrics;
}

// Application state
export interface AppState {
  data: AppData | null;
  assumptions: GlobalAssumptions;
  isLoading: boolean;
  error: string | null;
}
