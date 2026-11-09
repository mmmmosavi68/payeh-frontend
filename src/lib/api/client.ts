import { z } from "zod";
import { COOKIE, CSRF_HEADER } from "@/lib/auth/cookie-names";
import { ApiError, ApiStatus } from "./errors";

const envelopeSchema = z.object({
  isSuccess: z.boolean(),
  statusCode: z.number(),
  message: z.string().nullish(),
  data: z.unknown().optional(),
});

function readCookie(name: string): string | null {
  const entry = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function redirectToLogin() {
  const { pathname, search } = window.location;
  if (/\/login(\/|$)/.test(pathname)) return;

  const locale = document.documentElement.lang || "fa";
  const rest = pathname.replace(/^\/(fa|en)(?=\/|$)/, "") || "/";
  window.location.assign(`/${locale}/login?returnUrl=${encodeURIComponent(rest + search)}`);
}

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** ساختار مورد انتظار data؛ خروجی سرور قبل از استفاده اعتبارسنجی می‌شود. */
  schema: z.ZodType<T>;
};

export async function apiRequest<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  if (method !== "GET") {
    const csrf = readCookie(COOKIE.csrf);
    if (!csrf) throw new ApiError(ApiStatus.Forbidden);
    headers[CSRF_HEADER] = csrf;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const queryString = params.toString();

  let response: Response;
  try {
    response = await fetch(`/api/bff/${path}${queryString ? `?${queryString}` : ""}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(ApiStatus.ServerError, "", "network");
  }

  if (response.status === 401) {
    redirectToLogin();
    throw new ApiError(ApiStatus.UnAuthorized);
  }

  if (response.status === 403) {
    const locale = document.documentElement.lang || "fa";
    if (!window.location.pathname.endsWith("/forbidden")) window.location.assign(`/${locale}/forbidden`);
    throw new ApiError(ApiStatus.Forbidden);
  }

  if (response.status === 204) {
    const empty = options.schema.safeParse(undefined);
    if (!empty.success) throw new ApiError(ApiStatus.ServerError);
    return empty.data;
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // پاسخ JSON نبود
  }

  const envelope = envelopeSchema.safeParse(json);

  if (!response.ok || (envelope.success && !envelope.data.isSuccess)) {
    throw new ApiError(envelope.success ? envelope.data.statusCode : ApiStatus.ServerError, envelope.success ? (envelope.data.message ?? "") : "");
  }

  if (!envelope.success) throw new ApiError(ApiStatus.ServerError);

  const data = options.schema.safeParse(envelope.data.data);
  if (!data.success) throw new ApiError(ApiStatus.ServerError);

  return data.data;
}
