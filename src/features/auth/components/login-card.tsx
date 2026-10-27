"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { CredentialsForm } from "./credentials-form";
import { OtpForm } from "./otp-form";

type Step = { name: "credentials" } | { name: "otp"; phone: string };

export function LoginCard() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "credentials" });

  return (
    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-card/70 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-foreground/5 to-transparent" />

      <div className="relative px-6 pb-6 pt-8 sm:px-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {tc("brandMark")}
          </span>
          <h1 className="text-2xl font-bold">
            {step.name === "otp" ? t("otp.title") : t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step.name === "otp"
              ? t("otp.subtitle", { phone: `\u2066${step.phone}\u2069` })
              : t("subtitle")}
          </p>
        </div>

        {step.name === "credentials" ? (
          <CredentialsForm
            onSuccess={(phone) => setStep({ name: "otp", phone })}
          />
        ) : (
          <OtpForm
            onBack={() => setStep({ name: "credentials" })}
            onSuccess={() => router.replace("/dashboard")}
          />
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("demoHint")}
        </p>
      </div>
    </div>
  );
}