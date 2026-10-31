import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env.server";

/** درخواست‌های تغییردهنده فقط از همین سایت پذیرفته می‌شوند. */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  if (env.APP_ORIGIN) {
    return origin === new URL(env.APP_ORIGIN).origin;
  }

  const forwardedHost =
    env.TRUST_PROXY === "1" ? request.headers.get("x-forwarded-host") : null;
  const host = forwardedHost ?? request.headers.get("host");

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}