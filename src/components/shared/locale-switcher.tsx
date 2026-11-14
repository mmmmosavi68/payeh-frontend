
"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  fa: "فارسی",
  en: "English",
};

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const selectedLocale =
    routing.locales.find((item) => item === locale) ??
    routing.defaultLocale;

  function handleLocaleChange(value: string) {
    if (
      isPending ||
      !routing.locales.some((item) => item === value)
    ) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, {
        locale: value as (typeof routing.locales)[number],
      });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={isPending}
        aria-label={t("switchLanguage")}
        title={t("switchLanguage")}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <Languages className="size-4" aria-hidden />
        <span>{localeLabels[selectedLocale] ?? selectedLocale}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel>
          {t("switchLanguage")}
        </DropdownMenuLabel>

        <DropdownMenuRadioGroup
          value={selectedLocale}
          onValueChange={handleLocaleChange}
        >
          {routing.locales.map((item) => (
            <DropdownMenuRadioItem
              key={item}
              value={item}
              disabled={isPending}
            >
              {localeLabels[item] ?? item}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
