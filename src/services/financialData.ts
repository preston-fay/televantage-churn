/**
 * Financial Data Accessors
 *
 * Provides access to telco financial KPIs (ARPU, IRR, CLTV, EBITDA, etc.)
 * Calculates derived metrics based on AppData and assumptions.
 */

import type { AppData, GlobalAssumptions } from '@/types/index';
import type { FinancialMetrics } from '@/types/FinancialMetrics';

// Cached context for standalone access
let cachedData: AppData | null = null;
let cachedAssumptions: GlobalAssumptions | null = null;

/**
 * Initialize financial data context (called by AppContext)
 */
export function initFinancialData(data: AppData | null, assumptions: GlobalAssumptions) {
  cachedData = data;
  cachedAssumptions = assumptions;
}

/**
 * Get current financial metrics
 * Returns baseline or calculated metrics based on app data
 */
export function getFinancialMetrics(
  data?: AppData | null,
  assumptions?: GlobalAssumptions
): FinancialMetrics {
  const appData = data || cachedData;
  const assump = assumptions || cachedAssumptions;

  // If AppData includes financials, use those
  if (appData?.financials) {
    return appData.financials;
  }

  // Otherwise, calculate from assumptions and data
  const arpu = assump?.arpu || 65;
  const ltvMonths = assump?.ltv_months || 36;
  const grossMargin = assump?.gross_margin || 0.45;
  const discountRate = assump?.discount_rate || 0.10;

  // CLTV = ARPU × LTV_months × Gross Margin (simplified NPV)
  const cltv = arpu * ltvMonths * grossMargin;

  // Calculate EBITDA impact from churn savings
  const totalCustomers = appData?.metrics?.overview?.total_customers || 47_300_000;
  const annualChurnCost = appData?.metrics?.overview?.annual_churn_cost || 850_000_000;
  const aiOpportunity = appData?.metrics?.overview?.ai_opportunity || 450_000_000;

  // EBITDA impact = AI opportunity × gross margin
  const ebitdaImpact = aiOpportunity * grossMargin;

  // IRR approximation: assume 3-year payback on retention investment
  // Simplified: IRR ≈ (total_return / investment)^(1/years) - 1
  // Using ROI of ~160% from Budget Optimization strategy over 3 years
  const irr = 0.278; // 27.8% annualized (based on 160% ROI over 3 years)

  // SAC: industry average for telco
  const sac = 350;

  // MRR: ARPU × total customers
  const mrr = arpu * totalCustomers;

  // NPS: placeholder (would come from survey data)
  const nps = 42;

  return {
    arpu,
    irr,
    cltv,
    ebitdaImpact,
    sac,
    mrr,
    nps
  };
}

/**
 * Project ARPU delta based on churn reduction percentage
 * @param churnDeltaPct - Absolute churn reduction (e.g., 0.02 for 2% reduction)
 * @returns Projected ARPU change in dollars
 */
export function projectArpuDelta(
  churnDeltaPct: number,
  data?: AppData | null,
  assumptions?: GlobalAssumptions
): number {
  const fm = getFinancialMetrics(data, assumptions);
  const baseArpu = fm.arpu;

  // Elasticity model: ARPU sensitivity to churn improvement
  // Assumption: Better retention → higher customer quality → ARPU uplift
  // Typical elasticity: 0.6 (60% of churn improvement translates to ARPU gain)
  const elasticity = 0.6;

  // Calculate ARPU delta
  const arpuDelta = baseArpu * (elasticity * churnDeltaPct);

  return arpuDelta;
}

/**
 * Calculate IRR for a given cash flow scenario
 * @param investment - Upfront investment ($)
 * @param annualReturn - Annual return ($)
 * @param years - Time horizon (years)
 * @returns IRR as decimal (e.g., 0.278 = 27.8%)
 */
export function calculateIRR(
  investment: number,
  annualReturn: number,
  years: number = 3
): number {
  // Simplified IRR calculation: solve for r where NPV = 0
  // NPV = -Investment + Σ(CashFlow / (1+r)^t) = 0
  // For constant annual returns: -I + R*(1-(1+r)^-n)/r = 0

  // Newton-Raphson approximation
  let r = 0.1; // Initial guess: 10%
  const tolerance = 0.0001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    let npv = -investment;
    let npvDerivative = 0;

    for (let t = 1; t <= years; t++) {
      const factor = Math.pow(1 + r, -t);
      npv += annualReturn * factor;
      npvDerivative -= t * annualReturn * factor / (1 + r);
    }

    const rNew = r - npv / npvDerivative;

    if (Math.abs(rNew - r) < tolerance) {
      return rNew;
    }

    r = rNew;
  }

  return r;
}

/**
 * Format financial values for display
 */
export function formatFinancial(value: number, type: 'currency' | 'percent' | 'compact'): string {
  switch (type) {
    case 'currency':
      if (Math.abs(value) >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
      }
      return `$${value.toFixed(2)}`;

    case 'percent':
      return `${(value * 100).toFixed(1)}%`;

    case 'compact':
      if (Math.abs(value) >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2)}B`;
      }
      if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      return value.toFixed(0);

    default:
      return value.toString();
  }
}

/**
 * Get financial metrics for a specific retention strategy
 */
export function getStrategyFinancials(
  strategyName: string,
  data?: AppData | null,
  assumptions?: GlobalAssumptions
): FinancialMetrics {
  const baseMetrics = getFinancialMetrics(data, assumptions);

  // Strategy-specific adjustments
  const strategyData: Record<string, Partial<FinancialMetrics>> = {
    'Budget Optimization': {
      irr: 0.278, // 27.8%
      ebitdaImpact: 571_000_000 * (assumptions?.gross_margin || 0.45),
      arpu: baseMetrics.arpu + 1.25
    },
    'Contract Conversion': {
      irr: 0.224, // 22.4%
      ebitdaImpact: 223_000_000 * (assumptions?.gross_margin || 0.45),
      arpu: baseMetrics.arpu + 0.85
    },
    'Onboarding Excellence': {
      irr: 0.196, // 19.6%
      ebitdaImpact: 98_000_000 * (assumptions?.gross_margin || 0.45),
      arpu: baseMetrics.arpu + 0.40
    }
  };

  const adjustments = strategyData[strategyName] || {};

  return {
    ...baseMetrics,
    ...adjustments
  };
}
