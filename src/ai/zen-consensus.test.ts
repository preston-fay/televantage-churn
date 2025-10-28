import { describe, it, expect } from "vitest";
import { Tools, setToolsData } from "./tools";

describe("Zen Consensus – tool outputs", () => {
  // Setup mock data
  const mockData = {
    risk_distribution: {
      risk_levels: [
        { level: "Low", customers: 1000 },
        { level: "Medium", customers: 2000 },
        { level: "High", customers: 500 }
      ]
    },
    feature_importance: {
      features: [
        { name: "Contract Type", importance: 0.35 },
        { name: "Tenure", importance: 0.25 },
        { name: "Monthly Charges", importance: 0.20 }
      ]
    }
  };

  setToolsData(mockData);

  it("get_risk_distribution returns full table (no default chart)", () => {
    const out = Tools.get_risk_distribution();
    expect(out.table).toBeDefined();
    expect(out.table?.[0]).toHaveProperty("segment");
    expect(out.table?.[0]).toHaveProperty("customers");
    expect(out.chart).toBeUndefined();
    expect(out.text).toContain("Risk distribution");
  });

  it("get_feature_importance returns full table (no default chart)", () => {
    const out = Tools.get_feature_importance({ topN: 5 });
    expect(out.table).toBeDefined();
    expect(out.table?.[0]).toHaveProperty("driver");
    expect(out.table?.[0]).toHaveProperty("importance");
    expect(out.chart).toBeUndefined();
    expect(out.text).toContain("churn drivers");
  });

  it("get_roi_by_strategy returns full decision table with netBenefit (no default chart)", () => {
    const out = Tools.get_roi_by_strategy();
    expect(out.table).toBeDefined();
    expect(out.table?.[0]).toHaveProperty("strategy");
    expect(out.table?.[0]).toHaveProperty("investment");
    expect(out.table?.[0]).toHaveProperty("savings");
    expect(out.table?.[0]).toHaveProperty("netBenefit");
    expect(out.table?.[0]).toHaveProperty("roiPct");
    expect(out.table?.[0]).toHaveProperty("irrPct");
    expect(out.chart).toBeUndefined();
    expect(out.text).toContain("net benefit");
    // Verify sorted by netBenefit (descending)
    if (out.table && out.table.length > 1) {
      expect(out.table[0].netBenefit).toBeGreaterThanOrEqual(out.table[1].netBenefit);
    }
  });

  it("compute_arpu_impact returns full scenario table (no default chart)", () => {
    const out = Tools.compute_arpu_impact({ churnDeltaPct: 3 });
    expect(out.table).toBeDefined();
    expect(out.table?.[0]).toHaveProperty("state");
    expect(out.table?.[0]).toHaveProperty("arpu");
    expect(out.chart).toBeUndefined();
    expect(out.text).toContain("ARPU scenario");
  });

  it("compute_cltv returns full metrics table (no default chart)", () => {
    const out = Tools.compute_cltv();
    expect(out.table).toBeDefined();
    expect(out.table?.[0]).toHaveProperty("metric");
    expect(out.table?.[0]).toHaveProperty("value");
    expect(out.table?.[0]).toHaveProperty("arpu");
    expect(out.table?.[0]).toHaveProperty("grossMarginPct");
    expect(out.table?.[0]).toHaveProperty("churnPct");
    expect(out.chart).toBeUndefined();
    expect(out.text).toContain("CLTV");
  });
});
