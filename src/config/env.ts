/**
 * Environment Configuration (Vite/Amplify compatible)
 * Uses import.meta.env for Amplify build-time injection
 */

type Env = {
  KEY?: string;
  MODEL: string;
  BASE: string;
  PROD: boolean;
};

const e = import.meta.env as any;

export const ENV: Env = {
  KEY: e.VITE_OPENAI_API_KEY,                                // injected by Amplify at build
  MODEL: e.VITE_OPENAI_MODEL_ID || "gpt-4o",
  BASE: e.VITE_OPENAI_BASE_URL || "https://api.openai.com",
  PROD: !!e.PROD || !!e.PRODUCTION || import.meta.env.PROD
};

export const HAS_LLM = !!ENV.KEY && !!ENV.MODEL;

// Log configuration on module load (for debugging)
console.log("🔧 Environment Configuration:");
console.log("  - HAS_LLM:", HAS_LLM);
console.log("  - Model:", ENV.MODEL);
console.log("  - PROD:", ENV.PROD);
console.log("  - API Key:", ENV.KEY ? `${ENV.KEY.substring(0, 20)}...` : "NOT SET");
