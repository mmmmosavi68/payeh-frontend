"use client";

import { Activity, FileSearch, FlaskConical, LayoutDashboard, RefreshCw, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/features/permissions/permission-provider";

type SidebarNavProps = { collapsed?: boolean; onNavigate?: () => void };

const iconFor = (value: string | null) =>
  /users/i.test(value ?? "")
    ? Users
    : /history|audit/i.test(value ?? "")
      ? FileSearch
      : /session/i.test(value ?? "")
        ? Activity
        : /test|api/i.test(value ?? "")
          ? FlaskConical
          : LayoutDashboard;

const fallbackMenus = [
  { id: "fb-users", link: "/users", menuTitle: "مدیریت کاربران", enTitle: "Users", icon: "users" },
  { id: "fb-sessions", link: "/sessions", menuTitle: "نشست‌های فعال", enTitle: "Active Sessions", icon: "sessions" },
  { id: "fb-audit", link: "/audit-logs", menuTitle: "سوابق ممیزی", enTitle: "Audit Logs", icon: "audit" },
  { id: "fb-api-test", link: "/api-test", menuTitle: "آزمایش API", enTitle: "API Diagnostics", icon: "test" },
];

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { items, loading, failed, reload } = usePermissionContext();

  const visible =
    items.filter(
      (item) => item.showMenu && item.actionName && item.link && item.link.startsWith("/") && item.link !== "/",
    ) ?? [];

  if (loading) {
    return (
      <div className="space-y-3 px-4 py-3" aria-busy="true">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-9 animate-pulse rounded bg-muted" />
        <div className="h-9 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const navList =
    visible.length > 0
      ? visible.map((item) => ({
          id: item.id,
          href: item.link as string,
          label:
            locale === "fa"
              ? item.menuTitle
              : item.controllerName === "Users"
                ? "Users"
                : item.controllerName === "AuditLogs"
                  ? "Audit logs"
                  : item.menuTitle,
          icon: item.icon,
        }))
      : fallbackMenus.map((item) => ({
          id: item.id,
          href: item.link,
          label: locale === "fa" ? item.menuTitle : item.enTitle,
          icon: item.icon,
        }));

  return (
    <nav aria-label={t("label")} className="flex flex-col gap-1 px-2">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={cn(
          "flex h-10 items-center gap-3 rounded-md px-[11px] text-sm transition-colors",
          pathname === "/dashboard"
            ? "bg-selected font-medium text-selected-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
        title={collapsed ? (locale === "fa" ? "داشبورد" : "Dashboard") : undefined}
      >
        <LayoutDashboard className="size-5 shrink-0" />
        <span className={cn("truncate", collapsed && "sr-only")}>
          {locale === "fa" ? "داشبورد" : "Dashboard"}
        </span>
      </Link>

      {navList.map((item) => {
        const Icon = iconFor(item.icon);
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-[11px] text-sm transition-colors",
              active
                ? "bg-selected font-medium text-selected-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}

      {failed && !collapsed ? (
        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
          <p>{locale === "fa" ? "دریافت منوها از سرور ناموفق بود (نمایش منوی پیش‌فرض)." : "Using fallback navigation."}</p>
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1 font-medium text-primary underline"
            onClick={reload}
          >
            <RefreshCw className="size-3" />
            {t("retry")}
          </button>
        </div>
      ) : null}
    </nav>
  );
}
