// Global app data will be set by copilot service
let AppData: any = null;

export function setToolsData(data: any) {
  AppData = data;
}

const money = (n:number)=> n>=1e9?`$${(n/1e9).toFixed(1)}B`: n>=1e6?`$${(n/1e6).toFixed(1)}M`:`$${n.toFixed(2)}`;
const pct = (n:number)=> `${(n*100).toFixed(1)}%`;

export type ToolResult = { table?: any[]; chart?: any; text?: string; citations?: Array<{source:string, ref:string}> };

export const Tools = {
  get_risk_distribution(): ToolResult {
    const rows = AppData?.risk_distribution?.risk_levels || [];
    return {
      table: rows,
      chart: {
        kind: "donut", title: "Customer Risk Distribution",
        series: [{ name:"Risk Segments", data: rows.map((r:any)=>({ x:r.level, y:r.customers })) }]
      },
      citations: [{ source:"ExecutiveDashboard", ref:"Risk distribution donut" }]
    };
  },

  get_feature_importance({ topN=10 }:{ topN?: number } = {}): ToolResult {
    const all = AppData?.feature_importance?.features || [];
    const rows = all.slice(0, topN);
    return {
      table: rows,
      chart: {
        kind: "bar", title: `Top ${topN} Churn Drivers (ML Importance)`,
        xLabel: "Driver", yLabel: "Importance Score",
        series: [{ name:"Drivers", data: rows.map((r:any)=>({ x:r.name, y:Number(r.importance) })) }]
      },
      citations: [{ source:"ModelingDeepDive", ref:"Feature importance" }]
    };
  },

  get_roi_by_strategy(): ToolResult {
    const rows = [
      { strategy: "Budget Optimization", roiPct: 160, savings: 571000000, investment: 220000000, irr: 96 },
      { strategy: "Contract Conversion", roiPct: 112, savings: 223000000, investment: 199000000, irr: 67 },
      { strategy: "Onboarding Excellence", roiPct: 96, savings: 98000000, investment: 50000000, irr: 58 }
    ];
    return {
      table: rows,
      chart: {
        kind: "bar", title: "ROI by Strategy",
        xLabel: "Strategy", yLabel: "ROI (%)",
        series: [{ name:"ROI", data: rows.map((r:any)=>({ x:r.strategy, y:r.roiPct })) }]
      },
      citations: [{ source:"ScenarioPlanner", ref:"ROI comparison" }]
    };
  },

  compute_arpu_impact({ churnDeltaPct=2 }:{ churnDeltaPct:number }): ToolResult {
    const baseArpu = 65;
    const elasticity = 0.6;
    const delta = baseArpu * (elasticity * (churnDeltaPct/100));
    const newArpu = baseArpu + delta;
    return {
      table: [{ state:"Current", arpu: baseArpu }, { state:`-${churnDeltaPct}% churn`, arpu:newArpu }],
      chart: {
        kind: "bar", title:`ARPU Impact of ${churnDeltaPct}% Churn Reduction`,
        xLabel:"Scenario", yLabel:"ARPU ($/month)",
        series: [{ name:"ARPU", data: [{ x:"Current", y:baseArpu }, { x:`-${churnDeltaPct}%`, y:newArpu }] }]
      },
      citations: [{ source:"ScenarioPlanner", ref:"ARPU elasticity model" }],
      text: `ARPU rises by ${money(delta)} to ${money(newArpu)} with ${churnDeltaPct}% churn reduction (elasticity ${elasticity}).`
    };
  },

  compute_cltv(): ToolResult {
    const arpu = 65;
    const churn = 0.02;
    const gm = 0.62;
    const cltv = (arpu * gm) / churn;
    return {
      table: [{ metric:"CLTV", value: cltv }],
      citations: [{ source:"ExecutiveDashboard", ref:"Financial KPIs" }],
      text: `Estimated CLTV ≈ ${money(cltv)} per customer (ARPU ${money(arpu)}, margin ${pct(gm)}, churn ${pct(churn)}).`
    };
  }
} as const;

export type ToolName = keyof typeof Tools;

export const toolSpecs = [
  { name:"get_risk_distribution", description:"Return customer counts by risk segment (Low, Medium, High, Very High)", parameters:{} },
  { name:"get_feature_importance", description:"Return top churn drivers from ML model", parameters:{ type:"object", properties:{ topN:{ type:"number", description:"Number of top drivers to return" } } } },
  { name:"get_roi_by_strategy", description:"Return ROI percentage by retention strategy", parameters:{} },
  { name:"compute_arpu_impact", description:"Calculate ARPU impact from churn reduction", parameters:{ type:"object", properties:{ churnDeltaPct:{ type:"number", description:"Percentage churn reduction" } }, required:["churnDeltaPct"] } },
  { name:"compute_cltv", description:"Compute customer lifetime value from financials", parameters:{} }
];
