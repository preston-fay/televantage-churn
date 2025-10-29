import { ENV, HAS_LLM } from "../config/env";
import { toolSpecs, Tools, ToolName } from "./tools";

export async function llmWithTools(question:string){
  if (!HAS_LLM) throw new Error("LLMUnavailable: No API key configured");

  const res = await fetch(`${ENV.BASE}/v1/chat/completions`,{
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${ENV.KEY}` },
    body: JSON.stringify({
      model: ENV.MODEL,
      temperature: 0.2,
      tools: toolSpecs.map(s => ({
        type:"function",
        function:{
          name:s.name,
          description:s.description,
          parameters:s.parameters || { type:"object", properties:{} }
        }
      })),
      tool_choice: "auto",
      messages: [
        { role:"system", content: [
            "You are a telco churn analyst applying ZEN CONSENSUS.",
            "",
            "TOOL SELECTION PRIORITY:",
            "1) For BROAD, CONCEPTUAL, or STRATEGIC questions (e.g., 'tell me about telco business', 'explain churn', 'what is ARPU', 'how does network economics work'), ALWAYS use `rag_search` tool FIRST.",
            "2) For SPECIFIC NUMERIC questions (e.g., 'what is the ROI', 'show me risk distribution', 'calculate CLTV'), use the data tools (get_roi_by_strategy, get_risk_distribution, etc.).",
            "3) When in doubt about which tool to use, prefer `rag_search` for questions containing: why, how, what is, explain, define, describe, tell me about.",
            "",
            "PRINCIPLES:",
            "1) Use tools to obtain COMPLETE tables; tools do not choose visuals.",
            "2) Decide WHETHER to chart and WHAT to chart based on the question intent.",
            "3) For questions asking 'optimal/best', emphasize the PRIMARY DECISION METRIC (Net Benefit $), not ROI%.",
            "4) For 'compare X', chart X (e.g., ROI%, IRR) with xLabel/yLabel.",
            "5) If unsure whether a chart adds value, respond with text only; no chart.",
            "6) Always include at least one citation referencing source tabs or knowledge base sections.",
            "7) All non-donut charts MUST include xLabel and yLabel.",
            "8) Keep text concise (2-3 sentences max) and actionable.",
            "",
            "RAG KNOWLEDGE BASE:",
            "- The `rag_search` tool accesses the Telco Churn Expert v2 corpus covering:",
            "  * Financial metrics (ARPU, NPV, IRR, CLV)",
            "  * Network economics & IRR models",
            "  * Pricing elasticity & ARPU optimization",
            "  * Customer lifecycle analytics",
            "  * ML modeling frameworks (binary, survival, uplift, RL)",
            "  * Operational integration (CRM, NBA, campaigns)",
            "  * Geospatial & competitive analytics",
            "- Always cite retrieved sections using [section_id] format (e.g., [finance], [modeling]).",
            "- If no relevant context is found in the knowledge base, say 'I don't have that information in my knowledge base' rather than guessing."
          ].join("\n") },
        { role:"user", content: question }
      ]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();

  // If the LLM requested a tool, execute it and return final
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (call) {
    const fn = call.function?.name as ToolName;
    const args = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
    const out = await (Tools[fn] as any)(args); // Support async tools
    return { fromTool: true, fn, args, out };
  }

  // Otherwise return text-only (rare case where LLM doesn't use tools)
  return { fromTool:false, text: data.choices?.[0]?.message?.content?.trim() || "I understand your question but need more specific data to answer." };
}
