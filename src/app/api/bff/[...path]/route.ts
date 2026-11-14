import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { callBackend, type BackendResult, type ClientContext } from "@/lib/api/backend";
import { ApiStatus } from "@/lib/api/errors";
import { refreshTokens, type Tokens } from "@/lib/auth/backend-session";
import { COOKIE, CSRF_HEADER } from "@/lib/auth/cookie-names";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env.server";
import { isSameOrigin } from "@/lib/security/origin";
import { randomToken, safeEqual } from "@/lib/security/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 64 * 1024;
const MAX_QUERY = 1024;
const NO_STORE = { "Cache-Control": "no-store" };

type Method = "GET" | "POST" | "PUT" | "DELETE";
type SessionEffect = "none" | "create" | "clear" | "preserve";

type Rule = {
  method: Method;
  pattern: RegExp;
  auth: boolean;
  session: SessionEffect;
};

const GUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const rules: Rule[] = [
  { method: "GET", pattern: /^auth\/config$/i, auth: false, session: "none" },
  { method: "GET", pattern: /^auth\/captcha$/i, auth: false, session: "none" },
  { method: "POST", pattern: /^auth\/otp\/request$/i, auth: false, session: "none" },
  { method: "POST", pattern: /^auth\/otp\/verify$/i, auth: false, session: "create" },
  { method: "POST", pattern: /^auth\/login$/i, auth: false, session: "create" },
  { method: "POST", pattern: /^auth\/login\/verify$/i, auth: false, session: "create" },
  { method: "POST", pattern: /^auth\/login\/resend$/i, auth: false, session: "none" },
  // خروج از دستگاه جاری؛ کوکی‌ها پاک می‌شوند.
  { method: "POST", pattern: /^auth\/logout$/i, auth: true, session: "clear" },

  // خروج از سایر دستگاه‌ها؛ کوکی دستگاه جاری حفظ می‌شود.
  { method: "POST", pattern: /^auth\/logout-all$/i, auth: true, session: "preserve" },
  { method: "GET", pattern: /^auth\/me$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^auth\/sessions$/i, auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^auth/sessions/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "GET", pattern: /^roles$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^permissions\/me$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^auditlogs$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^home\/Test$/i, auth: true, session: "none" },
  { method: "POST", pattern: /^home\/Test$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^users$/i, auth: true, session: "none" },
  { method: "POST", pattern: /^users$/i, auth: true, session: "none" },
  { method: "GET", pattern: new RegExp(`^users/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^users/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^users/${GUID}$`, "i"), auth: true, session: "none" },

  // Groups
  { method: "GET", pattern: /^groups$/i, auth: true, session: "none" },
  { method: "POST", pattern: /^groups$/i, auth: true, session: "none" },

  { method: "GET", pattern: new RegExp(`^groups/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^groups/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^groups/${GUID}$`, "i"), auth: true, session: "none" },

  { method: "GET", pattern: new RegExp(`^groups/${GUID}/users$`, "i"), auth: true, session: "none" },
  { method: "POST", pattern: new RegExp(`^groups/${GUID}/users$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^groups/${GUID}/users/${GUID}$`, "i"), auth: true, session: "none" },

  { method: "GET", pattern: /^groups\/available-menus$/i, auth: true, session: "none" },
  { method: "GET", pattern: new RegExp(`^groups/${GUID}/menu-access$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^groups/${GUID}/menu-access$`, "i"), auth: true, session: "none" },

  // Menus
  { method: "GET", pattern: /^menus$/i, auth: true, session: "none" },
  { method: "POST", pattern: /^menus$/i, auth: true, session: "none" },
  { method: "GET", pattern: new RegExp(`^menus/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^menus/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^menus/${GUID}$`, "i"), auth: true, session: "none" },

  // Groups
  { method: "GET", pattern: /^groups$/i, auth: true, session: "none" },
  { method: "POST", pattern: /^groups$/i, auth: true, session: "none" },

  { method: "GET", pattern: new RegExp(`^groups/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^groups/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^groups/${GUID}$`, "i"), auth: true, session: "none" },

  { method: "GET", pattern: new RegExp(`^groups/${GUID}/users$`, "i"), auth: true, session: "none" },
  { method: "POST", pattern: new RegExp(`^groups/${GUID}/users$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^groups/${GUID}/users/${GUID}$`, "i"), auth: true, session: "none" },

  // Bulk Group Users
  { method: "POST", pattern: new RegExp(`^groups/${GUID}/users/bulk$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^groups/${GUID}/users/bulk$`, "i"), auth: true, session: "none" },

  // Group Menu Access
  { method: "GET", pattern: /^groups\/available-menus$/i, auth: true, session: "none" },
  { method: "GET", pattern: new RegExp(`^groups/${GUID}/menu-access$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^groups/${GUID}/menu-access$`, "i"), auth: true, session: "none" },
];

