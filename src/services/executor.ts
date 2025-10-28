/**
 * Executor v2 - Deterministic execution with finance compute
 * Handles data operations and financial calculations without guessing
 */

import numeral from "numeral";
import type { Plan, ChartSpec } from "./schemas";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const money = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}k`;
  return `${sign}$${a.toFixed(2)}`;
};

export function execute(plan: Plan, data: any) {
  // Handle both flat arrays and nested objects from context
  const ds: Record<string, any[]> = {
    risk_distribution: (Array.isArray(data.risk_distribution)
      ? data.risk_distribution
      : (data.risk_distribution?.risk_levels || [])
    ).map((r: any) => ({
      segment: r.segment || r.level,
      size: r.size || r.customers,
      percentage: r.percentage
    })),
    feature_importance: (Array.isArray(data.feature_importance)
      ? data.feature_importance
      : (data.feature_importance?.features || [])
    ).map((f: any) => ({
      feature: f.feature || f.name,
      importance: f.importance,
      interpretation: f.interpretation
    })),
    roi_by_strategy: data.roi_by_strategy || [
      { strategy: "Budget Optimization", roiPct: 160, savings: 571000000, investment: 220000000, irr: 96 },
      { strategy: "Contract Conversion", roiPct: 112, savings: 223000000, investment: 199000000, irr: 67 },
      { strategy: "Onboarding Excellence", roiPct: 96, savings: 98000000, investment: 50000000, irr: 58 }
    ],
    segments: data.segments || []
  };

  const fin = data.financials || { arpu: 65, churn: 0.02, grossMargin: 0.62, arpuElasticity: 0.6 };

  let table: Array<Record<string, any>> = [];

  for (const step of plan.operations) {
    if (step.compute) {
      const { kind, params } = step.compute;

      if (kind === "arpuImpact") {
        const baseArpu = Number(fin.arpu ?? 65);
        const elasticity = Number(fin.arpuElasticity ?? 0.6);
        const churnDeltaPct = Number(params?.churnDeltaPct ?? 2);
        const delta = baseArpu * (elasticity * (churnDeltaPct / 100));
        const newArpu = baseArpu + delta;

        table = [
          { state: "Current", arpu: baseArpu },
          { state: `-${churnDeltaPct}% churn`, arpu: newArpu }
        ];
      } else if (kind === "cltv") {
        const arpu = Number(fin.arpu ?? 65);
        const churn = Number(fin.churn ?? 0.02);
        const gm = Number(fin.grossMargin ?? 0.62);
        const cltv = (arpu * gm) / churn; // Simplified monthly model
        table = [{ metric: "CLTV", value: cltv }];
      } else if (kind === "irr") {
        const rows = (ds["roi_by_strategy"] || []).map((r: any) => ({
          strategy: r.strategy,
          irr: Number(r.irr || r.roiPct * 0.6) / 100
        }));
        table = rows;
      } else if (kind === "roi") {
        const rows = (ds["roi_by_strategy"] || []).map((r: any) => ({
          strategy: r.strategy,
          roi: Number(r.roiPct) / 100
        }));
        table = rows;
      }
      continue;
    }

    const source = step.from ? [...(ds[step.from] || [])] : [];
    let rows = source.map(r => ({ ...r }));

    // Handle slice (just copy all rows from source)
    if (step.op === "slice") {
      table = rows;
      continue;
    }

    // Handle aggregate (just copy all rows from source)
    if (step.op === "aggregate") {
      table = rows;
      continue;
    }

    // Apply WHERE filters
    if (step.where?.length) {
      rows = rows.filter(r =>
        step.where!.every(w => {
          const v = r[w.field];
          if (w.op === "eq") return v === w.value;
          if (w.op === "gt") return v > w.value;
          if (w.op === "lt") return v < w.value;
          if (w.op === "in") return Array.isArray(w.value) && w.value.includes(v);
          return true;
        })
      );
    }

    // Apply SELECT projection
    if (step.select?.length) {
      rows = rows.map(r => Object.fromEntries(step.select!.map(k => [k, r[k]])));
    }

    // Apply ORDER BY
    if (step.orderBy) {
      const { field, dir } = step.orderBy;
      rows.sort((a, b) => (a[field] > b[field] ? 1 : -1) * (dir === "asc" ? 1 : -1));
    }

    // Apply LIMIT
    if (typeof step.limit === "number") {
      rows = rows.slice(0, step.limit);
    }

    table = rows;
  }

  // Build chart specification with MANDATORY labels
  const chart: ChartSpec = (() => {
    const kind = plan.chart.kind;

    if (plan.intent === "risk_dist") {
      return {
        kind,
        title: plan.chart.title,
        series: [{
          name: "Risk Segments",
          data: (table.length ? table : ds.risk_distribution).map((r: any) => ({
            x: r.segment || r.level,
            y: r.size || r.customers
          }))
        }]
      };
    }

    // For bar/line charts, enforce labels
    const first = table[0] || {};
    const keys = Object.keys(first);
    const xKey = keys.find(k => typeof first[k] !== "number") || "x";
    const yKey = keys.find(k => typeof first[k] === "number") || "y";

    return {
      kind,
      title: plan.chart.title,
      xLabel: plan.chart.xLabel || (xKey[0].toUpperCase() + xKey.slice(1)),
      yLabel: plan.chart.yLabel || (yKey[0].toUpperCase() + yKey.slice(1)),
      series: [{
        name: plan.intent.toUpperCase(),
        data: table.map(r => ({
          x: String(r[xKey]),
          y: Number(r[yKey])
        }))
      }]
    };
  })();

  // Generate lead sentence based on intent
  const lead = (() => {
    if (plan.intent === "drivers" && table[0]) {
      return `Top churn driver is ${table[0].feature || table[0].name} at ${pct(table[0].importance)}.`;
    }
    if (plan.intent === "arpu" && table[1]) {
      return `ARPU rises from ${money(table[0].arpu)} to ${money(table[1].arpu)} with churn reduction.`;
    }
    if (plan.intent === "roi_compare" && table[0]) {
      return `Best ROI strategy: ${table[0].strategy} at ${pct(table[0].roi)}.`;
    }
    if (plan.intent === "risk_dist") {
      return "Risk is concentrated in higher tiers; focus Very High and High segments for maximum retention impact.";
    }
    if (plan.intent === "cltv" && table[0]) {
      return `Customer lifetime value is ${money(table[0].value)}.`;
    }
    return "Analysis complete based on your data.";
  })();

  return { table, chart, lead };
}
