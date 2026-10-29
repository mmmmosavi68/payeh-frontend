"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  passwordLogin,
  resendChallenge,
  verifyChallenge,
} from "@/lib/mock/auth";
import type { AuthConfig, LoginChallenge } from "@/types/auth";
import { authErrorKey } from "../error-message";
import {
  createPasswordLoginSchema,
  type PasswordLoginValues,
} from "../schemas/login-schema";
import { AuthField } from "./auth-field";
import { OtpStep } from "./otp-step";
import { useCaptcha } from "./use-captcha";

type PasswordLoginProps = { config: AuthConfig; onDone: () => void };

type Step =
  | { name: "credentials" }
  | { name: "otp"; challenge: LoginChallenge };

export function PasswordLogin({ config, onDone }: PasswordLoginProps) {
  const [step, setStep] = useState<Step>({ name: "credentials" });

  if (step.name === "otp") {
    const { challenge } = step;

    return (
      <OtpStep
        config={config}
        maskedMobile={challenge.maskedMobile}
        resendAfterSeconds={challenge.resendAfterSeconds}
        onVerify={async (code, captchaToken) => {
          await verifyChallenge({
            challengeId: challenge.challengeId,
            code,
            captchaToken,
          });
          onDone();
        }}
        onResend={async (captchaToken) => {
          const next = await resendChallenge({
            challengeId: challenge.challengeId,
            captchaToken,
          });
          setStep({ name: "otp", challenge: next });
          return { resendAfterSeconds: next.resendAfterSeconds };
        }}
        onBack={() => setStep({ name: "credentials" })}
      />
    );
  }

  return (
    <CredentialsForm
      config={config}
      onDone={onDone}
      onChallenge={(challenge) => setStep({ name: "otp", challenge })}
    />
  );
}

type CredentialsFormProps = {
  config: AuthConfig;
  onDone: () => void;
  onChallenge: (challenge: LoginChallenge) => void;
};

function CredentialsForm({ config, onDone, onChallenge }: CredentialsFormProps) {
  const t = useTranslations("auth");
  const captcha = useCaptcha(config);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(
    () =>
      createPasswordLoginSchema({
        usernameRequired: t("validation.usernameRequired"),
        passwordRequired: t("validation.passwordRequired"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordLoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: PasswordLoginValues) {
    setFormError(null);

    if (captcha.enabled && !captcha.token) {
      setFormError(t("errors.captchaRequired"));
      return;
    }

    try {
      const result = await passwordLogin({
        userName: values.username,
        password: values.password,
        captchaToken: captcha.token ?? undefined,
      });

      if (result.requiresOtp) onChallenge(result.challenge);
      else onDone();
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
        id="username"
        label={t("username")}
        placeholder={t("usernamePlaceholder")}
        icon={<User className="size-4" />}
        autoComplete="username"
        error={errors.username?.message}
        {...register("username")}
      />

      <AuthField
        id="password"
        label={t("password")}
        placeholder={t("passwordPlaceholder")}
        type={showPassword ? "text" : "password"}
        icon={<Lock className="size-4" />}
        autoComplete="current-password"
        error={errors.password?.message}
        trailing={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </Button>
        }
        {...register("password")}
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
            {t("signingIn")}
          </>
        ) : (
          t("signIn")
        )}
      </Button>
    </form>
  );
}