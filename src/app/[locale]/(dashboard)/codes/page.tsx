
"use client";

import { useState } from "react";
import { Database, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { useRemoteData } from "@/hooks/use-remote-data";

import { deleteCode, listCodes } from "@/features/codes/api";
import type { CodeDto } from "@/features/codes/types";

import { CodesTree } from "@/features/codes/components/codes-tree";
import { CodeFormSheet } from "@/features/codes/components/code-form-sheet";

export default function CodesPage() {
  const {
    data,
    loading,
    failed,
    reload,
  } = useRemoteData("codes", listCodes);

  const codes = data ?? [];

const root = codes.find(
  (code) =>
    code.parentId == null &&
    code.primaryCode === 0 &&
    code.subCode === 0,
);

  const groups = root
    ? codes.filter(
        (code) =>
          code.parentId === root.id &&
          code.subCode === 0,
      )
    : [];

  const [formOpen, setFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CodeDto | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CodeDto | null>(null);

  function handleCreateGroup() {
    if (!root) return;

    setEditingCode(null);
    setDefaultParentId(root.id);
    setFormOpen(true);
  }

  function handleCreateItem(group: CodeDto) {
    setEditingCode(null);
    setDefaultParentId(group.id);
    setFormOpen(true);
  }

  function handleEdit(code: CodeDto) {
    setEditingCode(code);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    await deleteCode(deleteTarget.id);

    toast.success(
      deleteTarget.subCode === 0
        ? "گروه با موفقیت حذف شد."
        : "آیتم با موفقیت حذف شد.",
    );

    setDeleteTarget(null);
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت کدهای اطلاعات پایه
          </h1>

          <p className="text-sm text-muted-foreground">
            گروه‌ها و آیتم‌های اطلاعات پایه سامانه را مدیریت کنید.
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          <p className="text-sm text-muted-foreground">
            در حال دریافت اطلاعات کدها...
          </p>
        </div>
      )}

      {!loading && failed && (
        <ErrorState
          title="دریافت اطلاعات کدها ناموفق بود"
          description="ارتباط با سرور برقرار نشد یا امکان دریافت اطلاعات وجود ندارد."
          onRetry={reload}
        />
      )}

      {!loading && !failed && !root && (
        <ErrorState
          title="ساختار اصلی کدها پیدا نشد"
          description="رکورد ریشه جدول Codes در اطلاعات دریافتی وجود ندارد."
          onRetry={reload}
        />
      )}

      {!loading && !failed && root && groups.length > 0 && (
        <CodesTree
          root={root}
          groups={groups}
          codes={codes}
          onCreateGroup={handleCreateGroup}
          onCreateItem={handleCreateItem}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {!loading && !failed && root && groups.length === 0 && (
        <EmptyState
          icon={<Database className="size-5" />}
          title="هنوز گروهی ثبت نشده است"
          description="برای شروع، اولین گروه اطلاعات پایه را ایجاد کنید."
          action={
            <Button
              onClick={handleCreateGroup}
              className="rounded-full"
            >
              <Plus className="size-4" />
              ایجاد اولین گروه
            </Button>
          }
        />
      )}

      {root && (
        <CodeFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          code={editingCode}
          rootId={root.id}
          groups={groups}
          defaultParentId={defaultParentId}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.subCode === 0
            ? "حذف گروه"
            : "حذف آیتم"
        }
        description={
          deleteTarget
            ? `آیا از حذف «${deleteTarget.title}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`
            : ""
        }
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  );
}
