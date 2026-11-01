"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "@/lib/theme"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type Grecaptcha = {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      theme?: "light" | "dark";
      size?: "normal" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    __onRecaptchaLoad?: () => void;
  }
}

let loader: Promise<void> | null = null;

/** از recaptcha.net لود می‌کند (در مناطقی که google.com فیلتر است پایدارتر است). */
function loadRecaptcha(language: string): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    window.__onRecaptchaLoad = () => resolve();
    const script = document.createElement("script");
    script.src = `https://www.recaptcha.net/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit&hl=${language}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loader = null;
      script.remove();
      reject(new Error("recaptcha failed to load"));
    };
    document.head.appendChild(script);
  });

  return loader;
}

export type RecaptchaHandle = { reset: () => void };

type RecaptchaWidgetProps = {
  siteKey: string | null;
  onToken: (token: string | null) => void;
};

export const RecaptchaWidget = forwardRef<RecaptchaHandle, RecaptchaWidgetProps>(
  function RecaptchaWidget({ siteKey, onToken }, ref) {
    const t = useTranslations("auth.captcha");
    const locale = useLocale();
    const { resolvedTheme } = useTheme();
    const hostRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<number | null>(null);
    const [failed, setFailed] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          if (widgetId.current !== null) {
            window.grecaptcha?.reset(widgetId.current);
          }
          onToken(null);
        },
      }),
      [onToken],
    );

    useEffect(() => {
      const host = hostRef.current;
      if (!host || !siteKey || !resolvedTheme) return;

      let cancelled = false;
      const slot = document.createElement("div");
      host.appendChild(slot);

      loadRecaptcha(locale)
        .then(() => {
          if (cancelled || !window.grecaptcha) return;
          widgetId.current = window.grecaptcha.render(slot, {
            sitekey: siteKey,
            theme: resolvedTheme === "dark" ? "dark" : "light",
            size: window.innerWidth < 400 ? "compact" : "normal",
            callback: (token) => onToken(token),
            "expired-callback": () => onToken(null),
            "error-callback": () => onToken(null),
          });
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });

      return () => {
        cancelled = true;
        widgetId.current = null;
        slot.remove();
        onToken(null);
      };
    }, [siteKey, locale, resolvedTheme, onToken]);

    return (
      <div
        role="group"
        aria-label={t("label")}
        className="flex flex-col items-center gap-2"
      >
        <div ref={hostRef} dir="ltr" className="min-h-[78px]" />
        {!siteKey ? (
          <p role="alert" className="text-xs text-destructive">
            {t("notConfigured")}
          </p>
        ) : null}
        {failed ? (
          <p role="alert" className="text-xs text-destructive">
            {t("loadFailed")}
          </p>
        ) : null}
      </div>
    );
  },
);