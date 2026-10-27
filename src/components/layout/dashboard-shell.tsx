"use client";

import { LogOut, Menu } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { localeDirections } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

type LogoutLinkProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

function LogoutLink({ collapsed = false, onNavigate }: LogoutLinkProps) {
  const t = useTranslations("common");

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      title={collapsed ? t("logout") : undefined}
      aria-label={collapsed ? t("logout") : undefined}
      className="flex h-10 items-center gap-3 rounded-md px-[11px] text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
    >
      <LogOut className="size-5 shrink-0" aria-hidden />
      <span className={cn("truncate", collapsed && "sr-only")}>
        {t("logout")}
      </span>
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const tf = useTranslations("footer");
  const format = useFormatter();
  const locale = useLocale();
  const dir = localeDirections[locale] ?? "ltr";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const year = format.number(new Date().getFullYear(), { useGrouping: false });

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
      >
        {t("skipToContent")}
      </a>

      {/* Header */}
      <header className="fixed inset-x-3 top-3 z-40 flex h-16 items-center gap-2 rounded-2xl border bg-card/90 px-3 backdrop-blur-md sm:px-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full md:hidden"
          aria-label={t("openMenu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden rounded-full md:inline-flex"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          aria-expanded={!collapsed}
          aria-controls="desktop-sidebar"
          onClick={() => setCollapsed((value) => !value)}
        >
          <Menu className="size-4" aria-hidden />
        </Button>

        <Brand />

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu dir={dir} />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside
        id="desktop-sidebar"
        className={cn(
          "fixed bottom-3 start-3 top-[88px] z-30 hidden flex-col overflow-hidden rounded-2xl border bg-card transition-[width] duration-300 md:flex",
          collapsed ? "w-[60px]" : "w-60",
        )}
      >
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav collapsed={collapsed} />
        </div>
        <div className="border-t p-2">
          <LogoutLink collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id="mobile-sidebar"
          side={dir === "rtl" ? "right" : "left"}
          className="w-72! max-w-[85vw]! gap-0 p-0 sm:max-w-[85vw]!"
        >
          <SheetTitle className="sr-only">{t("menuTitle")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("menuDescription")}
          </SheetDescription>

          <div className="flex h-16 items-center border-b px-4 ltr:pe-14 rtl:ps-14">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="border-t p-2">
            <LogoutLink onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Content */}
      <main
        id="main-content"
        className={cn(
          "flex min-h-dvh flex-col px-3 pb-3 pt-[88px] transition-[padding] duration-300",
          collapsed ? "md:ps-[84px]" : "md:ps-[264px]",
        )}
      >
        <div className="flex-1">{children}</div>
        <footer className="mt-4 rounded-2xl border bg-card px-6 py-3 text-xs text-muted-foreground">
          {tf("rights", { year, name: t("appName") })}
        </footer>
      </main>
    </div>
  );
}