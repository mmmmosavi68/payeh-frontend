import "server-only";
import { env } from "@/lib/env.server";

export type ClientContext = { clientIp?: string; userAgent?: string };

export type BackendResult = {
  status: number;
  body: string;
  headers: Headers;
};

type BackendCall = ClientContext & {
  method: string;
  /** مسیر بعد از /api/v1/ (قبلاً با allowlist بررسی شده). */
  path: string;
  search?: string;
  body?: string;
  accessToken?: string;
};

/** تنها نقطه‌ای که از Next.js به API زنگ می‌زند. */
export async function callBackend(call: BackendCall): Promise<BackendResult> {
  const base = env.API_BASE_URL.replace(/\/$/, "");
  const url = `${base}/api/v1/${call.path}${call.search ?? ""}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (call.body !== undefined) headers["Content-Type"] = "application/json";
  if (call.accessToken) headers.Authorization = `Bearer ${call.accessToken}`;
  if (call.clientIp) headers["X-Forwarded-For"] = call.clientIp;
  if (call.userAgent) headers["User-Agent"] = call.userAgent;

  const response = await fetch(url, {
    method: call.method,
    headers,
    body: call.body,
    cache: "no-store",
    // ریدایرکت (مثلاً http→https) دنبال نمی‌شود؛ خطای پیکربندی دیده می‌شود.
    redirect: "manual",
    signal: AbortSignal.timeout(env.BACKEND_TIMEOUT_MS),
  });

  return {
    status: response.status,
    body: await response.text(),
    headers: response.headers,
  };
}