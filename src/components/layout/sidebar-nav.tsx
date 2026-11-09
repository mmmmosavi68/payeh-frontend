"use client";

import { FileSearch, LayoutDashboard, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/features/permissions/permission-provider";

type SidebarNavProps = { collapsed?: boolean; onNavigate?: () => void };
const iconFor = (value: string | null) => /users/i.test(value ?? "") ? Users : /history|audit/i.test(value ?? "") ? FileSearch : LayoutDashboard;

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { items, loading, failed, reload } = usePermissionContext();
  const visible = items.filter((item) => item.showMenu && item.actionName && item.link && item.link.startsWith("/") && item.link !== "/") ?? [];

  if (loading) return <div className="space-y-3 px-4 py-3" aria-busy="true"><div className="h-4 w-24 animate-pulse rounded bg-muted"/><div className="h-9 animate-pulse rounded bg-muted"/><div className="h-9 animate-pulse rounded bg-muted"/></div>;
  if (failed) return <div className="px-3 py-4 text-sm text-muted-foreground"><p>{locale === "fa" ? "دریافت منوها ناموفق بود." : "Could not load navigation."}</p><button className="mt-2 underline" onClick={reload}>{t("retry")}</button></div>;
  if (!visible.length) return <p className="px-4 py-4 text-sm text-muted-foreground">{locale === "fa" ? "برای این حساب منوی فعالی تعریف نشده است." : "No navigation permissions are assigned."}</p>;

  return <nav aria-label={t("label")} className="flex flex-col gap-1 px-2"><Link href="/dashboard" onClick={onNavigate} className={cn("flex h-10 items-center gap-3 rounded-md px-[11px] text-sm transition-colors", pathname === "/dashboard" ? "bg-selected font-medium text-selected-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")} title={collapsed ? (locale === "fa" ? "داشبورد" : "Dashboard") : undefined}><LayoutDashboard className="size-5 shrink-0"/><span className={cn("truncate", collapsed && "sr-only")}>{locale === "fa" ? "داشبورد" : "Dashboard"}</span></Link>{visible.map((item) => {
    const href = item.link as string;
    const Icon = iconFor(item.icon);
    const active = pathname === href || pathname.startsWith(`${href}/`);
    const label = locale === "fa" ? item.menuTitle : (item.controllerName === "Users" ? "Users" : item.controllerName === "AuditLogs" ? "Audit logs" : item.menuTitle);
    return <Link key={item.id} href={href} onClick={onNavigate} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-md px-[11px] text-sm transition-colors", active ? "bg-selected font-medium text-selected-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="size-5 shrink-0" aria-hidden/><span className={cn("truncate", collapsed && "sr-only")}>{label}</span></Link>;
  })}</nav>;
}
