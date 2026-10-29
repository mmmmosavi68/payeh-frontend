import { ApiError, ApiStatus } from "@/lib/api/errors";

export type AuthErrorKey = "captchaInvalid" | "invalidCredentials" | "invalidOtp" | "tooManyRequests" | "forbidden" | "generic";

/** کد وضعیت API را به کلید پیام ترجمه‌شده تبدیل می‌کند. */
export function authErrorKey(error: unknown): AuthErrorKey {
  if (!(error instanceof ApiError)) return "generic";

  switch (error.status) {
    case ApiStatus.CaptchaInvalid:
      return "captchaInvalid";
    case ApiStatus.InvalidCredentials:
      return "invalidCredentials";
    case ApiStatus.InvalidOtp:
      return "invalidOtp";
    case ApiStatus.TooManyRequests:
      return "tooManyRequests";
    case ApiStatus.Forbidden:
      return "forbidden";
    default:
      return "generic";
  }
}
