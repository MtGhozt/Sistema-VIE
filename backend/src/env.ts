import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Carga siempre backend/.env aunque `pnpm dev` arranque desde la raíz del monorepo.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function trimmed(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required(
    "DATABASE_URL",
    "postgresql://vie:vie@localhost:5432/fondos_vie",
  ),
  nodeEnv: process.env.NODE_ENV ?? "development",
  /** Proveedor de IA: "gemini" (Google) u "openai" (API compatible). */
  aiProvider: (process.env.AI_PROVIDER ?? "gemini").toLowerCase(),
  /** Clave de Google AI Studio; nunca se envía al frontend. */
  geminiApiKey: trimmed("GEMINI_API_KEY") || trimmed("AI_API_KEY"),
  geminiBaseUrl: (process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, ""),
  /** API compatible con OpenAI (solo si AI_PROVIDER=openai). */
  aiBaseUrl: (process.env.AI_BASE_URL ?? "http://127.0.0.1:11434/v1").replace(/\/$/, ""),
  aiApiKey: trimmed("AI_API_KEY"),
  aiModel: trimmed("AI_MODEL") || "gemini-3.5-flash-lite",
  /** Modelos de respaldo si el principal está saturado o no disponible. */
  aiFallbackModels: (process.env.AI_FALLBACK_MODELS ?? "gemini-3.1-flash-lite,gemini-3.6-flash,gemini-3.8-flash")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 45000),
};
