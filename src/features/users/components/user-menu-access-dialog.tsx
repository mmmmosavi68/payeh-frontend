
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

import type { UserRecord } from "@/types/user";
import {
  getUserAvailableMenus,
  getUserMenuAccess,
  updateUserMenuAccess,
  type UserAvailableMenu,
} from "../api";
import { usePermission } from "@/features/permissions/use-permission";

type Props = {
  user: UserRecord;
};

export function UserMenuAccessAction({ user }: Props) {
  const t = useTranslations("users.management");
  const tc = useTranslations("common");

  const permission = usePermission(
    "UserManagement",
    "UpdateMenuAccess",
  );
const availablePermission = usePermission(
  "UserManagement",
  "GetAvailableMenus",
);

const assignedPermission = usePermission(
  "UserManagement",
  "GetMenuAccess",
);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const [menus, setMenus] = useState<UserAvailableMenu[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedMenus = useMemo(
    () =>
      [...menus].sort(
        (a, b) => (a.pageCode ?? 0) - (b.pageCode ?? 0),
      ),
    [menus],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setFailed(false);

      try {
        const [availableMenus, assignedIds] = await Promise.all([
          getUserAvailableMenus(),
          getUserMenuAccess(user.id),
        ]);

        if (cancelled) return;

        setMenus(availableMenus);
        setSelectedIds(assignedIds);
      } catch {
        if (!cancelled) {
          setFailed(true);
          toast.error(t("access.loadFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, user.id, t]);

  function toggleMenu(menuId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, menuId])]
        : current.filter((id) => id !== menuId),
    );
  }

  async function save() {
    setSaving(true);

    try {
      await updateUserMenuAccess(user.id, selectedIds);
      toast.success(t("access.saved"));
      setOpen(false);
    } catch {
      toast.error(t("access.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

if (
  permission.loading ||
  availablePermission.loading ||
  assignedPermission.loading ||
  !permission.allowed ||
  !availablePermission.allowed ||
  !assignedPermission.allowed
) {
  return null;
}
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        title={t("access.button")}
        aria-label={t("access.button")}
        onClick={() => setOpen(true)}
      >
        <ShieldCheck className="size-4" aria-hidden />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!saving) setOpen(next);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("access.title")}</DialogTitle>
            <DialogDescription>
              {t("access.description", {
                name: `${user.firstName} ${user.lastName}`.trim() || user.userName,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
            {t("access.hint")}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : failed ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-destructive">
                {t("access.loadFailed")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tc("cancel")}
              </Button>
            </div>
          ) : (
            <div className="max-h-[48dvh] overflow-y-auto rounded-xl border p-3">
              {sortedMenus.map((menu) => {
                const child = menu.parentId != null;

                return (
                  <div
                    key={menu.id}
                    className={`flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60 ${
                      child ? "ps-8" : "font-medium"
                    }`}
                  >
                    <Checkbox
                      id={`user-menu-${menu.id}`}
                      checked={selectedIds.includes(menu.id)}
                      onCheckedChange={(checked) =>
                        toggleMenu(menu.id, checked === true)
                      }
                    />

                    <Label
                      htmlFor={`user-menu-${menu.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {menu.menuTitle}
                    </Label>

                    {menu.pageCode != null ? (
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {menu.pageCode}
                      </span>
                    ) : null}
                  </div>
                );
              })}

              {sortedMenus.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("access.noMenus")}
                </p>
              ) : null}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {t("access.selected", { count: selectedIds.length })}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>

            <Button
              type="button"
              className="rounded-full"
              disabled={loading || failed || saving}
              onClick={() => void save()}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
