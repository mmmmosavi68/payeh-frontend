import "server-only";
import { z } from "zod";

const schema = z.object({
  /** آدرس API، مثلاً http://localhost:5159 */
  API_BASE_URL: z.url(),
  /** آدرس عمومی سایت (اختیاری). اگر تنظیم شود Origin درخواست‌ها دقیقاً با آن مقایسه می‌شود. */
  APP_ORIGIN: z.url().optional(),
  /** فقط پشت Reverse Proxy مورد اعتماد (nginx و ...) مقدار 1 بگذارید. */
  TRUST_PROXY: z.enum(["0", "1"]).default("0"),
  REFRESH_COOKIE_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  BACKEND_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;