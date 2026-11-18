type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Limitador en memoria por clave (IP + ruta). Suficiente para el prototipo local;
 * no sustituye un WAF ni un limitador distribuido en producción.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function clientKey(req: { ip?: string; socket?: { remoteAddress?: string } }, suffix: string) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `${ip}:${suffix}`;
}
