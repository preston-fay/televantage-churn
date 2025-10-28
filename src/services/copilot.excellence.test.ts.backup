/**
 * Excellence Tests for Strategy Copilot v2
 * Validates the two user-reported regression questions + ROI comparison
 */

import { describe, it, expect, beforeAll } from "vitest";
import { askCopilot, setContext } from "./aiServiceV2";
import type { AppData } from "../types";

// Mock AppData
const mockAppData: AppData = {
  models: [],
  segments: [
    { tenure_band: "0-12 months", contract_group: "Month-to-Month", value_tier: "Low", customers: 5000,
      churn_probability: 0.45, threshold: 0.3, targeted_customers: 3500, targeting_rate: 0.7,
      avg_ltv: 1200, risk_level: "Very High", strategy: "Early Intervention", expected_roi: 1.8,
      implementation_timeline: "Q1 2024" }
  ],
  metrics: {
    overview: { total_customers: 47300000, annual_churn_cost: 2100000000, ai_opportunity: 850000000,
                model_auc: 0.84, model_name: "XGBoost" },
    calibration: { bins: [] },
    confusion_matrix: { true_positives: 0, false_positives: 0, true_negatives: 0, false_negatives: 0,
                       labels: { true_positives: "", false_positives: "", false_negatives: "", true_negatives: "" } }
  },
  customers_summary: {
    total_customers: 47300000,
    by_contract: {},
    by_tenure: {},
    by_value: {}
  },
  risk_distribution: {
    risk_levels: [
      { level: "Low", customers: 10000000, percentage: 21.1 },
      { level: "Medium", customers: 22300000, percentage: 47.1 },
      { level: "High", customers: 10500000, percentage: 22.2 },
      { level: "Very High", customers: 4500000, percentage: 9.5 }
    ]
  },
  feature_importance: {
    features: [
      { name: "Contract Type", importance: 0.287, interpretation: "Month-to-month contracts have 3-5x higher churn" },
      { name: "Tenure", importance: 0.183, interpretation: "Early tenure (<12 months) highest risk" },
      { name: "Monthly Charges", importance: 0.142, interpretation: "Higher charges correlate with churn" },
      { name: "Total Charges", importance: 0.098, interpretation: "Customer lifetime value indicator" },
      { name: "Internet Service", importance: 0.081, interpretation: "Fiber customers churn more" },
      { name: "Payment Method", importance: 0.067, interpretation: "Electronic check users at higher risk" },
      { name: "Tech Support", importance: 0.054, interpretation: "No support correlates with churn" },
      { name: "Online Security", importance: 0.041, interpretation: "Lack of security = higher churn" },
      { name: "Paperless Billing", importance: 0.029, interpretation: "Paperless billing slight risk factor" },
      { name: "Senior Citizen", importance: 0.018, interpretation: "Seniors slightly lower churn" }
    ]
  }
};

beforeAll(() => {
  setContext(mockAppData);
});

describe("Strategy Copilot – excellence tests", () => {
  it("ARPU impact: labeled bar chart + clear text", async () => {
    const r = await askCopilot({ text: "Show ARPU impact of 2% churn reduction" });

    // Text should mention ARPU increase/rise
    expect(r.text.toLowerCase()).toMatch(/arpu|increase|rise/);
    expect(r.text.length).toBeGreaterThan(20);

    // Chart should be bar with proper labels
    expect(r.chart?.kind).toBe("bar");
    expect(r.chart?.xLabel).toBeTruthy();
    expect(r.chart?.yLabel).toBeTruthy();
    expect(r.chart?.series?.[0]?.data.length).toBeGreaterThan(0);

    // Should have citations and follow-ups
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.followUps.length).toBeGreaterThanOrEqual(2);
  }, 10000);

  it("Risk distribution: donut with segment labels", async () => {
    const r = await askCopilot({ text: "Show me customer risk distribution" });

    // Text should be substantive
    expect(r.text.length).toBeGreaterThan(20);

    // Chart should be donut with string labels
    expect(r.chart?.kind).toBe("donut");
    const points = r.chart?.series?.[0]?.data || [];
    expect(points.length).toBeGreaterThan(0);
    expect(points.every(p => typeof p.x === "string")).toBe(true);
    expect(points.every(p => typeof p.y === "number")).toBe(true);

    // Should have citations and follow-ups
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.followUps.length).toBeGreaterThanOrEqual(2);
  }, 10000);

  it("ROI compare: labeled bar chart", async () => {
    const r = await askCopilot({ text: "Compare ROI across strategies" });

    // Text should mention strategy or ROI
    expect(r.text.toLowerCase()).toMatch(/roi|strategy/);

    // Chart should be bar with strategy label
    expect(r.chart?.kind).toBe("bar");
    expect(r.chart?.xLabel).toBeTruthy();
    expect(r.chart?.xLabel?.toLowerCase()).toMatch(/strategy/i);
    expect(r.chart?.yLabel).toBeTruthy();

    // Should have multiple strategies
    const points = r.chart?.series?.[0]?.data || [];
    expect(points.length).toBeGreaterThanOrEqual(3);

    // Should have citations and follow-ups
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.followUps.length).toBeGreaterThanOrEqual(2);
  }, 10000);

  it("Churn drivers: horizontal bar with feature labels", async () => {
    const r = await askCopilot({ text: "What are the top churn drivers?" });

    // Text should mention top driver or feature
    expect(r.text.toLowerCase()).toMatch(/driver|feature/);

    // Chart should be horizontal-bar
    expect(r.chart?.kind).toBe("horizontal-bar");
    expect(r.chart?.xLabel).toBeTruthy();
    expect(r.chart?.yLabel).toBeTruthy();

    // Should have multiple features
    const points = r.chart?.series?.[0]?.data || [];
    expect(points.length).toBeGreaterThanOrEqual(5);

    // Should have citations and follow-ups
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.followUps.length).toBeGreaterThanOrEqual(2);
  }, 10000);
});
