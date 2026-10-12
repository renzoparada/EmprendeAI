import "server-only";
import { prisma } from "@/lib/db";

/**
 * Rate limiting respaldado en Postgres (ver nota en `RateLimitBucket` en
 * schema.prisma sobre por qué no es en memoria). Ventana fija: `limit`
 * intentos por `windowMs`, reseteada por completo cuando vence — no es un
 * sliding window, pero alcanza para frenar brute-force/abuso sin la
 * complejidad de uno.
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!bucket || now.getTime() - bucket.windowStart.getTime() >= windowMs) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.windowStart.getTime() + windowMs - now.getTime()) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return { allowed: true, retryAfterSeconds: 0 };
}

export class RateLimitExceededError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Demasiados intentos. Esperá ${retryAfterSeconds}s e intentá de nuevo.`);
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const result = await checkRateLimit(key, limit, windowMs);
  if (!result.allowed) throw new RateLimitExceededError(result.retryAfterSeconds);
}
