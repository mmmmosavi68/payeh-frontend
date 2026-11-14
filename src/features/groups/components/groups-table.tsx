
"use client";

import { useFormatter, useLocale } from "next-intl";
import {
  Search,
  Users,
  ShieldAlert,
  Plus,
  Pencil,
  Ellipsis,
  Trash2,
  UserRoundCog,
  ListChecks,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useRemoteData } from "@/hooks/use-remote-data";
import { localeDirections } from "@/i18n/routing";
import { ApiError, ApiStatus } from "@/lib/api/errors";
import { usePermission } from "@/features/permissions/use-permission";

import { deleteGroup, listGroups } from "../api";
import type { GroupDto } from "../types";
import { GroupFormDialog } from "./group-form-dialog";
import { GroupMembersDialog } from "./group-members-dialog";
import { GroupMenuAccessDialog } from "./group-menu-access-dialog";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
      }
    >
      {active ? "فعال" : "غیرفعال"}
    </span>
  );
}

function GroupCell({ group }: { group: GroupDto }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border bg-muted text-muted-foreground">
        <Users className="size-4" aria-hidden />
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {group.groupName}
        </p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {group.id}
        </p>
      </div>
    </div>
  );
}

export function GroupsTable() {
  const locale = useLocale();
  const format = useFormatter();
  const dir = localeDirections[locale] ?? "ltr";

  // Permissions
  const createPermission = usePermission("Groups", "Create");
  const updatePermission = usePermission("Groups", "Update");
  const deletePermission = usePermission("Groups", "Delete");

  // Filters and pagination
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [formGroup, setFormGroup] = useState<GroupDto | null>(null);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GroupDto | null>(null);

  // Group members dialog
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersGroup, setMembersGroup] = useState<GroupDto | null>(null);

  // Group menu access dialog
  const [menuAccessOpen, setMenuAccessOpen] = useState(false);
  const [menuAccessGroup, setMenuAccessGroup] = useState<GroupDto | null>(null);

  // Remote data
  const { data, failed, error, loading, reload } = useRemoteData(
    "groups",
    listGroups,
  );

  const isForbidden =
    error instanceof ApiError &&
    error.status === ApiStatus.Forbidden;

  // Filter groups
  const filteredGroups = useMemo(() => {
    const query = searchInput.trim().toLocaleLowerCase("fa");

    return (data ?? []).filter((group) => {
      const matchesSearch = group.groupName
        .toLocaleLowerCase("fa")
        .includes(query);

      const matchesStatus =
        status === "all" ||
        (status === "active" && group.isActive) ||
        (status === "inactive" && !group.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchInput, status]);

  // Pagination
  const total = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const visibleGroups = filteredGroups.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  // Create
  function openCreate() {
    setFormGroup(null);
    setFormOpen(true);
  }

  // Edit
  function openEdit(group: GroupDto) {
    setFormGroup(group);
    setFormOpen(true);
  }

  // Manage members
  function openMembers(group: GroupDto) {
    setMembersGroup(group);
    setMembersOpen(true);
  }

  // Manage menu access
  function openMenuAccess(group: GroupDto) {
    setMenuAccessGroup(group);
    setMenuAccessOpen(true);
  }

  // Delete
  function openDelete(group: GroupDto) {
    setDeleteTarget(group);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    await deleteGroup(deleteTarget.id);

    toast.success("گروه کاربری با موفقیت حذف شد.");

    if (visibleGroups.length === 1 && currentPage > 1) {
      setPage(currentPage - 1);
    }

    reload();
  }

  // Filters
  function clearFilters() {
    setSearchInput("");
    setStatus("all");
    setPage(1);
  }

  // Date formatting
  function formatDate(value: string) {
    return format.dateTime(new Date(value), {
      dateStyle: "medium",
    });
  }

  // Forbidden state
  if (isForbidden) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-5" aria-hidden />}
        title="دسترسی غیرمجاز"
        description="شما مجوز مشاهده فهرست گروه‌های کاربری را ندارید."
      />
    );
  }

  // Error state
  if (failed) {
    return (
      <ErrorState
        title="دریافت اطلاعات گروه‌ها ناموفق بود"
        description="ارتباط با سرور برقرار نشد یا امکان دریافت اطلاعات وجود ندارد."
        onRetry={reload}
      />
    );
  }

  const hasFilters = searchInput.trim() !== "" || status !== "all";

  return (
    <div className="flex flex-col gap-4">
      {/* Search and filters */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />

          <Input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder="جست‌وجو در عنوان گروه‌ها..."
            aria-label="جست‌وجو در گروه‌ها"
            maxLength={100}
            className="h-9 ps-9"
          />
        </div>

        <Select
          dir={dir}
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full sm:w-40"
            aria-label="وضعیت گروه"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="inactive">غیرفعال</SelectItem>
          </SelectContent>
        </Select>

        {createPermission.allowed ? (
          <Button
            className="rounded-full"
            onClick={openCreate}
            disabled={createPermission.loading}
          >
            <Plus className="size-4" aria-hidden />
            ایجاد گروه
          </Button>
        ) : null}
      </div>

      {/* Groups table */}
      {total === 0 && !loading ? (
        <EmptyState
          icon={<Users className="size-5" aria-hidden />}
          title={
            hasFilters
              ? "گروهی با این مشخصات پیدا نشد"
              : "هنوز گروهی ثبت نشده است"
          }
          description={
            hasFilters
              ? "عبارت جست‌وجو یا فیلتر وضعیت را تغییر دهید."
              : "در حال حاضر هیچ گروه کاربری در سامانه ثبت نشده است."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={clearFilters}
              >
                پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            aria-busy={loading}
            className="overflow-hidden rounded-2xl border bg-card transition-opacity"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان گروه</TableHead>
                  <TableHead>تعداد اعضا</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">عملیات</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 5 }, (_, cell) => (
                          <TableCell key={cell}>
                            <Skeleton className="h-5 w-full max-w-36" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : visibleGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <GroupCell group={group} />
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-1 text-xs font-medium tabular-nums">
                            {format.number(group.userCount)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <StatusBadge active={group.isActive} />
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(group.createdDate)}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu dir={dir}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-full"
                                aria-label={`عملیات گروه ${group.groupName}`}
                              >
                                <Ellipsis
                                  className="size-4"
                                  aria-hidden
                                />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => openMembers(group)}
                              >
                                <UserRoundCog
                                  className="size-4"
                                  aria-hidden
                                />
                                مدیریت اعضا
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() => openMenuAccess(group)}
                              >
                                <ListChecks
                                  className="size-4"
                                  aria-hidden
                                />
                                مدیریت دسترسی منوها
                              </DropdownMenuItem>

                              {updatePermission.allowed ? (
                                <DropdownMenuItem
                                  onSelect={() => openEdit(group)}
                                >
                                  <Pencil
                                    className="size-4"
                                    aria-hidden
                                  />
                                  ویرایش
                                </DropdownMenuItem>
                              ) : null}

                              {deletePermission.allowed ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => openDelete(group)}
                                >
                                  <Trash2
                                    className="size-4"
                                    aria-hidden
                                  />
                                  حذف
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                نمایش {format.number(from)} تا {format.number(to)} از{" "}
                {format.number(total)} گروه
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  قبلی
                </Button>

                <span
                  className="px-2 text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  صفحه {format.number(currentPage)} از{" "}
                  {format.number(totalPages)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  بعدی
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Create / Edit Group Dialog */}
      <GroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={formGroup}
        onSaved={reload}
      />

      {/* Group Members Dialog */}
      <GroupMembersDialog
        open={membersOpen}
        onOpenChange={(open) => {
          setMembersOpen(open);

          if (!open) {
            setMembersGroup(null);
            reload();
          }
        }}
        group={membersGroup}
      />

      {/* Group Menu Access Dialog */}
      <GroupMenuAccessDialog
        open={menuAccessOpen}
        onOpenChange={(open) => {
          setMenuAccessOpen(open);

          if (!open) {
            setMenuAccessGroup(null);
          }
        }}
        group={menuAccessGroup}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);

          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="حذف گروه کاربری"
        description={`آیا از حذف گروه «${deleteTarget?.groupName ?? ""}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        confirmLabel="بله، حذف شود"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
