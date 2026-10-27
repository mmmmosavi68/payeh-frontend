"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { MockAuthError, mockSignIn } from "@/lib/mock/auth";
import {
  createLoginSchema,
  type LoginValues,
} from "../schemas/login-schema";
import { AuthField } from "./auth-field";
import { CaptchaSlot, demoCaptchaEnabled } from "./captcha-slot";

export function CredentialsForm({
  onSuccess,
}: {
  onSuccess: (phone: string) => void;
}) {
  const t = useTranslations("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(
    () =>
      createLoginSchema({
        usernameRequired: t("validation.usernameRequired"),
        passwordRequired: t("validation.passwordRequired"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const result = await mockSignIn(values);
      onSuccess(result.phone);
    } catch (error) {
      setFormError(
        error instanceof MockAuthError
          ? t("invalidCredentials")
          : t("genericError"),
      );
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

      {demoCaptchaEnabled ? <CaptchaSlot /> : null}

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