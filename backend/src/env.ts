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
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterModel: process.env.OPENROUTER_MODEL ?? "openrouter/free",
  officialRubricPath: process.env.VIE_OFFICIAL_RUBRIC_PATH ?? "",
};
