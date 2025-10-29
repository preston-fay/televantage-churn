import { describe, it, expect } from "vitest";
import { calcROIIRR } from "./scenarioCalculators";

const base = {
  costPerIntervention: 35,
  conversionRatePct: 15,
  baseCustomers: 10_000_000,
  arpu: 65,
  marginPct: 0.62,
  horizonMonths: 12,
};

describe("ROI/IRR respond to budget across scenarios", () => {
  it("Scenario 1 knobs: ROI/IRR change with budget", () => {
    const low = calcROIIRR({
      ...base,
      annualBudget: 10_000,
      halfSaturationBudget: 150_000_000,
      maxInterventionsPerYear: 5_000_000,
    });
    const high = calcROIIRR({
      ...base,
      annualBudget: 300_000_000,
      halfSaturationBudget: 150_000_000,
      maxInterventionsPerYear: 5_000_000,
    });

    console.log("Scenario 1 Low ($10K):", {
      budget: 10_000,
      roi: low.roiPct,
      irr: low.irrPct,
    });
    console.log("Scenario 1 High ($300M):", {
      budget: 300_000_000,
      roi: high.roiPct,
      irr: high.irrPct,
    });

    expect(high.roiPct).not.toBe(low.roiPct);
    expect(high.irrPct).not.toBe(low.irrPct);
    expect(high.annualSavings).toBeGreaterThan(low.annualSavings);
  });

  it("Scenario 2 knobs: Contract Conversion responds to budget", () => {
    const low = calcROIIRR({
      ...base,
      annualBudget: 10_000,
      halfSaturationBudget: 200_000_000,
      maxInterventionsPerYear: 3_000_000,
    });
    const high = calcROIIRR({
      ...base,
      annualBudget: 200_000_000,
      halfSaturationBudget: 200_000_000,
      maxInterventionsPerYear: 3_000_000,
    });

    console.log("Scenario 2 Low ($10K):", {
      budget: 10_000,
      roi: low.roiPct,
      irr: low.irrPct,
    });
    console.log("Scenario 2 High ($200M):", {
      budget: 200_000_000,
      roi: high.roiPct,
      irr: high.irrPct,
    });

    expect(high.roiPct).not.toBe(low.roiPct);
    expect(high.irrPct).not.toBe(low.irrPct);
    expect(high.customersSaved).toBeGreaterThan(low.customersSaved);
  });

  it("Scenario 3 knobs: Onboarding Excellence responds to budget", () => {
    const low = calcROIIRR({
      ...base,
      annualBudget: 10_000,
      halfSaturationBudget: 80_000_000,
      maxInterventionsPerYear: 8_000_000,
    });
    const high = calcROIIRR({
      ...base,
      annualBudget: 150_000_000,
      halfSaturationBudget: 80_000_000,
      maxInterventionsPerYear: 8_000_000,
    });

    console.log("Scenario 3 Low ($10K):", {
      budget: 10_000,
      roi: low.roiPct,
      irr: low.irrPct,
    });
    console.log("Scenario 3 High ($150M):", {
      budget: 150_000_000,
      roi: high.roiPct,
      irr: high.irrPct,
    });

    expect(high.roiPct).not.toBe(low.roiPct);
    expect(high.irrPct).not.toBe(low.irrPct);
    expect(high.interventions).toBeGreaterThan(low.interventions);
  });

  it("Zero budget does not produce Infinity", () => {
    const z = calcROIIRR({
      ...base,
      annualBudget: 0,
      halfSaturationBudget: 20_000_000,
    });

    console.log("Zero budget result:", z);

    expect(Number.isFinite(z.irrPct)).toBe(true);
    expect(Number.isFinite(z.roiPct)).toBe(true);
    expect(z.roiPct).toBe(0);
    expect(z.irrPct).toBe(0);
    expect(z.interventions).toBe(0);
    expect(z.customersSaved).toBe(0);
  });

  it("S-curve effectiveness increases with budget", () => {
    const budgets = [10_000_000, 50_000_000, 150_000_000, 300_000_000];
    const B50 = 150_000_000;

    const results = budgets.map((budget) =>
      calcROIIRR({
        ...base,
        annualBudget: budget,
        halfSaturationBudget: B50,
        maxInterventionsPerYear: 10_000_000,
      })
    );

    console.log(
      "S-curve progression:",
      results.map((r, i) => ({
        budget: budgets[i] / 1_000_000 + "M",
        effectiveness:
          (budgets[i] / (budgets[i] + B50) * 100).toFixed(1) + "%",
        interventions: r.interventions,
        savings: (r.annualSavings / 1_000_000).toFixed(0) + "M",
      }))
    );

    // Verify interventions increase with budget
    for (let i = 1; i < results.length; i++) {
      expect(results[i].interventions).toBeGreaterThan(
        results[i - 1].interventions
      );
    }

    // Verify savings increase with budget
    for (let i = 1; i < results.length; i++) {
      expect(results[i].annualSavings).toBeGreaterThan(
        results[i - 1].annualSavings
      );
    }
  });

  it("Capacity cap limits interventions correctly", () => {
    const uncapped = calcROIIRR({
      ...base,
      annualBudget: 500_000_000,
      costPerIntervention: 10,
      halfSaturationBudget: 100_000_000,
      // No maxInterventionsPerYear - should be unlimited
    });

    const capped = calcROIIRR({
      ...base,
      annualBudget: 500_000_000,
      costPerIntervention: 10,
      halfSaturationBudget: 100_000_000,
      maxInterventionsPerYear: 5_000_000, // Cap at 5M
    });

    console.log("Uncapped interventions:", uncapped.interventions);
    console.log("Capped interventions:", capped.interventions);

    // Capped version should hit the capacity limit
    expect(capped.interventions).toBeLessThanOrEqual(5_000_000);

    // Uncapped version should have more interventions
    expect(uncapped.interventions).toBeGreaterThan(capped.interventions);
  });
});
