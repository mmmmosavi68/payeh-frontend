import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <>
      <PageHeader
        title={t("items.sessions")}
        crumbs={[{ label: t("items.sessions") }]}
      />
      <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
        {t("placeholder")}
      </div>
    </>
  );
}