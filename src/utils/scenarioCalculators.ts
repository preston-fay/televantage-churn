import type {
  GlobalAssumptions,
  ContractConversionInputs,
  ContractConversionResults,
  OnboardingInputs,
  OnboardingResults,
  BudgetOptimizationInputs,
  BudgetOptimizationResults,
  ROIPoint,
} from '@/types';

// ============================================================================
// SHARED S-CURVE ROI/IRR CALCULATOR (Budget-Sensitive)
// ============================================================================

export interface ROIInputs {
  annualBudget: number;
  costPerIntervention: number;
  conversionRatePct: number;
  baseCustomers: number;
  arpu: number;
  marginPct: number;
  horizonMonths: number;
  halfSaturationBudget?: number;      // B50 for S-curve
  maxInterventionsPerYear?: number;   // Optional capacity cap
}

export interface ROIResult {
  interventions: number;
  customersSaved: number;
  annualSavings: number;
  netBenefit: number;
  roiPct: number;
  irrPct: number;
}

/**
 * Shared ROI/IRR calculator with S-curve dynamics and zero guards.
 *
 * S-curve formula: effectiveness = budget / (budget + B50)
 * - At budget = B50: 50% effectiveness
 * - At budget = 0: 0% effectiveness
 * - At budget >> B50: approaches 100% effectiveness
 *
 * Zero guards ensure no Infinity at tiny budgets.
 */
export function calcROIIRR(inputs: ROIInputs): ROIResult {
  const {
    annualBudget,
    costPerIntervention,
    conversionRatePct,
    baseCustomers,
    arpu,
    marginPct,
    horizonMonths,
    halfSaturationBudget = 50_000_000,
    maxInterventionsPerYear,
  } = inputs;

  // Zero guard: if budget is zero or negative, return zero metrics
  if (annualBudget <= 0 || costPerIntervention <= 0) {
    return {
      interventions: 0,
      customersSaved: 0,
      annualSavings: 0,
      netBenefit: 0,
      roiPct: 0,
      irrPct: 0,
    };
  }

  // S-curve effectiveness factor
  const effectiveness = annualBudget / (annualBudget + halfSaturationBudget);

  // Calculate interventions
  let interventions = Math.floor(annualBudget / costPerIntervention);

  // Apply capacity cap if specified
  if (maxInterventionsPerYear) {
    interventions = Math.min(interventions, maxInterventionsPerYear);
  }

  // Apply S-curve effectiveness
  const effectiveInterventions = Math.floor(interventions * effectiveness);

  // Calculate customers saved (conversion rate applied)
  const customersSaved = Math.floor(effectiveInterventions * (conversionRatePct / 100));

  // Calculate annual savings
  const monthlyValue = customersSaved * arpu * marginPct;
  const annualSavings = monthlyValue * 12;

  // Calculate net benefit
  const netBenefit = annualSavings - annualBudget;

  // Calculate ROI% (with zero guard)
  const roiPct = annualBudget > 0 ? (netBenefit / annualBudget) * 100 : 0;

  // Calculate IRR% (simplified: annualized return over horizon)
  // IRR = (total return / initial investment) ^ (12 / horizon) - 1
  const totalReturn = annualSavings * (horizonMonths / 12);
  const irrPct = annualBudget > 0
    ? (Math.pow(totalReturn / annualBudget, 12 / horizonMonths) - 1) * 100
    : 0;

  return {
    interventions: effectiveInterventions,
    customersSaved,
    annualSavings: Math.floor(annualSavings),
    netBenefit: Math.floor(netBenefit),
    roiPct,
    irrPct: Number.isFinite(irrPct) ? irrPct : 0,
  };
}

/**
 * Format ROI result for display
 */
export function formatROI(result: ROIResult) {
  return {
    roiFmt: `${result.roiPct >= 0 ? '+' : ''}${result.roiPct.toFixed(0)}%`,
    irrFmt: `${result.irrPct.toFixed(1)}%`,
    netBenefitFmt: `$${(result.netBenefit / 1_000_000).toFixed(0)}M`,
    interventionsFmt: `${(result.interventions / 1_000_000).toFixed(1)}M`,
    customersSavedFmt: `${(result.customersSaved / 1_000).toFixed(0)}K`,
    annualSavingsFmt: `$${(result.annualSavings / 1_000_000).toFixed(0)}M`,
  };
}

// ============================================================================
// LEGACY CALCULATORS (Kept for backward compatibility)
// ============================================================================

const TOTAL_CUSTOMERS = 47_300_000;
const M2M_PCT = 0.42;
const ONE_YR_PCT = 0.35;
const TWO_YR_PCT = 0.23;
const M2M_CHURN_RATE = 0.25;
const ONE_YR_CHURN_RATE = 0.12;
const TWO_YR_CHURN_RATE = 0.05;
const EARLY_CUSTOMERS_PCT = 0.09; // 0-3 months tenure

