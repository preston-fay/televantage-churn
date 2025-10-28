/**
 * Environment Configuration (Vite/Amplify compatible)
 * Uses import.meta.env for proper Vite environment variable access
 */

type Env = {
  OPENAI_KEY?: string;
  OPENAI_MODEL: string;
  OPENAI_BASE_URL: string;
};

const e = import.meta.env as any;

export const ENV: Env = {
  OPENAI_KEY: e.VITE_OPENAI_API_KEY,
  OPENAI_MODEL: e.VITE_OPENAI_MODEL_ID || "gpt-4o",
  OPENAI_BASE_URL: e.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1"
};

export const hasLLM = !!ENV.OPENAI_KEY && ENV.OPENAI_KEY !== 'your_openai_api_key_here' && !!ENV.OPENAI_MODEL;
