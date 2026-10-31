import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/auth/cookie-names";
import { randomToken } from "@/lib/security/tokens";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const PROTECTED = ["/dashboard", "/users", "/sessions"];
const localePattern = new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`);

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = pathname.match(localePattern);
  const loggedIn = request.cookies.has(COOKIE.session);

  if (match) {
    const locale = match[1];
    const rest = match[2] || "/";

    const isProtected = PROTECTED.some(
      (prefix) => rest === prefix || rest.startsWith(`${prefix}/`),
    );

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

  const response = intl(request);

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