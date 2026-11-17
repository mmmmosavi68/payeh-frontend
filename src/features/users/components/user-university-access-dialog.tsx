
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { UserRecord } from "@/types/user";
import {
  getUserAvailableUniversities,
  getUserUniversityAccess,
  updateUserUniversityAccess,
  type UserAvailableUniversity,
} from "../api";
import { usePermission } from "@/features/permissions/use-permission";

type Props = {
  user: UserRecord;
};

export function UserUniversityAccessAction({ user }: Props) {
  const tc = useTranslations("common");

  const updatePermission = usePermission(
    "UserManagement",
    "UpdateUniversityAccess",
  );

  const availablePermission = usePermission(
    "UserManagement",
    "GetAvailableUniversities",
  );

  const assignedPermission = usePermission(
    "UserManagement",
    "GetUniversityAccess",
  );

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const [universities, setUniversities] = useState<
    UserAvailableUniversity[]
  >([]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(),
  );

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setFailed(false);

      try {
        const [available, assigned] = await Promise.all([
          getUserAvailableUniversities(),
          getUserUniversityAccess(user.id),
        ]);

        if (cancelled) return;

        setUniversities(available);
        setSelectedIds(new Set(assigned));
      } catch {
        if (!cancelled) {
          setFailed(true);
          toast.error("دریافت اطلاعات دانشگاه‌ها ناموفق بود.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, user.id]);

  const filteredUniversities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fa");

    if (!query) return universities;

    return universities.filter((university) =>
      university.title.toLocaleLowerCase("fa").includes(query),
    );
  }, [universities, search]);

  function toggleUniversity(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(universities.map((item) => item.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function retry() {
    setLoading(true);
    setFailed(false);

    try {
      const [available, assigned] = await Promise.all([
        getUserAvailableUniversities(),
        getUserUniversityAccess(user.id),
      ]);

      setUniversities(available);
      setSelectedIds(new Set(assigned));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);

    try {
      await updateUserUniversityAccess(
        user.id,
        Array.from(selectedIds),
      );

      toast.success("دسترسی دانشگاه‌های کاربر با موفقیت ذخیره شد.");
      setOpen(false);
    } catch {
      toast.error("ذخیره دسترسی دانشگاه‌ها ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return;

    if (!nextOpen) {
      setSearch("");
      setFailed(false);
    }

    setOpen(nextOpen);
  }

  if (
    updatePermission.loading ||
    availablePermission.loading ||
    assignedPermission.loading ||
    !updatePermission.allowed ||
    !availablePermission.allowed ||
    !assignedPermission.allowed
  ) {
    return null;
  }

  const fullName =
    `${user.firstName} ${user.lastName}`.trim() || user.userName;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        title="تخصیص دانشگاه‌ها"
        aria-label="تخصیص دانشگاه‌ها"
        onClick={() => setOpen(true)}
      >
        <Building2 className="size-4" aria-hidden />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" aria-hidden />
              تخصیص دانشگاه‌ها
            </DialogTitle>

            <DialogDescription>
              تعیین دانشگاه‌های قابل دسترس برای {fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی دانشگاه..."
                className="h-9 ps-9"
                maxLength={100}
                disabled={loading || failed}
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary tabular-nums">
                {selectedIds.size} دانشگاه انتخاب‌شده
              </span>

              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={loading || failed || universities.length === 0}
                >
                  انتخاب همه
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={loading || failed || selectedIds.size === 0}
                >
                  پاک کردن انتخاب
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
              {loading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  در حال دریافت دانشگاه‌ها...
                </div>
              ) : failed ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
                  <p className="text-sm text-destructive">
                    دریافت اطلاعات دانشگاه‌ها ناموفق بود.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={retry}
                  >
                    تلاش مجدد
                  </Button>
                </div>
              ) : filteredUniversities.length > 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                  {filteredUniversities.map((university) => (
                    <label
                      key={university.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/70"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(university.id)}
                        onChange={() => toggleUniversity(university.id)}
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                      />

                      <Building2
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />

                      <span className="text-sm font-medium">
                        {university.title}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  {search
                    ? "دانشگاهی با این عبارت پیدا نشد."
                    : "دانشگاهی برای تخصیص وجود ندارد."}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={saving}
                onClick={() => handleOpenChange(false)}
              >
                {tc("cancel")}
              </Button>

              <Button
                type="button"
                className="rounded-full"
                onClick={() => void save()}
                disabled={loading || failed || saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-4" aria-hidden />
                )}
                {tc("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
