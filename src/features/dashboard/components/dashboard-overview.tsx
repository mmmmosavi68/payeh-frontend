"use client";

import { Activity, KeyRound, MonitorSmartphone } from "lucide-react";
import { useLocale } from "next-intl";
import { useRemoteData } from "@/hooks/use-remote-data";
import { listRoles } from "@/features/users/api";
import { listSessions } from "@/features/sessions/api";
import { Link } from "@/i18n/navigation";

export function DashboardOverview() {
  const locale = useLocale(); const fa = locale === "fa";
  const sessions = useRemoteData("dashboard-sessions", listSessions);
  const roles = useRemoteData("dashboard-roles", listRoles);
  const cards = [
    { title: fa ? "نشست‌های فعال قابل مشاهده" : "Visible active sessions", value: sessions.data?.length, icon: MonitorSmartphone },
    { title: fa ? "نقش‌های فعال" : "Active roles", value: roles.data?.length, icon: KeyRound },
    { title: fa ? "نشست این دستگاه" : "Current device session", value: sessions.data?.filter(s => s.current).length, icon: Activity },
  ];
  return <div className="space-y-4"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card=>{const Icon=card.icon; return <article key={card.title} className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{card.title}</p><span className="grid size-9 place-items-center rounded-xl bg-secondary"><Icon className="size-4"/></span></div><p className="mt-4 text-3xl font-semibold tabular-nums">{card.value ?? "—"}</p><p className="mt-2 text-xs text-muted-foreground">{sessions.failed || roles.failed ? (fa ? "بخشی از اطلاعات در دسترس نیست." : "Some data is unavailable.") : (fa ? "داده زنده از API" : "Live API data")}</p></article>})}</section><div className="flex flex-wrap gap-3"><Link href="/api-test" className="rounded-xl border bg-card px-4 py-2 text-sm hover:bg-accent">{fa ? "آزمایش API سلامت سرویس" : "API health diagnostics"}</Link></div><div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">{fa ? "آمار کلی کاربران و ورودهای ناموفق در API فعلی وجود ندارد؛ برای جلوگیری از نمایش اطلاعات ساختگی، این شاخص‌ها نمایش داده نمی‌شوند." : "The current API does not expose total-user or failed-login aggregates, so these fabricated metrics are intentionally omitted."}</div></div>;
}
