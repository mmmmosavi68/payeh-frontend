import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth/cookie-names";
import { buildCsp, cspHeaderName, cspMode } from "@/lib/security/csp";
import { randomToken } from "@/lib/security/tokens";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const PROTECTED = ["/dashboard", "/users", "/sessions", "/audit-logs", "/api-test"];
const localePattern = new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`);

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = pathname.match(localePattern);
  const loggedIn = request.cookies.has(COOKIE.session);

  if (match) {
    const locale = match[1];
    const rest = match[2] || "/";

    const isProtected = PROTECTED.some((prefix) => rest === prefix || rest.startsWith(`${prefix}/`));

    if (isProtected && !loggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?returnUrl=${encodeURIComponent(rest + search)}`;
      return NextResponse.redirect(url);
    }

    if (rest === "/login" && loggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // nonce هر درخواست: Next.js آن را از هدر CSP درخواست می‌خواند و روی اسکریپت‌های خودش می‌گذارد.
  const mode = cspMode();
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  if (mode !== "off") requestHeaders.set(cspHeaderName(mode), csp);

  const response = intl(new NextRequest(request, { headers: requestHeaders }));
  if (mode !== "off") response.headers.set(cspHeaderName(mode), csp);

  // توکن CSRF (double-submit): باید توسط JS قابل خواندن باشد.
  if (!request.cookies.has(COOKIE.csrf)) {
    response.cookies.set(COOKIE.csrf, randomToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
