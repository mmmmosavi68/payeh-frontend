
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCheck,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
  UserPlus,
  X,
} from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { listUsers } from "@/features/users/api";

import {
  addGroupMembers,
  listGroupMembers,
  removeGroupMembers,
} from "../api";

import type { GroupDto, GroupMemberDto } from "../types";
import type { UserRecord } from "@/types/user";

type GroupMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupDto | null;
};

const USERS_PAGE_SIZE = 50;

function memberName(member: GroupMemberDto) {
  const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  return name || member.userName;
}

function userName(user: UserRecord) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.userName;
}

export function GroupMembersDialog({
  open,
  onOpenChange,
  group,
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<GroupMemberDto[]>([]);

  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [usersReloadKey, setUsersReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );

  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );

  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const groupId = group?.id;

  // Load current group members
  useEffect(() => {
    if (!open || !groupId) return;

    let cancelled = false;

    async function loadMembers() {
      setMembersLoading(true);
      setMembersError(false);

      try {
        const result = await listGroupMembers(groupId!);

        if (!cancelled) {
          setMembers(result);
        }
      } catch {
        if (!cancelled) {
          setMembersError(true);
        }
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [open, groupId]);

  // Load available users only when add dialog is open
  useEffect(() => {
    if (!open || !addDialogOpen || !groupId) return;

    let cancelled = false;

    async function loadUsers() {
      setUsersLoading(true);
      setUsersError(false);

      try {
        const result = await listUsers({
          page: 1,
          pageSize: USERS_PAGE_SIZE,
          search,
          status: "all",
          roleId: null,
          sort: "userName",
          dir: "asc",
        });

        if (!cancelled) {
          setUsers(result.items);
        }
      } catch {
        if (!cancelled) {
          setUsersError(true);
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, addDialogOpen, groupId, search, usersReloadKey]);

  // Exclude users who are already members
  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.userId));

    return users.filter((user) => !memberIds.has(user.id));
  }, [users, members]);

  const selectedUserCount = selectedUserIds.size;
  const selectedMemberCount = selectedMemberIds.size;

  const allVisibleUsersSelected =
    availableUsers.length > 0 &&
    availableUsers.every((user) => selectedUserIds.has(user.id));

  const allMembersSelected =
    members.length > 0 &&
    members.every((member) => selectedMemberIds.has(member.userId));

  function toggleUser(userId: string) {
    setSelectedUserIds((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  }

  function toggleSelectAllUsers() {
    setSelectedUserIds((current) => {
      const next = new Set(current);

      if (allVisibleUsersSelected) {
        for (const user of availableUsers) {
          next.delete(user.id);
        }
      } else {
        for (const user of availableUsers) {
          next.add(user.id);
        }
      }

      return next;
    });
  }

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      const next = new Set(current);

      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }

      return next;
    });
  }

  function toggleSelectAllMembers() {
    setSelectedMemberIds((current) => {
      if (allMembersSelected) {
        return new Set();
      }

      return new Set(members.map((member) => member.userId));
    });
  }

  function clearUserSelection() {
    setSelectedUserIds(new Set());
  }

  function clearMemberSelection() {
    setSelectedMemberIds(new Set());
  }

  function openAddDialog() {
    setSearchInput("");
    setSelectedUserIds(new Set());
    setUsers([]);
    setUsersError(false);
    setUsersReloadKey((current) => current + 1);
    setAddDialogOpen(true);
  }

  function handleAddDialogChange(nextOpen: boolean) {
    if (adding) return;

    setAddDialogOpen(nextOpen);

    if (!nextOpen) {
      setSearchInput("");
      setSelectedUserIds(new Set());
      setUsers([]);
      setUsersError(false);
    }
  }

  // Add all selected users with one bulk API request
  async function handleAddMembers() {
    if (!groupId || selectedUserIds.size === 0) return;

    setAdding(true);

    const idsToAdd = Array.from(selectedUserIds);

    try {
      await addGroupMembers(groupId, idsToAdd);

      toast.success(
        `${idsToAdd.length} کاربر با موفقیت به گروه اضافه شدند.`,
      );

      setAddDialogOpen(false);
      setSelectedUserIds(new Set());
      setSearchInput("");
      setUsers([]);

      await reloadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "افزودن کاربران انتخاب‌شده ناموفق بود.",
      );
    } finally {
      setAdding(false);
    }
  }

  function openRemoveConfirmation() {
    if (selectedMemberIds.size === 0) return;
    setRemoveConfirmOpen(true);
  }

  // Remove all selected members with one bulk API request
  async function handleRemoveMembers() {
    if (!groupId || selectedMemberIds.size === 0) return;

    setRemoving(true);

    const idsToRemove = Array.from(selectedMemberIds);

    try {
      await removeGroupMembers(groupId, idsToRemove);

      toast.success(
        `${idsToRemove.length} عضو با موفقیت از گروه حذف شدند.`,
      );

      setSelectedMemberIds(new Set());
      setRemoveConfirmOpen(false);

      await reloadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "حذف اعضای انتخاب‌شده ناموفق بود.",
      );
    } finally {
      setRemoving(false);
    }
  }

  async function reloadMembers() {
    if (!groupId) return;

    setMembersLoading(true);
    setMembersError(false);

    try {
      setMembers(await listGroupMembers(groupId));
    } catch {
      setMembersError(true);
    } finally {
      setMembersLoading(false);
    }
  }

  function handleMainDialogChange(nextOpen: boolean) {
    if (adding || removing) return;

    if (!nextOpen) {
      setAddDialogOpen(false);
      setSearchInput("");
      setSelectedUserIds(new Set());
      setSelectedMemberIds(new Set());
      setRemoveConfirmOpen(false);
    }

    onOpenChange(nextOpen);
  }

  return (
    <>
      {/* Main members dialog */}
      <Dialog open={open} onOpenChange={handleMainDialogChange}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5" aria-hidden />
              مدیریت اعضای گروه
            </DialogTitle>

            <DialogDescription>
              مدیریت کاربران عضو گروه
              {group ? ` «${group.groupName}»` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* Members header and actions */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  اعضای فعلی گروه
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  فهرست کاربران عضو این گروه
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium tabular-nums">
                  {members.length} عضو
                </span>

                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={openAddDialog}
                  disabled={membersLoading || membersError || removing}
                >
                  <UserPlus className="size-4" aria-hidden />
                  افزودن عضو
                </Button>
              </div>
            </div>

            {/* Bulk selection toolbar */}
            {!membersLoading && !membersError && members.length > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allMembersSelected}
                    onChange={toggleSelectAllMembers}
                    disabled={removing}
                    className="size-4 cursor-pointer accent-primary"
                    aria-label="انتخاب همه اعضا"
                  />

                  <span>انتخاب همه اعضا</span>
                </label>

                <div className="flex items-center gap-2">
                  {selectedMemberCount > 0 ? (
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      {selectedMemberCount} انتخاب‌شده
                    </span>
                  ) : null}

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 rounded-full"
                    onClick={openRemoveConfirmation}
                    disabled={selectedMemberCount === 0 || removing}
                  >
                    {removing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}

                    حذف انتخاب‌شده‌ها
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Current members */}
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border bg-card">
              {membersLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  در حال دریافت اعضای گروه...
                </div>
              ) : membersError ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <p className="text-sm text-destructive">
                    دریافت اعضای گروه ناموفق بود.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={reloadMembers}
                  >
                    تلاش مجدد
                  </Button>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                    <Users className="size-7" aria-hidden />
                  </span>

                  <div>
                    <p className="text-sm font-medium">
                      هنوز عضوی برای این گروه ثبت نشده است.
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      برای افزودن کاربران روی دکمه افزودن عضو کلیک کنید.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    onClick={openAddDialog}
                  >
                    <Plus className="size-4" aria-hidden />
                    افزودن اولین عضو
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {members.map((member) => {
                    const checked = selectedMemberIds.has(member.userId);

                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center gap-3 p-3 transition-colors hover:bg-muted/40 ${
                          checked ? "bg-primary/5" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={removing}
                          onChange={() => toggleMember(member.userId)}
                          className="size-4 shrink-0 cursor-pointer accent-primary"
                          aria-label={`انتخاب ${memberName(member)}`}
                        />

                        <span className="grid size-10 shrink-0 place-items-center rounded-full border bg-muted text-muted-foreground">
                          <Users className="size-4" aria-hidden />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {memberName(member)}
                          </p>

                          <p
                            className="mt-0.5 truncate text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {member.userName}
                            {member.phoneNumber
                              ? ` · ${member.phoneNumber}`
                              : ""}
                          </p>
                        </div>

                        <span
                          className={
                            member.isActive
                              ? "shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400"
                              : "shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                          }
                        >
                          {member.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedMemberCount > 0 ? (
              <div className="flex shrink-0 items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {selectedMemberCount} عضو برای حذف انتخاب شده است.
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={clearMemberSelection}
                  disabled={removing}
                >
                  پاک کردن انتخاب
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add members dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={handleAddDialogChange}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" aria-hidden />
              افزودن اعضای جدید
            </DialogTitle>

            <DialogDescription>
              کاربران موردنظر را جست‌وجو و انتخاب کنید.
              {group ? ` گروه: ${group.groupName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="relative shrink-0">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="جست‌وجوی نام، نام کاربری یا شماره تماس..."
                className="h-10 ps-9"
                maxLength={100}
                disabled={adding}
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary tabular-nums">
                {selectedUserCount} کاربر انتخاب‌شده
              </span>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={toggleSelectAllUsers}
                  disabled={
                    adding ||
                    usersLoading ||
                    availableUsers.length === 0
                  }
                >
                  <CheckCheck className="size-3.5" />
                  {allVisibleUsersSelected ? "لغو انتخاب همه" : "انتخاب همه"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={clearUserSelection}
                  disabled={adding || selectedUserCount === 0}
                >
                  <X className="size-3.5" />
                  پاک کردن
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border bg-card">
              {usersLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  در حال دریافت کاربران...
                </div>
              ) : usersError ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <p className="text-sm text-destructive">
                    دریافت فهرست کاربران ناموفق بود.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersReloadKey((current) => current + 1)}
                  >
                    تلاش مجدد
                  </Button>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Users className="size-8 text-muted-foreground/50" />

                  <p className="text-sm font-medium">
                    {search.trim()
                      ? "کاربری با این مشخصات پیدا نشد."
                      : "کاربر قابل انتخابی وجود ندارد."}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {search.trim()
                      ? "عبارت جست‌وجو را تغییر دهید."
                      : "کاربران نمایش‌داده‌شده عضو این گروه هستند."}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {availableUsers.map((user) => {
                    const checked = selectedUserIds.has(user.id);

                    return (
                      <label
                        key={user.id}
                        className={`flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50 ${
                          checked ? "bg-primary/5" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={adding}
                          onChange={() => toggleUser(user.id)}
                          className="size-4 shrink-0 cursor-pointer accent-primary"
                          aria-label={`انتخاب ${userName(user)}`}
                        />

                        <span className="grid size-9 shrink-0 place-items-center rounded-full border bg-muted text-muted-foreground">
                          <Users className="size-4" aria-hidden />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {userName(user)}
                          </span>

                          <span
                            className="mt-0.5 block truncate text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {user.userName}
                          </span>
                        </span>

                        {checked ? (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                            انتخاب‌شده
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="shrink-0 text-xs text-muted-foreground">
              حداکثر ۵۰ نتیجه اول جست‌وجو نمایش داده می‌شود.
            </p>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={adding}
                onClick={() => handleAddDialogChange(false)}
              >
                انصراف
              </Button>

              <Button
                type="button"
                className="rounded-full"
                onClick={handleAddMembers}
                disabled={
                  selectedUserCount === 0 ||
                  adding ||
                  usersLoading
                }
              >
                {adding ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}

                {adding
                  ? "در حال افزودن..."
                  : `افزودن ${selectedUserCount} کاربر`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk remove confirmation */}
      <ConfirmDialog
        open={removeConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (removing) return;
          setRemoveConfirmOpen(nextOpen);
        }}
        title="حذف اعضای انتخاب‌شده"
        description={`آیا مطمئن هستید که ${selectedMemberCount} عضو انتخاب‌شده از گروه${group ? ` «${group.groupName}»` : ""} حذف شوند؟`}
        confirmLabel="حذف اعضا"
        onConfirm={handleRemoveMembers}
      />
    </>
  );
}
