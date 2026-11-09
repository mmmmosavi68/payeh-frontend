import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import type { AuthConfig, CaptchaImage, LoginChallenge, OtpRequestResult, PasswordLoginResult } from "@/types/auth";

const configSchema = z.object({
  captchaEnabled: z.boolean(),
  captchaProvider: z.string().nullable().optional(),
  mobileLoginEnabled: z.boolean(),
  passwordLoginEnabled: z.boolean(),
  passwordLoginRequiresOtp: z.boolean(),
  otpLength: z.number().int().min(4).max(10),
});
const captchaSchema = z.object({ captchaId: z.string(), imageBase64: z.string(), contentType: z.string(), expiresInSeconds: z.number() });
const otpRequestSchema = z.object({ devCode: z.string().nullable().optional(), expiresInSeconds: z.number(), resendAfterSeconds: z.number() });
const challengeSchema = z.object({ challengeId: z.string(), maskedMobile: z.string(), expiresInSeconds: z.number(), resendAfterSeconds: z.number(), devCode: z.string().nullable().optional() });
const passwordLoginSchema = z.object({ requiresOtp: z.boolean(), challenge: challengeSchema.nullable().optional() });

function deviceName(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` · ${os}` : ""}`.slice(0, 100);
}

function captchaFields(value?: string) {
  if (!value) return { captchaId: undefined, captchaCode: undefined };
  const separator = value.indexOf(":");
  if (separator < 1) return { captchaId: undefined, captchaCode: undefined };
  return { captchaId: value.slice(0, separator), captchaCode: value.slice(separator + 1) };
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const data = await apiRequest("auth/config", { schema: configSchema });
  return { ...data, captchaProvider: data.captchaProvider ?? null };
}
export function getCaptcha(): Promise<CaptchaImage> {
  return apiRequest("auth/captcha", { schema: captchaSchema });
}
export async function requestMobileOtp(input: { mobile: string; captchaToken?: string }): Promise<OtpRequestResult> {
  return apiRequest("auth/otp/request", { method: "POST", body: { mobileNumber: input.mobile, ...captchaFields(input.captchaToken) }, schema: otpRequestSchema });
}
export async function verifyMobileOtp(input: { mobile: string; code: string; captchaToken?: string }): Promise<void> {
  await apiRequest("auth/otp/verify", { method: "POST", body: { mobileNumber: input.mobile, code: input.code, ...captchaFields(input.captchaToken), deviceName: deviceName() }, schema: z.unknown() });
}
export async function passwordLogin(input: { userName: string; password: string; captchaToken?: string }): Promise<PasswordLoginResult> {
  const data = await apiRequest("auth/login", {
    method: "POST",
    body: { userName: input.userName, password: input.password, ...captchaFields(input.captchaToken), deviceName: deviceName() },
    schema: passwordLoginSchema,
  });
  if (data.requiresOtp) {
    if (!data.challenge) throw new Error("The backend did not return the required login challenge.");
    return { requiresOtp: true, challenge: data.challenge };
  }
  return { requiresOtp: false };
}
export async function verifyChallenge(input: { challengeId: string; code: string; captchaToken?: string }): Promise<void> {
  await apiRequest("auth/login/verify", {
    method: "POST",
    body: { challengeId: input.challengeId, code: input.code, ...captchaFields(input.captchaToken), deviceName: deviceName() },
    schema: z.unknown(),
  });
}
export function resendChallenge(input: { challengeId: string; captchaToken?: string }): Promise<LoginChallenge> {
  return apiRequest("auth/login/resend", { method: "POST", body: { challengeId: input.challengeId, ...captchaFields(input.captchaToken) }, schema: challengeSchema });
}
export async function logout(): Promise<void> {
  await apiRequest("auth/logout", { method: "POST", schema: z.unknown() });
}
export async function logoutAll(): Promise<void> {
  await apiRequest("auth/logout-all", { method: "POST", schema: z.unknown() });
}
