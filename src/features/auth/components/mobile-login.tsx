"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { maskMobile, normalizeMobile } from "@/lib/digits";
import { requestMobileOtp, verifyMobileOtp } from "@/lib/mock/auth";
import type { AuthConfig } from "@/types/auth";
import { authErrorKey } from "../error-message";
import {
  createMobileSchema,
  type MobileValues,
} from "../schemas/login-schema";
import { AuthField } from "./auth-field";
import { OtpStep } from "./otp-step";
import { useCaptcha } from "./use-captcha";

type MobileLoginProps = { config: AuthConfig; onDone: () => void };

type Step =
  | { name: "mobile" }
  | { name: "otp"; mobile: string; resendAfterSeconds: number };

export function MobileLogin({ config, onDone }: MobileLoginProps) {
  const [step, setStep] = useState<Step>({ name: "mobile" });

  if (step.name === "otp") {
    const { mobile } = step;

    return (
      <OtpStep
        config={config}
        maskedMobile={maskMobile(mobile)}
        resendAfterSeconds={step.resendAfterSeconds}
        onVerify={async (code, captchaToken) => {
          await verifyMobileOtp({ mobile, code, captchaToken });
          onDone();
        }}
        onResend={async (captchaToken) => {
          const result = await requestMobileOtp({ mobile, captchaToken });
          return { resendAfterSeconds: result.resendAfterSeconds };
        }}
        onBack={() => setStep({ name: "mobile" })}
      />
    );
  }

  return (
    <MobileForm
      config={config}
      onSent={(mobile, resendAfterSeconds) =>
        setStep({ name: "otp", mobile, resendAfterSeconds })
      }
    />
  );
}

type MobileFormProps = {
  config: AuthConfig;
  onSent: (mobile: string, resendAfterSeconds: number) => void;
};

function MobileForm({ config, onSent }: MobileFormProps) {
  const t = useTranslations("auth");
  const captcha = useCaptcha(config);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      createMobileSchema({
        mobileRequired: t("validation.mobileRequired"),
        mobileInvalid: t("validation.mobileInvalid"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MobileValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: "" },
  });

  async function onSubmit(values: MobileValues) {
    setFormError(null);

    if (captcha.enabled && !captcha.token) {
      setFormError(t("errors.captchaRequired"));
      return;
    }

    const mobile = normalizeMobile(values.mobile);

    try {
      const result = await requestMobileOtp({
        mobile,
        captchaToken: captcha.token ?? undefined,
      });
      onSent(mobile, result.resendAfterSeconds);
    } catch (error) {
      setFormError(t(`errors.${authErrorKey(error)}`));
    } finally {
      captcha.reset();
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
        id="mobile"
        label={t("mobile")}
        placeholder={t("mobilePlaceholder")}
        icon={<Smartphone className="size-4" />}
        inputMode="tel"
        autoComplete="tel"
        error={errors.mobile?.message}
        {...register("mobile")}
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
            {t("sendingCode")}
          </>
        ) : (
          t("sendCode")
        )}
      </Button>
    </form>
  );
}