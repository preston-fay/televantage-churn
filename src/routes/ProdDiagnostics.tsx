import { useEffect, useState } from "react";
import { askCopilot } from "../services/aiServiceV2";
import { ENV } from "../config/env";

type Check = {
  name: string;
  query: string;
  expect: (r: any) => boolean;
  result?: "pass" | "fail";
  details?: string;
};

export default function ProdDiagnostics() {
  const [checks, setChecks] = useState<Check[]>([
    {
      name: "Definition (RAG): What is ARPU?",
      query: "What is ARPU?",
      expect: (r) =>
        typeof r.text === "string" &&
        /revenue.*per.*user|subscriber|monthly/i.test(r.text) &&
        r.citations?.length > 0,
    },
    {
      name: "Compute+Chart: ARPU impact 2%",
      query: "Show ARPU impact of 2% churn reduction",
      expect: (r) =>
        r.chart?.kind === "bar" && !!r.chart?.xLabel && !!r.chart?.yLabel,
    },
    {
      name: "Donut Labels: Risk distribution",
      query: "Show me customer risk distribution",
      expect: (r) =>
        r.chart?.kind === "donut" &&
        (r.chart?.series?.[0]?.data || []).every(
          (p: any) => typeof p.x === "string"
        ),
    },
    {
      name: "ROI Compare Chart",
      query: "Compare ROI across strategies",
      expect: (r) =>
        r.chart?.kind === "bar" && /strategy/i.test(r.chart?.xLabel || ""),
    },
  ]);

  const [running, setRunning] = useState(false);
  const [llm, setLlm] = useState<string>("");

  useEffect(() => {
    setLlm(ENV.MODEL);
  }, []);

  const run = async () => {
    setRunning(true);
    const out: Check[] = [];
    for (const c of checks) {
      try {
        const r = await askCopilot({ text: c.query });
        const ok = c.expect(r);
        out.push({
          ...c,
          result: ok ? "pass" : "fail",
          details: r.chart?.title || r.text?.slice(0, 120) || "",
        });
      } catch (e: any) {
        out.push({
          ...c,
          result: "fail",
          details: e?.message || String(e),
        });
      }
    }
    setChecks(out);
    setRunning(false);
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h1 className="text-xl font-semibold mb-2">Production LLM Diagnostics</h1>
      <p className="mb-4">
        Model: <code>{llm}</code> · Env:{" "}
        <code>{ENV.PROD ? "production" : "non-prod"}</code>
      </p>
      <button
        disabled={running}
        onClick={run}
        className="px-3 py-1 rounded bg-indigo-600 disabled:opacity-50"
      >
        {running ? "Running…" : "Re-run checks"}
      </button>
      <div className="mt-4 space-y-2">
        {checks.map((c, i) => (
          <div key={i} className="rounded border border-slate-600 p-3">
            <div className="flex items-center justify-between">
              <div>
                <strong>{c.name}</strong>
                <div className="text-slate-300 text-xs">"{c.query}"</div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  c.result === "pass" ? "bg-emerald-700" : "bg-rose-700"
                }`}
              >
                {c.result?.toUpperCase() || "…"}
              </span>
            </div>
            {c.details && (
              <div className="text-slate-300 text-xs mt-1">
                Details: {c.details}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-slate-300 text-xs">
        No secrets are displayed. This page only shows pass/fail and titles.
      </p>
    </div>
  );
}
