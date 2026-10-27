"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale =
    routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      disabled={isPending}
      aria-label={t("switchLanguage")}
      onClick={() =>
        startTransition(() => router.replace(pathname, { locale: nextLocale }))
      }
    >
      <Languages className="size-4" />
      {t("otherLanguage")}
    </Button>
  );
}