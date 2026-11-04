import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required(
    "DATABASE_URL",
    "postgresql://vie:vie@localhost:5432/fondos_vie",
  ),
  nodeEnv: process.env.NODE_ENV ?? "development",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 300000),
  officialRubricPath: process.env.VIE_OFFICIAL_RUBRIC_PATH ?? "",
};
