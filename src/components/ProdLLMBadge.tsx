import { ENV, HAS_LLM } from "../config/env";

export default function ProdLLMBadge() {
  if (!ENV.PROD) return null;

  const ok = HAS_LLM;
  const msg = ok ? `LLM ON (${ENV.MODEL})` : `LLM OFF — deterministic mode`;

  return (
    <div
      className={`fixed bottom-3 right-3 z-50 text-xs px-2 py-1 rounded shadow ${
        ok ? "bg-emerald-600" : "bg-slate-700"
      } text-white`}
    >
      {msg}
    </div>
  );
}
