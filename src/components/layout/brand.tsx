import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Brand() {
  const t = useTranslations("common");

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 font-bold"
      aria-label={t("appName")}
    >
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
        {t("brandMark")}
      </span>
      <span className="truncate">{t("appName")}</span>
    </Link>
  );
}