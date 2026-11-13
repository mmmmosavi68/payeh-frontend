
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { createMenu, updateMenu } from "../api";
import type {
  CreateMenuDto,
  MenuDto,
  MenuFormDefaultValues,
} from "../types";
import {
  menuSchema,
  type MenuFormInput,
  type MenuFormValues,
} from "../schemas/menu-schema";

type MenuFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: MenuDto | null;
  menus: MenuDto[];
  onSaved: () => void;
  defaultParentId?: string | null;
};

const emptyValues: MenuFormDefaultValues = {
  parentId: null,
  menuTitle: "",
  pageCode: null,
  path: "",
  version: "",
  controllerName: "",
  actionName: "",
  showMenu: true,
  cssClass: "",
  icon: "",
  link: "",
  isActive: true,
};

function getDescendantIds(
  menuId: string,
  menus: MenuDto[],
): Set<string> {
  const result = new Set<string>([menuId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const item of menus) {
      if (
        item.parentId &&
        result.has(item.parentId) &&
        !result.has(item.id)
      ) {
        result.add(item.id);
        changed = true;
      }
    }
  }

  return result;
}

function buildParentOptions(
  menus: MenuDto[],
  excludedIds: Set<string>,
) {
  const available = menus.filter((item) => !excludedIds.has(item.id));
  const byId = new Map(available.map((item) => [item.id, item]));

  const children = new Map<string | null, MenuDto[]>();

  for (const item of available) {
    const parentId =
      item.parentId && byId.has(item.parentId)
        ? item.parentId
        : null;

    const group = children.get(parentId) ?? [];
    group.push(item);
    children.set(parentId, group);
  }

  const options: { id: string; title: string }[] = [];

  function visit(parentId: string | null, depth: number) {
    const items = children.get(parentId) ?? [];

    items.sort((a, b) => {
      return (a.pageCode ?? Number.MAX_SAFE_INTEGER) -
        (b.pageCode ?? Number.MAX_SAFE_INTEGER);
    });

    for (const item of items) {
      options.push({
        id: item.id,
        title: `${"　".repeat(depth)}${depth > 0 ? "└ " : ""}${item.menuTitle}`,
      });

      visit(item.id, depth + 1);
    }
  }

  visit(null, 0);

  return options;
}

