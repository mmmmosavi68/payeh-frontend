"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { useLogout } from "@/features/auth/use-logout";


export function UserMenu({ dir }: { dir: "rtl" | "ltr" }) {
  const t = useTranslations("user");
  const tc = useTranslations("common");
  const  handleLogout = useLogout();
  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("menu")}
          className="flex h-9 items-center gap-2 rounded-full border bg-secondary ps-1 pe-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-7 place-items-center rounded-full border bg-muted text-xs font-medium">
            {t("initials")}
          </span>
          <span className="hidden font-medium sm:block">{t("demoName")}</span>
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium">{t("demoName")}</p>
          <p className="text-xs text-muted-foreground">{t("demoRole")}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          {/* <Link href="/login">
            <LogOut className="size-4" aria-hidden />
            {tc("logout")}
          </Link> */}

             <DropdownMenuItem onSelect={() => void handleLogout()}>
          <LogOut className="size-4" aria-hidden />
          {tc("logout")}
        </DropdownMenuItem>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}