import "server-only";
import { z } from "zod";
import { callBackend, type ClientContext } from "@/lib/api/backend";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const refreshSchema = z.object({
  isSuccess: z.boolean(),
  data: z
    .object({
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1),
      expiresIn: z.number().int().positive(),
    })
    .nullish(),
});

/**
 * refresh چرخشی است: هر refresh token فقط یک‌بار قابل مصرف است و استفاده‌ی دوباره از آن
 * کل نشست را باطل می‌کند. پس درخواست‌های هم‌زمان با یک refresh token باید یک نتیجه‌ی مشترک بگیرند
 * (single-flight) و نتیجه چند لحظه نگه داشته شود تا درخواست‌هایی که با کوکی قدیمی در راه بودند
 * هم از همان استفاده کنند. این حافظه مخصوص همین پردازش است (برای چند instance به Redis نیاز دارد).
 */
const GRACE_MS = 60_000;
const cache = new Map<string, { promise: Promise<Tokens | null>; expiresAt: number }>();

function prune(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

async function requestRefresh(
  refreshToken: string,
  context: ClientContext,
): Promise<Tokens | null> {
  const result = await callBackend({
    method: "POST",
    path: "Auth/refresh",
    body: JSON.stringify({ refreshToken }),
    ...context,
  });

  // رد قطعی توکن: نشست تمام شده است.
  if (result.status === 400 || result.status === 401) return null;
  // خطای موقت (شبکه، 429، 5xx): پرتاب می‌شود تا کوکی‌ها پاک نشوند.
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`refresh failed with status ${result.status}`);
  }

  const parsed = refreshSchema.safeParse(JSON.parse(result.body));
  if (!parsed.success || !parsed.data.isSuccess || !parsed.data.data) return null;

  return parsed.data.data;
}

export function refreshTokens(
  refreshToken: string,
  context: ClientContext,
): Promise<Tokens | null> {
  const now = Date.now();
  prune(now);

  const hit = cache.get(refreshToken);
  if (hit) return hit.promise;

  const promise = requestRefresh(refreshToken, context);
  cache.set(refreshToken, { promise, expiresAt: now + GRACE_MS });

  // نتیجه‌ی ناموفق یا خطا نباید تا پایان بازه نگه داشته شود.
  promise
    .then((tokens) => {
      if (!tokens) cache.delete(refreshToken);
    })
    .catch(() => cache.delete(refreshToken));

  return promise;
}