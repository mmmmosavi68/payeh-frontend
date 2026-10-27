import { Activity, KeyRound, ShieldAlert, Users } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { RecentSignIns } from "@/features/dashboard/components/recent-sign-ins";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { mockStats } from "@/lib/mock/dashboard";

const icons = {
  totalUsers: Users,
  activeSessions: Activity,
  roles: KeyRound,
  failedLogins: ShieldAlert,
} as const;

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const format = await getFormatter();

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        crumbs={[{ label: t("title") }]}
      />

      <p className="mb-4 rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        {t("sampleNotice")}
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mockStats.map((stat) => {
          const Icon = icons[stat.key];
          const trend =
            stat.change > 0 ? "up" : stat.change < 0 ? "down" : "flat";

          return (
            <StatCard
              key={stat.key}
              label={t(`stats.${stat.key}`)}
              value={format.number(stat.value)}
              change={format.number(stat.change / 100, {
                style: "percent",
                maximumFractionDigits: 1,
                signDisplay: "exceptZero",
              })}
              trend={trend}
              hint={t("vsLastWeek")}
              icon={<Icon className="size-4" aria-hidden />}
            />
          );
        })}
      </section>

      <div className="mt-4">
        <RecentSignIns />
      </div>
    </>
  );
}