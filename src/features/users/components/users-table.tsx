
"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getMe } from "@/features/auth/me";
import { useRemoteData } from "@/hooks/use-remote-data";
import { localeDirections } from "@/i18n/routing";
import { ApiError, ApiStatus } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { UserQuery, UserRecord, UserSort } from "@/types/user";

import { deleteUser, getUserById, listRoles, listUsers } from "../api";
import { UserFormDialog } from "./user-form-dialog";
import { usePermission } from "@/features/permissions/use-permission";
import { UserMenuAccessAction } from "./user-menu-access-dialog";
import { UserBulkActions } from "./user-bulk-actions";

const PAGE_SIZE = 10;

type SortDir = UserQuery["dir"];

function fullName(user: UserRecord) {
  return `${user.firstName} ${user.lastName}`.trim() || user.userName;
}

function initials(user: UserRecord) {
  const first = Array.from(user.firstName)[0];
  const last = Array.from(user.lastName)[0];

  if (first && last) return `${first}${last}`;

  return Array.from(user.userName).slice(0, 2).join("").toUpperCase();
}

function StatusBadge({ active }: { active: boolean }) {
  const t = useTranslations("users.status");

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {active ? t("active") : t("inactive")}
    </span>
  );
}

function RoleBadges({ roles }: { roles: UserRecord["roles"] }) {
  const locale = useLocale();

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role.id} variant="secondary">
          {locale === "fa" ? role.nameFa : role.nameEn}
        </Badge>
      ))}
    </div>
  );
}

function UserCell({ user }: { user: UserRecord }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border bg-muted text-xs font-medium">
        {initials(user)}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{fullName(user)}</p>
        <p className="truncate text-xs text-muted-foreground" dir="ltr">
          {user.userName}
        </p>
      </div>
    </div>
  );
}

