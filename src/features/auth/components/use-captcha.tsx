"use client";

import { useCallback, useRef, useState } from "react";
import type { AuthConfig } from "@/types/auth";
import { RecaptchaWidget, type RecaptchaHandle } from "./recaptcha-widget";

/**
 * مدیریت کپچای هر مرحله. توکن‌ها یک‌بارمصرف هستند: بعد از هر ارسال reset() صدا زده می‌شود
 * و هر مرحله‌ی جدید (کامپوننت جدید) ویجت تازه می‌سازد.
 */
export function useCaptcha(config: AuthConfig) {
  const handle = useRef<RecaptchaHandle>(null);
  const [token, setToken] = useState<string | null>(null);

  const reset = useCallback(() => {
    handle.current?.reset();
    setToken(null);
  }, []);

  const element = config.captchaEnabled ? (
    <RecaptchaWidget
      ref={handle}
      siteKey={config.captchaSiteKey}
      onToken={setToken}
    />
  ) : null;

  return { enabled: config.captchaEnabled, token, reset, element };
}