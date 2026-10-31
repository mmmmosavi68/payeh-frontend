export const COOKIE = {
  /** access token — httpOnly، فقط برای /api/bff */
  access: "sp_at",
  /** refresh token — httpOnly، فقط برای /api/bff */
  refresh: "sp_rt",
  /** نشانه‌ی وجود نشست (بدون توکن) — httpOnly، برای تصمیم proxy */
  session: "sp_s",
  /** توکن CSRF — عمداً قابل خواندن توسط JS */
  csrf: "sp_csrf",
} as const;

export const CSRF_HEADER = "x-csrf-token";