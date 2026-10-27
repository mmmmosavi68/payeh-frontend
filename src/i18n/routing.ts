import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa", "en"],
  defaultLocale: "fa",
});

export const localeDirections: Record<string, "rtl" | "ltr"> = {
  fa: "rtl",
  en: "ltr",
};