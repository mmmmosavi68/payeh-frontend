import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogsTable } from "@/features/audit-logs/components/audit-logs-table";

export default async function AuditLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const t = await getTranslations("auditLogs");
  return <><PageHeader title={t("title")} description={t("description")} crumbs={[{ label: t("title") }]} /><AuditLogsTable /></>;
}
