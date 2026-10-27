import { useTranslations } from "next-intl";

export function SampleNotice() {
  const t = useTranslations("common");

  return (
    <p className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
      {t("sampleNotice")}
    </p>
  );
}