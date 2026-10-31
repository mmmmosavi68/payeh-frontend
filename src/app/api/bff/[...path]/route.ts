import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  callBackend,
  type BackendResult,
  type ClientContext,
} from "@/lib/api/backend";
import { ApiStatus } from "@/lib/api/errors";
import { refreshTokens, type Tokens } from "@/lib/auth/backend-session";
import { COOKIE, CSRF_HEADER } from "@/lib/auth/cookie-names";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env.server";
import { isSameOrigin } from "@/lib/security/origin";
import { safeEqual } from "@/lib/security/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 64 * 1024;
const MAX_QUERY = 1024;
const NO_STORE = { "Cache-Control": "no-store" };

type Method = "GET" | "POST" | "PUT" | "DELETE";
/** create: از پاسخ توکن می‌گیرد و کوکی می‌گذارد. clear: کوکی‌ها را پاک می‌کند. */
type SessionEffect = "none" | "create" | "clear";
type Rule = {
  method: Method;
  pattern: RegExp;
  auth: boolean;
  session: SessionEffect;
};

const GUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * فهرست مجاز: هر چیزی که اینجا نباشد 404 می‌شود (مثلاً Auth/refresh از بیرون در دسترس نیست).
 */
const rules: Rule[] = [
  { method: "GET", pattern: /^auth\/config$/i, auth: false, session: "none" },
  { method: "POST", pattern: /^auth\/otp\/request$/i, auth: false, session: "none" },
  { method: "POST", pattern: /^auth\/otp\/verify$/i, auth: false, session: "create" },
  { method: "POST", pattern: /^auth\/login$/i, auth: false, session: "create" },
  { method: "POST", pattern: /^auth\/login\/verify$/i, auth: false, session: "create" },
  { method: "POST", pattern: /^auth\/login\/resend$/i, auth: false, session: "none" },
  { method: "POST", pattern: /^auth\/logout$/i, auth: true, session: "clear" },
  { method: "POST", pattern: /^auth\/logout-all$/i, auth: true, session: "clear" },
  { method: "GET", pattern: /^auth\/me$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^auth\/sessions$/i, auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^auth/sessions/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "GET", pattern: /^roles$/i, auth: true, session: "none" },
  { method: "GET", pattern: /^users$/i, auth: true, session: "none" },
  { method: "POST", pattern: /^users$/i, auth: true, session: "none" },
  { method: "GET", pattern: new RegExp(`^users/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "PUT", pattern: new RegExp(`^users/${GUID}$`, "i"), auth: true, session: "none" },
  { method: "DELETE", pattern: new RegExp(`^users/${GUID}$`, "i"), auth: true, session: "none" },
];

// ───────────── پاسخ‌ها ─────────────

function fail(httpStatus: number, statusCode: number, message: string) {
  return NextResponse.json(
    { isSuccess: false, statusCode, message },
    { status: httpStatus, headers: NO_STORE },
  );
}

function unauthorized() {
  const response = fail(401, ApiStatus.UnAuthorized, "Unauthorized");
  clearSessionCookies(response);
  return response;
}

function loggedOut() {
  const response = NextResponse.json(
    { isSuccess: true, statusCode: ApiStatus.Success, message: "" },
    { headers: NO_STORE },
  );
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

// ───────────── جدا کردن توکن‌ها از پاسخ ─────────────

const tokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  sessionId: z.string().optional(),
});

/** توکن‌ها فقط به کوکی می‌روند؛ بدنه‌ی پاسخ به مرورگر هیچ توکنی ندارد. */
function splitSession(data: unknown): { tokens: Tokens | null; publicData: unknown } {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    // پاسخ ورود با رمز: { requiresOtp, challenge, auth }
    if ("requiresOtp" in record || "auth" in record) {
      const auth = tokenSchema.safeParse(record.auth);
      const rest = { ...record };
      delete rest.auth;
      return { tokens: auth.success ? auth.data : null, publicData: rest };
    }

    // پاسخ تأیید کد: خود AuthResponseDto
    const direct = tokenSchema.safeParse(record);
    if (direct.success) {
      return {
        tokens: direct.data,
        publicData: { sessionId: direct.data.sessionId ?? null },
      };
    }
  }

  return { tokens: null, publicData: data };
}

function createSession(result: BackendResult): NextResponse {
  if (result.status < 200 || result.status >= 300) return relay(result);

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.body);
  } catch {
    return badGateway();
  }
  if (typeof parsed !== "object" || parsed === null) return badGateway();

  const { tokens, publicData } = splitSession((parsed as { data?: unknown }).data);

  const response = NextResponse.json(
    { ...(parsed as object), data: publicData },
    { status: result.status, headers: NO_STORE },
  );
  if (tokens) setSessionCookies(response, tokens);

  return response;
}

// ───────────── کمکی‌ها ─────────────

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

// ───────────── مسیرهای عمومی ─────────────

async function handlePublic(rule: Rule, input: CallInput): Promise<NextResponse> {
  try {
    const result = await callBackend(input);
    return rule.session === "create" ? createSession(result) : relay(result);
  } catch (error) {
    console.error("[bff] upstream error:", error instanceof Error ? error.message : error);
    return badGateway();
  }
}

// ───────────── مسیرهای نیازمند ورود ─────────────

async function handleAuthed(
  request: NextRequest,
  rule: Rule,
  input: CallInput,
): Promise<NextResponse> {
  const state: { tokens: Tokens | null } = { tokens: null };
  let access = request.cookies.get(COOKIE.access)?.value;
  const refresh = request.cookies.get(COOKIE.refresh)?.value;

  const renew = async (): Promise<boolean> => {
    if (!refresh) return false;
    const tokens = await refreshTokens(refresh, input);
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

    // access token منقضی/نامعتبر بود: یک‌بار refresh و تکرار.
    if (result.status === 401 && !state.tokens && (await renew())) {
      result = await call();
    }

    if (isLogout) return loggedOut();
    if (result.status === 401) return unauthorized();

    const response = relay(result);
    if (state.tokens) setSessionCookies(response, state.tokens);
    return response;
  } catch (error) {
    console.error("[bff] upstream error:", error instanceof Error ? error.message : error);
    return isLogout ? loggedOut() : badGateway();
  }
}

// ───────────── ورودی اصلی ─────────────

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const path = segments.join("/");
  const method = request.method as Method;

  const rule = rules.find((r) => r.method === method && r.pattern.test(path));
  if (!rule) return fail(404, ApiStatus.NotFound, "Not found");

  // CSRF: Origin درست + توکن double-submit برای هر درخواست تغییردهنده
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
  if (method === "POST" || method === "PUT") {
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

  return rule.auth
    ? handleAuthed(request, rule, input)
    : handlePublic(rule, input);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;