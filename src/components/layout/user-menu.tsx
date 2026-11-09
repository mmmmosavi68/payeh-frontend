"use client";

import { ChevronDown, LogOut, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe, type Me } from "@/features/auth/me";
import { useLogout } from "@/features/auth/use-logout";
import { logoutAll } from "@/features/auth/api";
import { toast } from "sonner";
import { useRemoteData } from "@/hooks/use-remote-data";

function displayName(me: Me): string {
  const full = `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim();
  return full || me.userName;
}

function initialsOf(me: Me): string {
  const first = Array.from(me.firstName?.trim() ?? "")[0];
  const last = Array.from(me.lastName?.trim() ?? "")[0];
  if (first && last) return `${first}${last}`;
  return Array.from(me.userName).slice(0, 2).join("").toUpperCase();
}

export function UserMenu({ dir }: { dir: "rtl" | "ltr" }) {
  const t = useTranslations("user");
  const tc = useTranslations("common");
  const locale = useLocale();
  const handleLogout = useLogout();
  async function handleLogoutAll() {
    try { await logoutAll(); } catch { /* BFF clears the local session on logout-all. */ }
    toast.success(locale === "fa" ? "از همه دستگاه‌ها خارج شدید." : "Signed out from all devices.");
    window.location.assign(`/${locale}/login`);
  }
  const { data: me } = useRemoteData("me", getMe);

  const roles = me
    ? new Intl.ListFormat(locale, { style: "narrow", type: "unit" }).format(
        me.roles.map((role) => (locale === "fa" ? role.nameFa : role.nameEn)),
      )
    : "";

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("menu")}
          className="flex h-9 items-center gap-2 rounded-full border bg-secondary ps-1 pe-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {me ? (
            <>
              <span className="grid size-7 place-items-center rounded-full border bg-muted text-xs font-medium">
                {initialsOf(me)}
              </span>
              <span className="hidden max-w-32 truncate font-medium sm:block">
                {displayName(me)}
              </span>
            </>
          ) : (
            <>
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="hidden h-4 w-20 sm:block" />
            </>
          )}
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {me ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate font-medium">{displayName(me)}</p>
              {roles ? (
                <p className="truncate text-xs text-muted-foreground">{roles}</p>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => void handleLogout()}>
          <LogOut className="size-4" aria-hidden />
          {tc("logout")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleLogoutAll()}>
          <ShieldAlert className="size-4" aria-hidden />
          {locale === "fa" ? "خروج از همه دستگاه‌ها" : "Sign out all devices"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}