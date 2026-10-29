"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toLatinDigits } from "@/lib/digits";
import type { AuthConfig } from "@/types/auth";
import { authErrorKey } from "../error-message";
import { createOtpSchema, type OtpValues } from "../schemas/login-schema";
import { AuthField } from "./auth-field";
import { useCaptcha } from "./use-captcha";

type OtpStepProps = {
  config: AuthConfig;
  maskedMobile: string;
  resendAfterSeconds: number;
  onVerify: (code: string, captchaToken?: string) => Promise<void>;
  onResend: (captchaToken?: string) => Promise<{ resendAfterSeconds: number }>;
  onBack: () => void;
};

export function OtpStep({
  config,
  maskedMobile,
  resendAfterSeconds,
  onVerify,
  onResend,
  onBack,
}: OtpStepProps) {
  const t = useTranslations("auth");
  const format = useFormatter();
  const captcha = useCaptcha(config);

  const [formError, setFormError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(resendAfterSeconds);
  const [resending, setResending] = useState(false);

  const schema = useMemo(
    () =>
      createOtpSchema(
        config.otpLength,
        t("validation.otpInvalid", { length: format.number(config.otpLength) }),
      ),
    [config.otpLength, t, format],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const { onChange: onCodeChange, ...codeField } = register("code");

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  function captchaMissing() {
    if (captcha.enabled && !captcha.token) {
      setFormError(t("errors.captchaRequired"));
      return true;
    }
    return false;
  }

  async function onSubmit(values: OtpValues) {
    setFormError(null);
    if (captchaMissing()) return;

    try {
      await onVerify(values.code, captcha.token ?? undefined);
    } catch (error) {
      setFormError(t(`errors.${authErrorKey(error)}`));
    } finally {
      captcha.reset();
    }
  }

  async function resend() {
    setFormError(null);
    if (captchaMissing()) return;

    setResending(true);
    try {
      const result = await onResend(captcha.token ?? undefined);
      setSeconds(result.resendAfterSeconds);
    } catch (error) {
      setFormError(t(`errors.${authErrorKey(error)}`));
    } finally {
      setResending(false);
      captcha.reset();
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t("otp.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("otp.sentTo", { phone: `\u2066${maskedMobile}\u2069` })}
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <AuthField
        id="otp-code"
        label={t("otp.code")}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={config.otpLength}
        dir="ltr"
        placeholder={"-".repeat(config.otpLength)}
        className="text-center text-lg tracking-[0.5em]"
        error={errors.code?.message}
        {...codeField}
        onChange={(event) => {
          event.target.value = toLatinDigits(event.target.value)
            .replace(/\D/g, "")
            .slice(0, config.otpLength);
          return onCodeChange(event);
        }}
      />

      {captcha.element}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full rounded-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("otp.verifying")}
          </>
        ) : (
          t("otp.verify")
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={onBack}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("otp.back")}
        </Button>

        {seconds > 0 ? (
          <span className="text-muted-foreground" aria-live="polite">
            {t("otp.resendIn", { seconds: format.number(seconds) })}
          </span>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={resending}
            onClick={resend}
          >
            {t("otp.resend")}
          </Button>
        )}
      </div>
    </form>
  );
}