function fail(httpStatus: number, statusCode: number, message: string) {
  return NextResponse.json({ isSuccess: false, statusCode, message }, { status: httpStatus, headers: NO_STORE });
}

function unauthorized() {
  const response = fail(401, ApiStatus.UnAuthorized, "Unauthorized");
  clearSessionCookies(response);
  return response;
}

function loggedOut() {
  const response = NextResponse.json({ isSuccess: true, statusCode: ApiStatus.Success, message: "" }, { headers: NO_STORE });
  clearSessionCookies(response);
  return response;
}

function badGateway() {
  return fail(502, ApiStatus.ServerError, "The server is unavailable");
}

function relay(result: BackendResult): NextResponse {
  if (result.status >= 300 && result.status < 400) return badGateway();

  const headers = new Headers(NO_STORE);
  const trace = result.headers.get("x-trace-id");
  if (trace) headers.set("x-trace-id", trace);

  if (result.body === "") {
    return new NextResponse(null, { status: result.status, headers });
  }

  try {
    return NextResponse.json(JSON.parse(result.body), {
      status: result.status,
      headers,
    });
  } catch {
    return badGateway();
  }
}

const rawTokenSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.coerce.number().positive().optional(),
    expiresInSeconds: z.coerce.number().positive().optional(),
    sessionId: z.union([z.string(), z.number()]).nullish(),
  })
  .transform((val) => ({
    accessToken: val.accessToken,
    refreshToken: val.refreshToken,
    expiresIn: Math.round(val.expiresIn ?? val.expiresInSeconds ?? 900),
    sessionId: val.sessionId != null ? String(val.sessionId) : undefined,
  }));

function splitSession(data: unknown): { tokens: Tokens | null; publicData: unknown } {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if ("requiresOtp" in record || "auth" in record || "tokens" in record) {
      const candidate = record.auth ?? record.tokens ?? record;
      const auth = rawTokenSchema.safeParse(candidate);
      const rest = { ...record };
      delete rest.auth;
      delete rest.tokens;
      delete rest.accessToken;
      delete rest.refreshToken;
      return { tokens: auth.success ? auth.data : null, publicData: rest };
    }

    const direct = rawTokenSchema.safeParse(record);
    if (direct.success) {
      return {
        tokens: direct.data,
        publicData: { sessionId: direct.data.sessionId ?? null },
      };
    }
  }

  return { tokens: null, publicData: data };
}

