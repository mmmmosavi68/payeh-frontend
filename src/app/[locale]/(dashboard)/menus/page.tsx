
"use client";

import { useState } from "react";
import { FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { useRemoteData } from "@/hooks/use-remote-data";

import {
  deleteMenu,
  listMenus,
} from "@/features/menus/api";

import type { MenuDto } from "@/features/menus/types";

import { MenusTree } from "@/features/menus/components/menus-tree";
import { MenuFormSheet } from "@/features/menus/components/menu-form-sheet";

export default function MenusPage() {
  const {
    data,
    loading,
    failed,
    reload,
  } = useRemoteData("menus", listMenus);

  const menus = data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuDto | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuDto | null>(null);

  function handleCreateRoot() {
    setEditingMenu(null);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  function handleCreateChild(parent: MenuDto) {
    setEditingMenu(null);
    setDefaultParentId(parent.id);
    setFormOpen(true);
  }

  function handleEdit(menu: MenuDto) {
    setEditingMenu(menu);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    await deleteMenu(deleteTarget.id);

    toast.success("منو با موفقیت حذف شد.");
    setDeleteTarget(null);
    reload();
  }

  return (
    <div className="space-y-6">
      {/* عنوان صفحه */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت منوها
          </h1>
          <p className="text-sm text-muted-foreground">
            ساختار منوهای سامانه و تنظیمات دسترسی و نمایش آن‌ها را مدیریت کنید.
          </p>
        </div>

        {/* <Button
          onClick={handleCreateRoot}
          className="w-full rounded-full sm:w-auto"
        >
          <Plus className="size-4" />
          افزودن منوی اصلی
        </Button> */}
      </div>

      {/* وضعیت بارگذاری */}
      {loading && (
        <div className="rounded-2xl border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            در حال دریافت اطلاعات منوها...
          </p>
        </div>
      )}

      {/* خطای دریافت اطلاعات */}
      {!loading && failed && (
        <ErrorState
          title="دریافت اطلاعات منوها ناموفق بود"
          description="ارتباط با سرور برقرار نشد یا امکان دریافت اطلاعات وجود ندارد."
          onRetry={reload}
        />
      )}

      {/* فهرست منوها */}
      {!loading && !failed && menus.length > 0 && (
        <MenusTree
          menus={menus}
          canCreate={true}
          canUpdate={true}
          canDelete={true}
          onCreateRoot={handleCreateRoot}
          onCreateChild={handleCreateChild}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* فهرست خالی */}
      {!loading && !failed && menus.length === 0 && (
        <EmptyState
          icon={<FolderTree className="size-5" />}
          title="هنوز منویی ثبت نشده است"
          description="برای شروع، اولین منوی اصلی سامانه را ایجاد کنید."
          action={
            <Button
              onClick={handleCreateRoot}
              className="rounded-full"
            >
              <Plus className="size-4" />
              ایجاد اولین منو
            </Button>
          }
        />
      )}

      {/* فرم افزودن و ویرایش */}
      <MenuFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        menu={editingMenu}
        menus={menus}
        defaultParentId={defaultParentId}
        onSaved={reload}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف منو"
        description={
          deleteTarget
            ? `آیا از حذف منوی «${deleteTarget.menuTitle}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`
            : ""
        }
        confirmLabel="حذف منو"
        onConfirm={handleDelete}
      />
    </div>
  );
}