type RowActionsProps = {
  user: UserRecord;
  dir: "rtl" | "ltr";
  canDelete: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function RowActions({
  user,
  dir,
  canDelete,
  canUpdate,
  onEdit,
  onDelete,
}: RowActionsProps) {
  const t = useTranslations("common");

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label={`${t("actions")}: ${fullName(user)}`}
        >
          <Ellipsis className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {canUpdate ? (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="size-4" aria-hidden />
            {t("edit")}
          </DropdownMenuItem>
        ) : null}

        {canDelete ? (
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 className="size-4" aria-hidden />
            {t("delete")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SortHeadProps = {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
};

function SortHead({ label, active, dir, onClick }: SortHeadProps) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
    >
      {label}
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}

function ariaSort(active: boolean, dir: SortDir) {
  if (!active) return "none" as const;
  return dir === "asc" ? ("ascending" as const) : ("descending" as const);
}

export function UsersTable() {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const format = useFormatter();
  const locale = useLocale();
  const dir = localeDirections[locale] ?? "ltr";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const createPermission = usePermission("Users", "Create");
  const updatePermission = usePermission("Users", "Update");
  const deletePermission = usePermission("Users", "Delete");

  const bulkDeactivatePermission = usePermission(
    "UserManagement",
    "BulkDeactivate",
  );

  const bulkDeletePermission = usePermission(
    "UserManagement",
    "BulkDelete",
  );

  const canBulkSelect =
    (!bulkDeactivatePermission.loading &&
      bulkDeactivatePermission.allowed) ||
    (!bulkDeletePermission.loading && bulkDeletePermission.allowed);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);

  const [status, setStatus] = useState<UserQuery["status"]>("all");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [sort, setSort] = useState<UserSort>("createdDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formUser, setFormUser] = useState<UserRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const query = useMemo<UserQuery>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search,
      status,
      roleId,
      sort,
      dir: sortDir,
    }),
    [page, search, status, roleId, sort, sortDir],
  );

  const { data, failed, error, loading, reload } = useRemoteData(
    JSON.stringify(query),
    () => listUsers(query),
  );

  const { data: me } = useRemoteData("me", getMe);

  const {
    data: roles,
    failed: rolesFailed,
    reload: reloadRoles,
  } = useRemoteData("roles", listRoles);

  const selectableUsers =
    data?.items.filter((user) => user.id !== me?.id) ?? [];

  const allSelectableSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) => selectedIds.includes(user.id));

  const someSelectableSelected =
    selectableUsers.some((user) => selectedIds.includes(user.id));

  function toggleUserSelection(userId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId),
    );
  }

  function toggleAllUsers(checked: boolean) {
    setSelectedIds(checked ? selectableUsers.map((user) => user.id) : []);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  const isForbidden =
    error instanceof ApiError && error.status === ApiStatus.Forbidden;

  const hasFilters =
    searchInput !== "" || status !== "all" || roleId !== null;

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  function toggleSort(key: UserSort) {
    clearSelection();

    if (sort === key) {
      setSortDir((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir(key === "userName" ? "asc" : "desc");
    }

    setPage(1);
  }

  function openCreate() {
    setFormUser(null);
    setFormOpen(true);
  }

  async function openEdit(user: UserRecord) {
    try {
      const details = await getUserById(user.id);
      setFormUser(details);
      setFormOpen(true);
    } catch {
      toast.error(
        locale === "fa"
          ? "دریافت جزئیات کاربر ناموفق بود."
          : "Could not load user details.",
      );
    }
  }

  function openDelete(user: UserRecord) {
    setDeleteTarget(user);
    setDeleteOpen(true);
  }

  function clearFilters() {
    clearSelection();
    setSearchInput("");
    setStatus("all");
    setRoleId(null);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    await deleteUser(deleteTarget.id);
    toast.success(t("toast.deleted"));

    if (data && data.items.length === 1 && page > 1) {
      setPage(page - 1);
    }

    reload();
  }

  if (isForbidden) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-5" aria-hidden />}
        title={t("forbidden.title")}
        description={t("forbidden.description")}
      />
    );
  }

  const showSkeleton = !data && !failed;

  const formatDate = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: "medium" });

  const formatLogin = (iso: string | null) =>
    iso
      ? format.dateTime(new Date(iso), {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : t("never");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />

          <Input
            type="search"
            value={searchInput}
            onChange={(event) => {
              clearSelection();
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            maxLength={100}
            className="h-9 ps-9"
          />
        </div>

        <Select
          dir={dir}
          value={roleId === null ? "all" : String(roleId)}
          onValueChange={(value) => {
            clearSelection();
            setRoleId(value === "all" ? null : Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full lg:w-44"
            aria-label={t("filters.role")}
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">{t("filters.allRoles")}</SelectItem>

            {roles?.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {locale === "fa" ? role.nameFa : role.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          dir={dir}
          value={status}
          onValueChange={(value) => {
            clearSelection();
            setStatus(value as UserQuery["status"]);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full lg:w-40"
            aria-label={t("filters.status")}
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            <SelectItem value="active">{t("filters.active")}</SelectItem>
            <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="rounded-full"
            onClick={openCreate}
            disabled={createPermission.loading || !createPermission.allowed}
          >
            <Plus className="size-4" aria-hidden />
            {t("add")}
          </Button>

          <UserBulkActions
            selectedIds={selectedIds}
            onClearSelection={clearSelection}
            onCompleted={reload}
          />
        </div>
      </div>

      {failed ? (
        <ErrorState
          title={t("error.title")}
          description={t("error.description")}
          onRetry={reload}
        />
      ) : data && data.total === 0 ? (
        <EmptyState
          icon={<Users className="size-5" aria-hidden />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            hasFilters ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={clearFilters}
              >
                {t("empty.clear")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div
            aria-busy={loading}
            className={cn(
              "hidden overflow-hidden rounded-2xl border bg-card transition-opacity md:block",
              loading && data && "opacity-60",
            )}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {canBulkSelect ? (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allSelectableSelected
                            ? true
                            : someSelectableSelected
                              ? "indeterminate"
                              : false
                        }
                        disabled={selectableUsers.length === 0}
                        onCheckedChange={(checked) =>
                          toggleAllUsers(checked === true)
                        }
                        aria-label={t("management.bulk.selectUsers")}
                      />
                    </TableHead>
                  ) : null}

                  <TableHead aria-sort={ariaSort(sort === "userName", sortDir)}>
                    <SortHead
                      label={t("columns.user")}
                      active={sort === "userName"}
                      dir={sortDir}
                      onClick={() => toggleSort("userName")}
                    />
                  </TableHead>

                  <TableHead>{t("columns.phone")}</TableHead>

                  <TableHead aria-sort={ariaSort(sort === "email", sortDir)}>
                    <SortHead
                      label={t("columns.email")}
                      active={sort === "email"}
                      dir={sortDir}
                      onClick={() => toggleSort("email")}
                    />
                  </TableHead>

                  <TableHead>{t("columns.roles")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>

                  <TableHead
                    aria-sort={ariaSort(sort === "lastLoginDate", sortDir)}
                  >
                    <SortHead
                      label={t("columns.lastLogin")}
                      active={sort === "lastLoginDate"}
                      dir={sortDir}
                      onClick={() => toggleSort("lastLoginDate")}
                    />
                  </TableHead>

                  <TableHead
                    aria-sort={ariaSort(sort === "createdDate", sortDir)}
                  >
                    <SortHead
                      label={t("columns.createdAt")}
                      active={sort === "createdDate"}
                      dir={sortDir}
                      onClick={() => toggleSort("createdDate")}
                    />
                  </TableHead>

                  <TableHead className="w-24">
                    <span className="sr-only">{t("columns.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {showSkeleton
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRow key={index}>
                        {Array.from(
                          { length: canBulkSelect ? 9 : 8 },
                          (_, cell) => (
                            <TableCell key={cell}>
                              <Skeleton className="h-5 w-full max-w-32" />
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    ))
                  : data?.items.map((user) => (
                      <TableRow key={user.id}>
                        {canBulkSelect ? (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(user.id)}
                              disabled={user.id === me?.id}
                              onCheckedChange={(checked) =>
                                toggleUserSelection(user.id, checked === true)
                              }
                              aria-label={fullName(user)}
                            />
                          </TableCell>
                        ) : null}

                        <TableCell>
                          <UserCell user={user} />
                        </TableCell>

                        <TableCell>
                          <span dir="ltr">{user.phone}</span>
                        </TableCell>

                        <TableCell>
                          <span dir="ltr" className="text-sm">
                            {user.email || "—"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <RoleBadges roles={user.roles} />
                        </TableCell>

                        <TableCell>
                          <StatusBadge active={user.isActive} />
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {formatLogin(user.lastLoginAt)}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <UserMenuAccessAction user={user} />

                            <RowActions
                              user={user}
                              dir={dir}
                              canDelete={
                                deletePermission.allowed && user.id !== me?.id
                              }
                              canUpdate={updatePermission.allowed}
                              onEdit={() => {
                                void openEdit(user);
                              }}
                              onDelete={() => openDelete(user)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul
            aria-busy={loading}
            className={cn(
              "flex flex-col gap-3 transition-opacity md:hidden",
              loading && data && "opacity-60",
            )}
          >
            {showSkeleton
              ? Array.from({ length: 4 }, (_, index) => (
                  <li key={index} className="rounded-2xl border bg-card p-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-3 h-4 w-24" />
                  </li>
                ))
              : data?.items.map((user) => (
                  <li key={user.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        {canBulkSelect ? (
                          <Checkbox
                            className="mt-2"
                            checked={selectedIds.includes(user.id)}
                            disabled={user.id === me?.id}
                            onCheckedChange={(checked) =>
                              toggleUserSelection(user.id, checked === true)
                            }
                            aria-label={fullName(user)}
                          />
                        ) : null}

                        <UserCell user={user} />
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <UserMenuAccessAction user={user} />

                        <RowActions
                          user={user}
                          dir={dir}
                          canDelete={
                            deletePermission.allowed && user.id !== me?.id
                          }
                          canUpdate={updatePermission.allowed}
                          onEdit={() => {
                            void openEdit(user);
                          }}
                          onDelete={() => openDelete(user)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge active={user.isActive} />
                      <RoleBadges roles={user.roles} />
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      <span dir="ltr">{user.phone}</span> ·{" "}
                      {t("columns.lastLogin")}: {formatLogin(user.lastLoginAt)}
                    </p>
                  </li>
                ))}
          </ul>

          {data && data.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t("pagination.summary", {
                  from: format.number(from),
                  to: format.number(to),
                  total: format.number(total),
                })}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    clearSelection();
                    setPage((value) => value - 1);
                  }}
                >
                  <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
                  {tc("previous")}
                </Button>

                <span
                  className="px-2 text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {t("pagination.page", {
                    page: format.number(page),
                    pages: format.number(totalPages),
                  })}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    clearSelection();
                    setPage((value) => value + 1);
                  }}
                >
                  {tc("next")}
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={formUser}
        roles={roles}
        rolesFailed={rolesFailed}
        onRetryRoles={reloadRoles}
        onSaved={() => {
          setFormOpen(false);
          reload();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete.title")}
        description={t("delete.description", {
          name: deleteTarget ? fullName(deleteTarget) : "",
        })}
        confirmLabel={t("delete.confirm")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