export function MenuFormSheet({
  open,
  onOpenChange,
  menu,
  menus,
  onSaved,
  defaultParentId = null,
}: MenuFormSheetProps) {
  const isEdit = Boolean(menu);
  const [formError, setFormError] = useState<string | null>(null);

  const excludedIds = useMemo(
    () => (menu ? getDescendantIds(menu.id, menus) : new Set<string>()),
    [menu, menus],
  );

  const parentOptions = useMemo(
    () => buildParentOptions(menus, excludedIds),
    [menus, excludedIds],
  );

const {
  register,
  handleSubmit,
  control,
  reset,
  formState: { errors, isSubmitting },
} = useForm<MenuFormInput, unknown, MenuFormValues>({
  resolver: zodResolver(menuSchema),
  defaultValues: emptyValues,
});

  useEffect(() => {
    if (!open) return;

    setFormError(null);

    if (menu) {
      reset({
        parentId: menu.parentId,
        menuTitle: menu.menuTitle,
        pageCode: menu.pageCode,
        path: menu.path ?? "",
        version: menu.version ?? "",
        controllerName: menu.controllerName ?? "",
        actionName: menu.actionName ?? "",
        showMenu: menu.showMenu ?? true,
        cssClass: menu.cssClass ?? "",
        icon: menu.icon ?? "",
        link: menu.link ?? "",
        isActive: menu.isActive,
      });
} else {
  reset({
    ...emptyValues,
    parentId: defaultParentId,
  });
}
  }, [open, menu, defaultParentId, reset]);

  async function onSubmit(values: MenuFormValues) {
    setFormError(null);

    const payload: CreateMenuDto = {
      parentId: values.parentId || null,
      menuTitle: values.menuTitle.trim(),
      pageCode: values.pageCode,
      path: values.path.trim() || null,
      version: values.version.trim() || null,
      controllerName: values.controllerName.trim() || null,
      actionName: values.actionName.trim() || null,
      showMenu: values.showMenu,
      cssClass: values.cssClass.trim() || null,
      icon: values.icon.trim() || null,
      link: values.link.trim() || null,
      isActive: values.isActive,
    };

    try {
      if (menu) {
        await updateMenu(menu.id, payload);
        toast.success("منو با موفقیت ویرایش شد.");
      } else {
        await createMenu(payload);
        toast.success("منو با موفقیت ایجاد شد.");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "عملیات ذخیره منو با خطا مواجه شد.";

      setFormError(message);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b px-6 py-5 pe-14">
          <SheetTitle>
            {isEdit ? "ویرایش منو" : "افزودن منو"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "اطلاعات و تنظیمات منو را ویرایش کنید."
              : "اطلاعات منوی جدید را وارد کنید."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            {/* اطلاعات اصلی */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                اطلاعات اصلی
              </h3>

              <FormField
                id="menu-title"
                label="عنوان منو"
                placeholder="مثلاً مدیریت کاربران"
                maxLength={100}
                error={errors.menuTitle?.message}
                {...register("menuTitle")}
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="menu-parent">منوی والد</Label>
                <select
                  id="menu-parent"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register("parentId")}
                >
                  <option value="">بدون والد (منوی اصلی)</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                {errors.parentId?.message && (
                  <p className="text-xs text-destructive">
                    {errors.parentId.message}
                  </p>
                )}
              </div>

              <FormField
                id="menu-page-code"
                label="ترتیب نمایش (PageCode)"
                type="number"
                inputMode="numeric"
                placeholder="مثلاً 1"
                error={errors.pageCode?.message}
                {...register("pageCode")}
              />
            </section>

            <div className="border-t" />

            {/* اطلاعات مسیر و دسترسی */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                مسیر و دسترسی
              </h3>

              <FormField
                id="menu-path"
                label="Path"
                dir="ltr"
                placeholder="/users"
                maxLength={200}
                error={errors.path?.message}
                {...register("path")}
              />

              <FormField
                id="menu-link"
                label="Link"
                dir="ltr"
                placeholder="/users"
                maxLength={200}
                error={errors.link?.message}
                {...register("link")}
              />

              <FormField
                id="menu-version"
                label="Version"
                dir="ltr"
                placeholder="1"
                maxLength={100}
                error={errors.version?.message}
                {...register("version")}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="menu-controller"
                  label="ControllerName"
                  dir="ltr"
                  placeholder="Users"
                  maxLength={100}
                  error={errors.controllerName?.message}
                  {...register("controllerName")}
                />

                <FormField
                  id="menu-action"
                  label="ActionName"
                  dir="ltr"
                  placeholder="Get"
                  maxLength={100}
                  error={errors.actionName?.message}
                  {...register("actionName")}
                />
              </div>

              <p className="text-xs leading-6 text-muted-foreground">
                برای منوهای ساختاری، ControllerName و ActionName را خالی
                بگذارید. برای تعریف دسترسی یک عملیات، هر دو مقدار را
                مشخص کنید.
              </p>
            </section>

            <div className="border-t" />

            {/* تنظیمات نمایش */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                تنظیمات نمایش
              </h3>

              <FormField
                id="menu-icon"
                label="Icon"
                dir="ltr"
                placeholder="users"
                maxLength={100}
                error={errors.icon?.message}
                {...register("icon")}
              />

              <FormField
                id="menu-css-class"
                label="CssClass"
                dir="ltr"
                placeholder="custom-menu-class"
                maxLength={50}
                error={errors.cssClass?.message}
                {...register("cssClass")}
              />

              <Controller
                control={control}
                name="showMenu"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="menu-show"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                    <Label htmlFor="menu-show" className="font-normal">
                      نمایش در منوی سامانه
                    </Label>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="menu-active"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                    <Label htmlFor="menu-active" className="font-normal">
                      منو فعال باشد
                    </Label>
                  </div>
                )}
              />
            </section>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>

              <Button
                type="submit"
                className="rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {isEdit ? "ذخیره تغییرات" : "ایجاد منو"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
