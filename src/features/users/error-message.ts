import { ApiError, ApiStatus } from "@/lib/api/errors";

/** پیام قابل‌نمایش برای خطاهای مدیریت کاربران؛ `t` همان useTranslations() بدون namespace است. */
export function userErrorText(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case ApiStatus.Conflict:
        return t("users.form.conflict");
      case ApiStatus.Forbidden:
        return t("users.forbidden.description");
      case ApiStatus.TooManyRequests:
        return t("auth.errors.tooManyRequests");
      case ApiStatus.BadRequest:
      case ApiStatus.UnprocessableEntity:
      case ApiStatus.LogicError:
        // پیام اعتبارسنجی سرور (فارسی) بهتر از پیام عمومی است.
        if (error.message.trim()) return error.message;
    }
  }

  return t("common.operationFailed");
}
