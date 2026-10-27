"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toLatinDigits } from "@/lib/digits";
import {
  MockAuthError,
  mockResendOtp,
  mockVerifyOtp,
} from "@/lib/mock/auth";
import { createOtpSchema, type OtpValues } from "../schemas/login-schema";
import { AuthField } from "./auth-field";
import { CaptchaSlot, demoCaptchaEnabled } from "./captcha-slot";

const RESEND_SECONDS = 60;

type OtpFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export function OtpForm({ onBack, onSuccess }: OtpFormProps) {
  const t = useTranslations("auth");
  const format = useFormatter();
  const [formError, setFormError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const schema = useMemo(
    () => createOtpSchema(t("validation.otpInvalid")),
    [t],
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

  async function onSubmit(values: OtpValues) {
    setFormError(null);
    try {
      await mockVerifyOtp(values.code);
      onSuccess();
    } catch (error) {
      setFormError(
        error instanceof MockAuthError ? t("otp.invalid") : t("genericError"),
      );
    }
  }

  async function resend() {
    setResending(true);
    setFormError(null);
    try {
      await mockResendOtp();
      setSeconds(RESEND_SECONDS);
    } finally {
      setResending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
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
        maxLength={6}
        dir="ltr"
        placeholder="------"
        className="text-center text-lg tracking-[0.5em]"
        error={errors.code?.message}
        {...codeField}
        onChange={(event) => {
          event.target.value = toLatinDigits(event.target.value)
            .replace(/\D/g, "")
            .slice(0, 6);
          return onCodeChange(event);
        }}
      />

      {demoCaptchaEnabled ? <CaptchaSlot /> : null}

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