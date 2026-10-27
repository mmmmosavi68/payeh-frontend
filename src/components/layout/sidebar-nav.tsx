"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { navSections } from "./nav-config";

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex flex-col gap-1 px-2">
      {navSections.map((section, index) => (
        <div key={section.key} className="flex flex-col gap-1">
          {collapsed ? (
            index > 0 ? (
              <div role="separator" className="mx-3 my-2 h-px bg-border" />
            ) : null
          ) : (
            <p className="px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground">
              {t(`sections.${section.key}`)}
            </p>
          )}

          {section.items.map((item) => {
            const Icon = item.icon;
            const label = t(`items.${item.key}`);
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-[11px] text-sm transition-colors",
                  active
                    ? "bg-selected font-medium text-selected-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className={cn("truncate", collapsed && "sr-only")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}