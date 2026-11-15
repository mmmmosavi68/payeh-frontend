
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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

import { createCode, updateCode } from "../api";
import type { CodeDto, CreateCodeDto } from "../types";
import {
  codeSchema,
  type CodeFormInput,
  type CodeFormValues,
} from "../schemas/code-schema";

type CodeFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: CodeDto | null;
  rootId: number;
  groups: CodeDto[];
  defaultParentId: number | null;
  onSaved: () => void;
};

const emptyValues: CodeFormInput = {
  kind: "group",
  title: "",
  parentId: null,
  primaryCode: null,
  subCode: null,
  standardCode: null,
  additionalInformation: "",
  isActive: true,
};

export function CodeFormSheet({
  open,
  onOpenChange,
  code,
  rootId,
  groups,
  defaultParentId,
  onSaved,
}: CodeFormSheetProps) {
  const isEdit = Boolean(code);
  const isGroup = code
    ? code.subCode === 0
    : defaultParentId === rootId;

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CodeFormInput, unknown, CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;

    setFormError(null);

    if (code) {
      reset({
        kind: code.subCode === 0 ? "group" : "item",
        title: code.title,
        parentId: code.parentId,
        primaryCode: code.primaryCode,
        subCode: code.subCode,
        standardCode: code.standardCode,
        additionalInformation: code.additionalInformation ?? "",
        isActive: code.isActive,
      });
    } else {
      reset({
        ...emptyValues,
        kind: isGroup ? "group" : "item",
        parentId: defaultParentId,
      });
    }
  }, [open, code, defaultParentId, isGroup, reset]);

  async function onSubmit(values: CodeFormValues) {
    setFormError(null);

    const payload: CreateCodeDto = {
      title: values.title.trim(),
      parentId: isGroup ? rootId : values.parentId!,
      primaryCode: isGroup ? values.primaryCode : null,
      subCode: isGroup ? 0 : values.subCode!,
      standardCode: isGroup ? null : values.standardCode,
      additionalInformation:
        values.additionalInformation.trim() || null,
    };

    try {
      if (code) {
        await updateCode(code.id, {
          ...payload,
          isActive: values.isActive,
        });

        toast.success(
          isGroup
            ? "گروه با موفقیت ویرایش شد."
            : "آیتم با موفقیت ویرایش شد.",
        );
      } else {
        await createCode(payload);

        toast.success(
          isGroup
            ? "گروه با موفقیت ایجاد شد."
            : "آیتم با موفقیت ایجاد شد.",
        );
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "عملیات ذخیره اطلاعات با خطا مواجه شد.";

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
            {isEdit
              ? isGroup
                ? "ویرایش گروه اطلاعات پایه"
                : "ویرایش آیتم اطلاعات پایه"
              : isGroup
                ? "افزودن گروه اطلاعات پایه"
                : "افزودن آیتم اطلاعات پایه"}
          </SheetTitle>

          <SheetDescription>
            {isGroup
              ? "اطلاعات گروه را وارد یا ویرایش کنید."
              : "اطلاعات آیتم را وارد یا ویرایش کنید."}
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

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                اطلاعات اصلی
              </h3>

              <FormField
                id="code-title"
                label="عنوان"
                placeholder="عنوان را وارد کنید"
                maxLength={200}
                error={errors.title?.message}
                {...register("title")}
              />

              {isGroup ? (
                <FormField
                  id="code-primary"
                  label="کد اصلی گروه"
                  type="number"
                  inputMode="numeric"
                  placeholder="مثلاً 6"
                  error={errors.primaryCode?.message}
                  {...register("primaryCode", {
                    valueAsNumber: true,
                  })}
                />
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="code-parent">گروه والد</Label>

                    <select
                      id="code-parent"
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      {...register("parentId", {
                        setValueAs: (value) =>
                          value === "" ? null : Number(value),
                      })}
                    >
                      <option value="">انتخاب گروه</option>

                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.title}
                        </option>
                      ))}
                    </select>

                    {errors.parentId?.message && (
                      <p className="text-xs text-destructive">
                        {errors.parentId.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id="code-sub"
                      label="کد فرعی"
                      type="number"
                      inputMode="numeric"
                      placeholder="مثلاً 12"
                      error={errors.subCode?.message}
                      {...register("subCode", {
                        valueAsNumber: true,
                      })}
                    />

                    <FormField
                      id="code-standard"
                      label="کد استاندارد"
                      type="number"
                      inputMode="numeric"
                      placeholder="اختیاری"
                      error={errors.standardCode?.message}
                      {...register("standardCode", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="code-additional">
                  اطلاعات اضافی
                </Label>

                <textarea
                  id="code-additional"
                  rows={3}
                  maxLength={400}
                  placeholder="توضیحات اختیاری"
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register("additionalInformation")}
                />

                {errors.additionalInformation?.message && (
                  <p className="text-xs text-destructive">
                    {errors.additionalInformation.message}
                  </p>
                )}
              </div>

              {isEdit && (
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="code-active"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />

                      <Label
                        htmlFor="code-active"
                        className="font-normal"
                      >
                        این کد فعال باشد
                      </Label>
                    </div>
                  )}
                />
              )}
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

                {isEdit ? "ذخیره تغییرات" : "ایجاد"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
