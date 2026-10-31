import "server-only";
import type { NextResponse } from "next/server";
import { env } from "@/lib/env.server";
import type { Tokens } from "./backend-session";
import { COOKIE } from "./cookie-names";

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const refreshSeconds = env.REFRESH_COOKIE_DAYS * 24 * 60 * 60;

export function setSessionCookies(response: NextResponse, tokens: Tokens) {
  response.cookies.set(COOKIE.access, tokens.accessToken, {
    ...base,
    path: "/api/bff",
    maxAge: Math.max(60, tokens.expiresIn - 30),
  });
  response.cookies.set(COOKIE.refresh, tokens.refreshToken, {
    ...base,
    path: "/api/bff",
    maxAge: refreshSeconds,
  });
  response.cookies.set(COOKIE.session, "1", {
    ...base,
    path: "/",
    maxAge: refreshSeconds,
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(COOKIE.access, "", { ...base, path: "/api/bff", maxAge: 0 });
  response.cookies.set(COOKIE.refresh, "", { ...base, path: "/api/bff", maxAge: 0 });
  response.cookies.set(COOKIE.session, "", { ...base, path: "/", maxAge: 0 });
}