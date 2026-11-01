export type CspMode = "enforce" | "report-only" | "off";

/**
 * CSP_MODE=enforce | report-only | off
 * پیش‌فرض: روی build تولید «enforce»، و در توسعه «report-only» (فقط گزارش در کنسول).
 */
export function cspMode(): CspMode {
  const value = process.env.CSP_MODE;
  if (value === "enforce" || value === "report-only" || value === "off") {
    return value;
  }
  return process.env.NODE_ENV === "production" ? "enforce" : "report-only";
}

export function cspHeaderName(mode: Exclude<CspMode, "off">): string {
  return mode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
}

export function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic': اسکریپت‌هایی که اسکریپتِ دارای nonce بارگذاری می‌کند (مثل کپچا) مجازند.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // استایل inline برای Radix/Tailwind و کپچا لازم است؛ ریسک آن بسیار کمتر از اسکریپت inline است.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://www.gstatic.com", "https://www.recaptcha.net"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://www.recaptcha.net", "https://www.google.com", ...(isDev ? ["ws:", "wss:"] : [])],
    "frame-src": ["https://www.recaptcha.net", "https://www.google.com", "https://recaptcha.google.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}
