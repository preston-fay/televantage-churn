import { getRetriever } from '../rag/retriever';

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
      table: rows.map((r:any)=>({ segment: r.level, customers: r.customers })),
      text: "Risk distribution by customer segment.",
      citations: [{ source:"ExecutiveDashboard", ref:"Risk distribution" }]
    };
  },

  get_feature_importance({ topN=10 }:{ topN?: number } = {}): ToolResult {
    const all = AppData?.feature_importance?.features || [];
    const rows = all.slice(0, topN);
    return {
      table: rows.map((r:any)=>({
        driver: r.name,
        importance: Number(r.importance)
      })),
      text: `Top ${topN} churn drivers by model importance.`,
      citations: [{ source:"ModelingDeepDive", ref:"Feature importance" }]
    };
  },

  get_roi_by_strategy(): ToolResult {
    const rows = [
      { strategy: "Budget Optimization", roiPct: 160, savings: 571000000, investment: 220000000, irr: 96 },
      { strategy: "Contract Conversion", roiPct: 112, savings: 223000000, investment: 199000000, irr: 67 },
      { strategy: "Onboarding Excellence", roiPct: 96, savings: 98000000, investment: 50000000, irr: 58 }
    ];
    // Return ALL decision metrics; LLM chooses presentation.
    const table = rows.map((r:any)=>({
      strategy: r.strategy,
      investment: r.investment,        // $
      savings: r.savings,              // $
      netBenefit: r.savings - r.investment,  // PRIMARY DECISION METRIC
      roiPct: r.roiPct,                // %
      irrPct: r.irr                    // %
    }));
    // Sort by primary decision metric for quick "optimal" answers
    table.sort((a,b)=> b.netBenefit - a.netBenefit);
    return {
      table,
      text: `Strategy comparison table with investment, savings, net benefit (primary decision metric), ROI%, and IRR%.`,
      citations: [{ source:"ScenarioPlanner", ref:"ROI/IRR comparison" }]
    };
  },

  compute_arpu_impact({ churnDeltaPct=2 }:{ churnDeltaPct:number }): ToolResult {
    const baseArpu = 65;
    const elasticity = 0.6;
    const delta = baseArpu * (elasticity * (churnDeltaPct/100));
    const newArpu = baseArpu + delta;
    return {
      table: [
        { state:"Current", arpu: baseArpu, elasticity },
        { state:`-${churnDeltaPct}% churn`, arpu: newArpu, delta, elasticity }
      ],
      text: `ARPU scenario table for ${churnDeltaPct}% churn reduction. Current: ${money(baseArpu)}, New: ${money(newArpu)} (delta: ${money(delta)}).`,
      citations: [{ source:"ScenarioPlanner", ref:"ARPU elasticity model" }]
    };
  },

  compute_cltv(): ToolResult {
    const arpu = 65;
    const churn = 0.02;
    const gm = 0.62;
    const cltv = (arpu * gm) / churn;
    return {
      table: [{ metric:"CLTV", value: cltv, arpu, grossMarginPct: gm, churnPct: churn }],
      text: `CLTV with transparent inputs: ${money(cltv)} (ARPU ${money(arpu)}, margin ${pct(gm)}, churn ${pct(churn)}).`,
      citations: [{ source:"ExecutiveDashboard", ref:"Financial KPIs" }]
    };
  },

  async rag_search({ query, section_ids, tags, top_k }: {
    query: string;
    section_ids?: string[];
    tags?: string[];
    top_k?: number;
  }): Promise<ToolResult> {
    const retriever = getRetriever();

    try {
      const results = await retriever.retrieve(query, {
        topK: top_k,
        sectionIds: section_ids,
        tags: tags
      });

      const context = retriever.formatContext(results);
      const citations = retriever.getCitations(results);

      return {
        text: context,
        citations: citations.map(c => ({
          source: c.section_id,
          ref: c.title
        }))
      };
    } catch (error) {
      return {
        text: `RAG search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        citations: []
      };
    }
  }
} as const;

export type ToolName = keyof typeof Tools;

export const toolSpecs = [
  { name:"get_risk_distribution", description:"Return customer counts by risk segment (Low, Medium, High, Very High)", parameters:{} },
  { name:"get_feature_importance", description:"Return top churn drivers from ML model", parameters:{ type:"object", properties:{ topN:{ type:"number", description:"Number of top drivers to return" } } } },
  { name:"get_roi_by_strategy", description:"Return ROI percentage by retention strategy", parameters:{} },
  { name:"compute_arpu_impact", description:"Calculate ARPU impact from churn reduction", parameters:{ type:"object", properties:{ churnDeltaPct:{ type:"number", description:"Percentage churn reduction" } }, required:["churnDeltaPct"] } },
  { name:"compute_cltv", description:"Compute customer lifetime value from financials", parameters:{} },
  {
    name:"rag_search",
    description:"Search the TeleVantage telco churn expert knowledge base. Returns relevant passages with citations from sections: finance, network-economics, pricing-elasticity, lifecycle, modeling, ops, geo.",
    parameters:{
      type:"object",
      properties:{
        query:{ type:"string", description:"The search query or question" },
        section_ids:{ type:"array", items:{ type:"string" }, description:"Optional: filter to specific sections" },
        tags:{ type:"array", items:{ type:"string" }, description:"Optional: filter by tags (ARPU, churn, NPV, IRR, capex, pricing, elasticity, retention, uplift, survival, CRM, NBA, geospatial)" },
        top_k:{ type:"number", description:"Number of results to return (default: 6)" }
      },
      required:["query"]
    }
  }
];
