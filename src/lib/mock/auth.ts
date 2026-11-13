import { ApiError, ApiStatus } from "@/lib/api/errors";
import { toLatinDigits } from "@/lib/digits";
import type { AuthConfig, LoginChallenge, OtpRequestResult, PasswordLoginResult } from "@/types/auth";
import { delay } from "./utils";

/** کلید تستی گوگل: ویجت نمایش داده می‌شود و همیشه تأیید می‌شود. */
const captchaOn = process.env.NEXT_PUBLIC_DEMO_CAPTCHA === "1";

const config: AuthConfig = {
  captchaEnabled: captchaOn,
  captchaProvider: null,
  mobileLoginEnabled: true,
  passwordLoginEnabled: true,
  passwordLoginRequiresOtp: process.env.NEXT_PUBLIC_DEMO_PASSWORD_OTP !== "0",
  otpLength: 6,
};

const challenge: LoginChallenge = {
  challengeId: "mock-challenge",
  maskedMobile: "0912•••4567",
  expiresInSeconds: 120,
  resendAfterSeconds: 60,
};

function assertCaptcha(token?: string) {
  if (config.captchaEnabled && !token) {
    throw new ApiError(ApiStatus.CaptchaInvalid);
  }
}

function assertCode(code: string) {
  if (toLatinDigits(code) !== "123456") {
    throw new ApiError(ApiStatus.InvalidOtp);
  }
}

export async function getAuthConfig(): Promise<AuthConfig> {
  await delay(250);
  return config;
}

export async function requestMobileOtp(input: { mobile: string; captchaToken?: string }): Promise<OtpRequestResult> {
  await delay(600);
  assertCaptcha(input.captchaToken);
  return { expiresInSeconds: 120, resendAfterSeconds: 60 };
}

export async function verifyMobileOtp(input: { mobile: string; code: string; captchaToken?: string }): Promise<void> {
  await delay(600);
  assertCaptcha(input.captchaToken);
  assertCode(input.code);
}

export async function passwordLogin(input: { userName: string; password: string; captchaToken?: string }): Promise<PasswordLoginResult> {
  await delay(700);
  assertCaptcha(input.captchaToken);
  if (input.password === "wrong") {
    throw new ApiError(ApiStatus.InvalidCredentials);
  }
  return config.passwordLoginRequiresOtp ? { requiresOtp: true, challenge } : { requiresOtp: false };
}

export async function verifyChallenge(input: { challengeId: string; code: string; captchaToken?: string }): Promise<void> {
  await delay(600);
  assertCaptcha(input.captchaToken);
  assertCode(input.code);
}

export async function resendChallenge(input: { challengeId: string; captchaToken?: string }): Promise<LoginChallenge> {
  await delay(500);
  assertCaptcha(input.captchaToken);
  return challenge;
}
