import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import type {
  AuthConfig,
  LoginChallenge,
  OtpRequestResult,
  PasswordLoginResult,
} from "@/types/auth";

const configSchema = z.object({
  captchaEnabled: z.boolean(),
  captchaSiteKey: z.string().nullish(),
  mobileLoginEnabled: z.boolean(),
  passwordLoginEnabled: z.boolean(),
  passwordLoginRequiresOtp: z.boolean(),
  otpLength: z.number().int().min(4).max(10),
});

const otpRequestSchema = z.object({
  expiresInSeconds: z.number(),
  resendAfterSeconds: z.number(),
});

const challengeSchema = z.object({
  challengeId: z.string().min(1),
  maskedMobile: z.string(),
  expiresInSeconds: z.number(),
  resendAfterSeconds: z.number(),
});

const passwordLoginSchema = z.object({
  requiresOtp: z.boolean(),
  challenge: challengeSchema.nullish(),
});

/** نام دستگاه برای فهرست نشست‌ها، مثل «Chrome · Windows». */
function deviceName(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";

  return `${browser}${os ? ` · ${os}` : ""}`.slice(0, 100);
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const data = await apiRequest("auth/config", { schema: configSchema });
  return { ...data, captchaSiteKey: data.captchaSiteKey ?? null };
}

export async function requestMobileOtp(input: {
  mobile: string;
  captchaToken?: string;
}): Promise<OtpRequestResult> {
  return apiRequest("auth/otp/request", {
    method: "POST",
    body: { mobileNumber: input.mobile, captchaToken: input.captchaToken },
    schema: otpRequestSchema,
  });
}

export async function verifyMobileOtp(input: {
  mobile: string;
  code: string;
  captchaToken?: string;
}): Promise<void> {
  await apiRequest("auth/otp/verify", {
    method: "POST",
    body: {
      mobileNumber: input.mobile,
      code: input.code,
      captchaToken: input.captchaToken,
      deviceName: deviceName(),
    },
    schema: z.unknown(),
  });
}

export async function passwordLogin(input: {
  userName: string;
  password: string;
  captchaToken?: string;
}): Promise<PasswordLoginResult> {
  const data = await apiRequest("auth/login", {
    method: "POST",
    body: {
      userName: input.userName,
      password: input.password,
      captchaToken: input.captchaToken,
      deviceName: deviceName(),
    },
    schema: passwordLoginSchema,
  });

  if (data.requiresOtp && data.challenge) {
    return { requiresOtp: true, challenge: data.challenge };
  }
  return { requiresOtp: false };
}

export async function verifyChallenge(input: {
  challengeId: string;
  code: string;
  captchaToken?: string;
}): Promise<void> {
  await apiRequest("auth/login/verify", {
    method: "POST",
    body: {
      challengeId: input.challengeId,
      code: input.code,
      captchaToken: input.captchaToken,
      deviceName: deviceName(),
    },
    schema: z.unknown(),
  });
}

export async function resendChallenge(input: {
  challengeId: string;
  captchaToken?: string;
}): Promise<LoginChallenge> {
  return apiRequest("auth/login/resend", {
    method: "POST",
    body: {
      challengeId: input.challengeId,
      captchaToken: input.captchaToken,
    },
    schema: challengeSchema,
  });
}

export async function logout(): Promise<void> {
  await apiRequest("auth/logout", { method: "POST", schema: z.unknown() });
}