function createSession(request: NextRequest, result: BackendResult): NextResponse {
  if (result.status < 200 || result.status >= 300) return relay(result);

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.body);
  } catch {
    return badGateway();
  }
  if (typeof parsed !== "object" || parsed === null) return badGateway();

  const envelope = parsed as { isSuccess?: boolean; data?: unknown };
  const { tokens, publicData } = splitSession(envelope.data);

  // اگر لاگین نهایی بوده (نیاز به OTP نداشته) ولی توکنی استخراج نشده، خطای واضح بده
  const requiresOtp = publicData && typeof publicData === "object" && (publicData as { requiresOtp?: boolean }).requiresOtp === true;
  if (envelope.isSuccess !== false && !requiresOtp && !tokens) {
    console.error("[bff] Login response succeeded but tokens could not be parsed from data:", envelope.data);
    return fail(502, ApiStatus.ServerError, "Invalid token payload from authentication server");
  }

  const response = NextResponse.json({ ...(parsed as object), data: publicData }, { status: result.status, headers: NO_STORE });
  if (tokens) setSessionCookies(response, tokens);

  if (!request.cookies.get(COOKIE.csrf)?.value) {
    response.cookies.set(COOKIE.csrf, randomToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

function clientContext(request: NextRequest): ClientContext {
  let clientIp: string | undefined;
  if (env.TRUST_PROXY === "1") {
    const candidate = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (candidate && isIP(candidate)) clientIp = candidate;
  }

  return {
    clientIp,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

type CallInput = ClientContext & {
  method: Method;
  path: string;
  search?: string;
  body?: string;
};

async function handlePublic(request: NextRequest, rule: Rule, input: CallInput): Promise<NextResponse> {
  try {
    const access = request.cookies.get(COOKIE.access)?.value;
    const result = await callBackend({ ...input, accessToken: access });
    return rule.session === "create" ? createSession(request, result) : relay(result);
  } catch (error) {
    console.error("[bff] upstream error:", error instanceof Error ? error.message : error);
    return badGateway();
  }
}

async function handleAuthed(request: NextRequest, rule: Rule, input: CallInput): Promise<NextResponse> {
  const state: { tokens: Tokens | null } = { tokens: null };
  let access = request.cookies.get(COOKIE.access)?.value;
  const refresh = request.cookies.get(COOKIE.refresh)?.value;

  const renew = async (): Promise<boolean> => {
    if (!refresh) return false;
    const tokens = await refreshTokens(refresh, {
      clientIp: input.clientIp,
      userAgent: input.userAgent,
    });
    if (!tokens) return false;
    state.tokens = tokens;
    access = tokens.accessToken;
    return true;
  };

  const call = () => callBackend({ ...input, accessToken: access });
  const isLogout = rule.session === "clear";

  try {
    if (!access && !(await renew())) {
      return isLogout ? loggedOut() : unauthorized();
    }

    let result = await call();

    if (result.status === 401 && !state.tokens && (await renew())) {
      result = await call();
    }

    if (rule.session === "clear") return loggedOut();

    if (result.status === 401) return unauthorized();

    const response = relay(result);

    // اگر در حین درخواست Refresh Token انجام شده باشد،
    // کوکی‌های جدید را روی همان مرورگر ثبت می‌کنیم.
    if (state.tokens) {
      setSessionCookies(response, state.tokens);
    }

    return response;
  } catch (error) {
    console.error("[bff] upstream error:", error instanceof Error ? error.message : error);
    return rule.session === "clear" ? loggedOut() : badGateway();
  }
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const path = segments.join("/");
  const method = request.method as Method;

  const rule = rules.find((r) => r.method === method && r.pattern.test(path));
  if (!rule) return fail(404, ApiStatus.NotFound, "Not found");

  if (method !== "GET") {
    if (!isSameOrigin(request)) {
      return fail(403, ApiStatus.Forbidden, "Forbidden");
    }
    const cookieToken = request.cookies.get(COOKIE.csrf)?.value ?? "";
    const headerToken = request.headers.get(CSRF_HEADER) ?? "";
    if (!cookieToken || !safeEqual(cookieToken, headerToken)) {
      return fail(403, ApiStatus.Forbidden, "Forbidden");
    }
  }

  let search: string | undefined;
  if (method === "GET") {
    search = request.nextUrl.search;
    if (search.length > MAX_QUERY) return fail(414, ApiStatus.BadRequest, "URI too long");
  }

  let body: string | undefined;
  if (method === "POST" || method === "PUT" || method === "DELETE") {
    if (Number(request.headers.get("content-length") ?? "0") > MAX_BODY) {
      return fail(413, ApiStatus.BadRequest, "Payload too large");
    }
    const text = await request.text();
    if (text.length > MAX_BODY) {
      return fail(413, ApiStatus.BadRequest, "Payload too large");
    }
    if (text !== "") {
      if (!request.headers.get("content-type")?.includes("application/json")) {
        return fail(415, ApiStatus.BadRequest, "Unsupported media type");
      }
      body = text;
    }
  }

  const input: CallInput = { ...clientContext(request), method, path, search, body };
  return rule.auth ? handleAuthed(request, rule, input) : handlePublic(request, rule, input);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
