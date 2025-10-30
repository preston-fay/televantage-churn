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
    const table = rows.map((r:any)=>({ segment: r.level, customers: r.customers }));

    // Generate donut chart for visualization
    const chart = {
      kind: "donut",
      title: "Customer Risk Distribution",
      series: [{
        name: "Customers",
        data: table.map((r:any) => ({ x: r.segment, y: r.customers }))
      }]
    };

    return {
      table,
      chart,
      text: "Risk distribution by customer segment.",
      citations: [{ source:"ExecutiveDashboard", ref:"Risk distribution" }]
    };
  },

  get_feature_importance({ topN=10 }:{ topN?: number } = {}): ToolResult {
    const all = AppData?.feature_importance?.features || [];
    const rows = all.slice(0, topN);
    const table = rows.map((r:any)=>({
      driver: r.name,
      importance: Number(r.importance)
    }));

    // Generate horizontal bar chart for visualization
    const chart = {
      kind: "bar",
      title: `Top ${topN} Churn Drivers`,
      xLabel: "Importance Score",
      yLabel: "Driver",
      series: [{
        name: "Importance",
        data: table.map((r:any) => ({ x: r.driver, y: r.importance }))
      }]
    };

    return {
      table,
      chart,
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

    // Generate chart for visualization
    const chart = {
      kind: "bar",
      title: "ROI by Strategy",
      xLabel: "Strategy",
      yLabel: "ROI %",
      series: [{
        name: "ROI",
        data: table.map(r => ({ x: r.strategy, y: r.roiPct }))
      }]
    };

    return {
      table,
      chart,
      text: `Budget Optimization leads with 160% ROI, followed by Contract Conversion (112%) and Onboarding Excellence (96%).`,
      citations: [{ source:"ScenarioPlanner", ref:"ROI/IRR comparison" }]
    };
  },

  compute_arpu_impact({ churnDeltaPct=2 }:{ churnDeltaPct:number }): ToolResult {
    const baseArpu = 65;
    const elasticity = 0.6;
    const delta = baseArpu * (elasticity * (churnDeltaPct/100));
    const newArpu = baseArpu + delta;

    const table = [
      { state:"Current", arpu: baseArpu, elasticity },
      { state:`-${churnDeltaPct}% churn`, arpu: newArpu, delta, elasticity }
    ];

    // Generate bar chart for visualization
    const chart = {
      kind: "bar",
      title: `ARPU Impact from ${churnDeltaPct}% Churn Reduction`,
      xLabel: "Scenario",
      yLabel: "ARPU ($)",
      series: [{
        name: "ARPU",
        data: table.map(r => ({ x: r.state, y: r.arpu }))
      }]
    };

    return {
      table,
      chart,
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

  get_segment_analysis({ contract_type, tenure_band, risk_level, value_tier }: { contract_type?: string; tenure_band?: string; risk_level?: string; value_tier?: string } = {}): ToolResult {
    let segments = AppData?.segments || [];

    // Filter by contract type if specified
    if (contract_type) {
      const normalized = contract_type.toLowerCase();
      if (normalized.includes('month') || normalized.includes('mtm') || normalized.includes('m2m')) {
        segments = segments.filter((s:any) => s.contract_group === 'M2M');
      } else if (normalized.includes('year') || normalized.includes('annual') || normalized.includes('1yr') || normalized.includes('2yr')) {
        segments = segments.filter((s:any) => s.contract_group === '1yr' || s.contract_group === '2yr');
      }
    }

    // Filter by tenure if specified - be flexible with matching
    if (tenure_band) {
      const normalized = tenure_band.toLowerCase();
      // Map common tenure phrases to actual data values
      let targetTenure = normalized;

      if (normalized.includes('early') || normalized.includes('new') || normalized.includes('0-3')) {
        targetTenure = '0-3m';
      } else if (normalized.includes('4-12') || normalized.includes('4 to 12') || normalized.includes('young')) {
        targetTenure = '4-12m';
      } else if (normalized.includes('13-24') || normalized.includes('13 to 24') || normalized.includes('mid')) {
        targetTenure = '13-24m';
      } else if (normalized.includes('25-48') || normalized.includes('25 to 48') || normalized.includes('mature')) {
        targetTenure = '25-48m';
      } else if (normalized.includes('49-72') || normalized.includes('49 to 72') || normalized.includes('long') || normalized.includes('established')) {
        targetTenure = '49-72m';
      }

      segments = segments.filter((s:any) => s.tenure_band === targetTenure);
    }

    // Filter by risk level if specified
    if (risk_level) {
      const normalized = risk_level.toLowerCase();
      // Map common risk phrases to actual data values
      let targetRisk = '';

      if (normalized.includes('low')) {
        targetRisk = 'Low';
      } else if (normalized.includes('medium') || normalized.includes('med')) {
        targetRisk = 'Medium';
      } else if (normalized.includes('high') && !normalized.includes('very')) {
        targetRisk = 'High';
      } else if (normalized.includes('very high') || normalized.includes('very-high')) {
        targetRisk = 'Very High';
      }

      if (targetRisk) {
        segments = segments.filter((s:any) => s.risk_level === targetRisk);
      }
    }

    // Filter by value tier if specified
    if (value_tier) {
      const normalized = value_tier.toLowerCase();
      // Map common value phrases to actual data values
      let targetValue = '';

      if (normalized.includes('low')) {
        targetValue = 'Low';
      } else if (normalized.includes('med') || normalized.includes('medium')) {
        targetValue = 'Med';
      } else if (normalized.includes('high')) {
        targetValue = 'High';
      }

      if (targetValue) {
        segments = segments.filter((s:any) => s.value_tier === targetValue);
      }
    }

    if (segments.length === 0) {
      return {
        text: `No segments found matching criteria: ${contract_type || 'all contracts'}, ${tenure_band || 'all tenure bands'}, ${risk_level || 'all risk levels'}, ${value_tier || 'all value tiers'}. Available: tenure (0-3m, 4-12m, 13-24m, 25-48m, 49-72m), contracts (M2M, 1yr, 2yr), risk (Low, Medium, High, Very High), value (Low, Med, High).`,
        citations: [{ source: "ExecutiveDashboard", ref: "Segment analysis" }]
      };
    }

    // Calculate aggregate statistics
    const totalCustomers = segments.reduce((sum:number, s:any) => sum + s.customers, 0);
    const avgChurn = segments.reduce((sum:number, s:any) => sum + (s.churn_probability * s.customers), 0) / totalCustomers;
    const avgLTV = segments.reduce((sum:number, s:any) => sum + (s.avg_ltv * s.customers), 0) / totalCustomers;

    // Group by tenure for better visualization if no tenure filter specified
    let groupedData = segments;
    if (!tenure_band && segments.length > 10) {
      // Group by tenure_band for summary view
      const tenureGroups = segments.reduce((acc:any, s:any) => {
        if (!acc[s.tenure_band]) {
          acc[s.tenure_band] = {
            tenure_band: s.tenure_band,
            customers: 0,
            totalChurnWeighted: 0,
            totalLtvWeighted: 0,
            segments: []
          };
        }
        acc[s.tenure_band].customers += s.customers;
        acc[s.tenure_band].totalChurnWeighted += s.churn_probability * s.customers;
        acc[s.tenure_band].totalLtvWeighted += s.avg_ltv * s.customers;
        acc[s.tenure_band].segments.push(s);
        return acc;
      }, {});

      groupedData = Object.values(tenureGroups).map((g:any) => ({
        tenure_band: g.tenure_band,
        customers: g.customers,
        churn_probability: g.totalChurnWeighted / g.customers,
        avg_ltv: g.totalLtvWeighted / g.customers,
        risk_level: g.segments[0].risk_level  // Take first
      }));
    }

    const table = segments.map((s:any) => ({
      tenure: s.tenure_band,
      contract: s.contract_group,
      customers: s.customers,
      churnProbability: s.churn_probability,
      avgLTV: s.avg_ltv,
      riskLevel: s.risk_level
    }));

    // Generate chart showing customer distribution (use grouped data if available)
    const chartData = groupedData.map((s:any) => ({
      x: s.tenure_band || s.tenure,
      y: s.customers
    }));

    const chart = {
      kind: "bar",
      title: contract_type ? `${contract_type} Customer Distribution by Tenure` : "Customer Segment Distribution",
      xLabel: "Tenure Band",
      yLabel: "Customers",
      series: [{
        name: "Customers",
        data: chartData
      }]
    };

    const contractLabel = contract_type || "selected";
    return {
      table,
      chart,
      text: `${contractLabel} customers: ${totalCustomers.toLocaleString()} total, ${pct(avgChurn)} avg churn probability, ${money(avgLTV)} avg LTV across ${segments.length} segment(s).`,
      citations: [{ source: "ExecutiveDashboard", ref: "Segment analysis" }]
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
        text: `RAG search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that the OpenAI API key is configured and the corpus is loaded.`,
        citations: [{
          source: 'system',
          ref: 'Error: RAG unavailable'
        }]
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
  { name:"get_segment_analysis", description:"Analyze customer segments by contract type, tenure band, risk level, and/or value tier", parameters:{ type:"object", properties:{ contract_type:{ type:"string", description:"Contract type. Examples: 'month-to-month', 'MTM', 'M2M', 'annual', 'yearly', '1-year', '2-year'" }, tenure_band:{ type:"string", description:"Tenure band. Examples: 'early-tenure', 'early', 'new', '0-3m', 'young', '4-12m', 'mid-tenure', '13-24m', 'mature', '25-48m', 'long-term', 'established', '49-72m'" }, risk_level:{ type:"string", description:"Risk level. Examples: 'low-risk', 'low', 'medium-risk', 'medium', 'high-risk', 'high', 'very-high', 'very high'" }, value_tier:{ type:"string", description:"Value tier. Examples: 'low-value', 'low', 'medium-value', 'med', 'high-value', 'high'" } } } },
  {
    name:"rag_search",
    description:"Search the ChurnIQ telco churn expert knowledge base. Returns relevant passages with citations from sections: finance, network-economics, pricing-elasticity, lifecycle, modeling, ops, geo.",
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
