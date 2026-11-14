import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { GroupsTable } from "@/features/groups/components/groups-table";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations("groups");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        crumbs={[{ label: t("title") }]}
      />

      <GroupsTable />
    </>
  );
}