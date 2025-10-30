/**
 * Financial Metrics Type Definitions
 *
 * Core telco KPIs for ChurnIQ churn intelligence platform
 */

export interface FinancialMetrics {
  arpu: number;              // Average Revenue Per User ($/month)
  irr: number;               // Internal Rate of Return (% annualized, e.g., 0.278 = 27.8%)
  cltv: number;              // Customer Lifetime Value ($)
  ebitdaImpact: number;      // EBITDA impact (annual $)
  sac?: number;              // Subscriber Acquisition Cost ($)
  mrr?: number;              // Monthly Recurring Revenue ($)
  nps?: number;              // Net Promoter Score (−100..+100)
}

export interface FinancialScenario {
  name: string;
  arpu: number;
  arpuDelta: number;
  irr: number;
  roi: number;
  ebitdaImpact: number;
  cltv: number;
}
