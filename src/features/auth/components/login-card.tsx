"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRemoteData } from "@/hooks/use-remote-data";
import { useRouter } from "@/i18n/navigation";
import { localeDirections } from "@/i18n/routing";
import { getAuthConfig } from "@/lib/mock/auth";
import { MobileLogin } from "./mobile-login";
import { PasswordLogin } from "./password-login";

type Method = "mobile" | "password";

export function LoginCard() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dir = localeDirections[locale] ?? "ltr";
  const router = useRouter();

  const { data: config, failed, reload } = useRemoteData(
    "auth-config",
    getAuthConfig,
  );
  const [tab, setTab] = useState<Method>("mobile");

  const methods: Method[] = [];
  if (config?.mobileLoginEnabled) methods.push("mobile");
  if (config?.passwordLoginEnabled) methods.push("password");
  const active = methods.includes(tab) ? tab : methods[0];

  const done = () => router.replace("/dashboard");

  let body: React.ReactNode;

  if (failed) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-destructive">{t("loadFailed")}</p>
        <Button variant="outline" className="rounded-full" onClick={reload}>
          {tc("retry")}
        </Button>
      </div>
    );
  } else if (!config) {
    body = (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    );
  } else if (methods.length === 0) {
    body = (
      <p role="alert" className="text-center text-sm text-muted-foreground">
        {t("noMethods")}
      </p>
    );
  } else if (methods.length === 1) {
    body =
      active === "mobile" ? (
        <MobileLogin config={config} onDone={done} />
      ) : (
        <PasswordLogin config={config} onDone={done} />
      );
  } else {
    body = (
      <Tabs
        value={active}
        onValueChange={(value) => setTab(value as Method)}
        dir={dir}
      >
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="mobile" className="py-2">
            {t("tabs.mobile")}
          </TabsTrigger>
          <TabsTrigger value="password" className="py-2">
            {t("tabs.password")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mobile" className="mt-5">
          <MobileLogin config={config} onDone={done} />
        </TabsContent>
        <TabsContent value="password" className="mt-5">
          <PasswordLogin config={config} onDone={done} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-card/70 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-foreground/5 to-transparent" />

      <div className="relative px-6 pb-6 pt-8 sm:px-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {tc("brandMark")}
          </span>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {body}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("demoHint")}
        </p>
      </div>
    </div>
  );
}