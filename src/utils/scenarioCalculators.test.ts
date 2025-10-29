import { describe, it, expect } from "vitest";
import { calculateBudgetOptimization } from "./scenarioCalculators";
import type { GlobalAssumptions, BudgetOptimizationInputs } from "@/types";

describe("ROI responds to budget changes", () => {
  const baseAssumptions: GlobalAssumptions = {
    arpu: 65,
    gross_margin: 0.62,
    save_rate: 0.15,
    discount_rate: 0.08,
    ltv_months: 36,
  };

  it("increasing budget (holding CPI constant) changes ROI", () => {
    const lowBudgetInputs: BudgetOptimizationInputs = {
      retention_budget: 100_000_000, // $100M
      cost_per_intervention: 35,
    };

    const highBudgetInputs: BudgetOptimizationInputs = {
      retention_budget: 300_000_000, // $300M
      cost_per_intervention: 35,
    };

    const lowResult = calculateBudgetOptimization(
      lowBudgetInputs,
      baseAssumptions
    );
    const highResult = calculateBudgetOptimization(
      highBudgetInputs,
      baseAssumptions
    );

    console.log("Low budget ($100M):", {
      budget: lowBudgetInputs.retention_budget,
      roi: lowResult.roi,
      annualSavings: lowResult.annual_savings,
      interventions: lowResult.interventions,
    });

    console.log("High budget ($300M):", {
      budget: highBudgetInputs.retention_budget,
      roi: highResult.roi,
      annualSavings: highResult.annual_savings,
      interventions: highResult.interventions,
    });

    // ROI should be different when budget changes
    expect(highResult.roi).not.toBe(lowResult.roi);

    // Annual savings should also be different
    expect(highResult.annual_savings).not.toBe(lowResult.annual_savings);

    // Interventions should scale with budget
    expect(highResult.interventions).toBeGreaterThan(lowResult.interventions);
  });

  it("budget increase with CPI constant produces expected ROI change", () => {
    const inputs50M: BudgetOptimizationInputs = {
      retention_budget: 50_000_000,
      cost_per_intervention: 35,
    };

    const inputs150M: BudgetOptimizationInputs = {
      retention_budget: 150_000_000,
      cost_per_intervention: 35,
    };

    const result50M = calculateBudgetOptimization(inputs50M, baseAssumptions);
    const result150M = calculateBudgetOptimization(inputs150M, baseAssumptions);

    console.log("50M budget:", result50M);
    console.log("150M budget:", result150M);

    // With 3x budget, we should get more interventions
    expect(result150M.interventions).toBeGreaterThan(result50M.interventions);

    // Annual savings should increase
    expect(result150M.annual_savings).toBeGreaterThan(result50M.annual_savings);

    // ROI should change (but not necessarily linearly)
    expect(result150M.roi).not.toBe(result50M.roi);
  });
});