export function calculateContractConversion(
  inputs: ContractConversionInputs,
  assumptions: GlobalAssumptions
): ContractConversionResults {
  const m2mCustomers = TOTAL_CUSTOMERS * M2M_PCT;
  const conversions = Math.floor(m2mCustomers * inputs.conversion_rate);
  const newM2M = m2mCustomers - conversions;
  const new1Yr = TOTAL_CUSTOMERS * ONE_YR_PCT + conversions;

  // Calculate churn before and after
  const oldChurnCount =
    m2mCustomers * M2M_CHURN_RATE +
    TOTAL_CUSTOMERS * ONE_YR_PCT * ONE_YR_CHURN_RATE +
    TOTAL_CUSTOMERS * TWO_YR_PCT * TWO_YR_CHURN_RATE;

  const newChurnCount =
    newM2M * M2M_CHURN_RATE +
    new1Yr * ONE_YR_CHURN_RATE +
    TOTAL_CUSTOMERS * TWO_YR_PCT * TWO_YR_CHURN_RATE;

  const churnReduction = oldChurnCount - newChurnCount;

  // Calculate financials
  const annualSavings =
    churnReduction * assumptions.arpu * 12 * assumptions.gross_margin;
  const totalCost = conversions * inputs.incentive_cost;
  const netBenefit = annualSavings - totalCost;
  const roi = totalCost > 0 ? netBenefit / totalCost : 0;

  return {
    conversions,
    new_m2m: Math.floor(newM2M),
    new_1yr: Math.floor(new1Yr),
    churn_reduction: Math.floor(churnReduction),
    annual_savings: Math.floor(annualSavings),
    total_cost: Math.floor(totalCost),
    net_benefit: Math.floor(netBenefit),
    roi,
  };
}

export function calculateOnboardingExcellence(
  inputs: OnboardingInputs,
  assumptions: GlobalAssumptions
): OnboardingResults {
  const earlyCustomers = TOTAL_CUSTOMERS * EARLY_CUSTOMERS_PCT;

  // Assume early customers have 40% churn rate
  const earlyChurnRate = 0.40;
  const baselineChurnCount = Math.floor(earlyCustomers * earlyChurnRate);
  const newChurnRate = earlyChurnRate * (1 - inputs.churn_reduction);
  const newChurnCount = Math.floor(earlyCustomers * newChurnRate);
  const customersSaved = baselineChurnCount - newChurnCount;

  // Calculate financials
  const annualSavings =
    customersSaved * assumptions.arpu * 12 * assumptions.gross_margin;
  const totalCost = inputs.program_investment;

  // Calculate 3-year NPV
  let npv = -totalCost; // Initial investment
  for (let year = 1; year <= 3; year++) {
    const yearSavings = annualSavings;
    npv += yearSavings / Math.pow(1 + assumptions.discount_rate, year);
  }

  const netBenefit = annualSavings * 3 - totalCost;

  return {
    early_customers: Math.floor(earlyCustomers),
    baseline_churn_count: baselineChurnCount,
    new_churn_count: newChurnCount,
    customers_saved: customersSaved,
    annual_savings: Math.floor(annualSavings),
    total_cost: Math.floor(totalCost),
    net_benefit: Math.floor(netBenefit),
    npv_3yr: Math.floor(npv),
  };
}

export function calculateBudgetOptimization(
  inputs: BudgetOptimizationInputs,
  assumptions: GlobalAssumptions
): BudgetOptimizationResults {
  const interventions = Math.floor(
    inputs.retention_budget / inputs.cost_per_intervention
  );

  // Assume we can target up to 30% of the customer base
  const maxInterventions = Math.floor(TOTAL_CUSTOMERS * 0.30);
  const actualInterventions = Math.min(interventions, maxInterventions);

  const customersSaved = Math.floor(
    actualInterventions * assumptions.save_rate
  );
  const annualSavings =
    customersSaved * assumptions.arpu * 12 * assumptions.gross_margin;
  const roi =
    inputs.retention_budget > 0
      ? (annualSavings - inputs.retention_budget) / inputs.retention_budget
      : 0;

  return {
    interventions: actualInterventions,
    customers_saved: customersSaved,
    annual_savings: Math.floor(annualSavings),
    roi,
  };
}

export function generateROICurve(
  costPerIntervention: number,
  assumptions: GlobalAssumptions,
  steps: number = 20
): ROIPoint[] {
  const minBudget = 50_000_000; // $50M
  const maxBudget = 500_000_000; // $500M
  const budgetStep = (maxBudget - minBudget) / (steps - 1);

  const points: ROIPoint[] = [];

  for (let i = 0; i < steps; i++) {
    const budget = minBudget + i * budgetStep;
    const result = calculateBudgetOptimization(
      {
        retention_budget: budget,
        cost_per_intervention: costPerIntervention,
      },
      assumptions
    );
    points.push({
      budget,
      roi: result.roi,
    });
  }

  return points;
}

// Generate multiple ROI curves for comparison
export function generateMultipleROICurves(
  costScenarios: number[],
  assumptions: GlobalAssumptions,
  steps: number = 20
): { cost: number; points: ROIPoint[] }[] {
  return costScenarios.map(cost => ({
    cost,
    points: generateROICurve(cost, assumptions, steps)
  }));
}
