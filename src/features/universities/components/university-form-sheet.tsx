
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

import { createUniversity, updateUniversity } from "../api";
import {
  universitySchema,
  type UniversityFormInput,
  type UniversityFormValues,
} from "../schemas/university-schema";
import type { UniversityDto } from "../types";
import type { UniversityTypeOption } from "../options";

type UniversityFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university: UniversityDto | null;
  universities: UniversityDto[];
  universityTypes: UniversityTypeOption[];
  onSaved: () => void;
};

const emptyValues: UniversityFormInput = {
  title: "",
  universityTypeId: 0,
  region: 1,
  capacityApproved: 0,
  parentUniversityId: null,
  isActive: true,
};

export function UniversityFormSheet({
  open,
  onOpenChange,
  university,
  universities,
  universityTypes,
  onSaved,
}: UniversityFormSheetProps) {
  const isEdit = university !== null;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UniversityFormInput, unknown, UniversityFormValues>({
    resolver: zodResolver(universitySchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;

    setFormError(null);

    if (university) {
      reset({
        title: university.title,
        universityTypeId: university.universityTypeId,
        region: university.region,
        capacityApproved: university.capacityApproved,
        parentUniversityId: university.parentUniversityId,
        isActive: university.isActive,
      });
    } else {
      reset(emptyValues);
    }
  }, [open, university, reset]);

  async function onSubmit(values: UniversityFormValues) {
    setFormError(null);

    const payload = {
      title: values.title.trim(),
      universityTypeId: values.universityTypeId,
      region: values.region,
      capacityApproved: values.capacityApproved,
      parentUniversityId: values.parentUniversityId,
    };

    try {
      if (university) {
        await updateUniversity(university.id, {
          ...payload,
          isActive: values.isActive,
        });

        toast.success("اطلاعات دانشگاه با موفقیت ویرایش شد.");
      } else {
        await createUniversity(payload);

        toast.success("دانشگاه با موفقیت ثبت شد.");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "ذخیره اطلاعات دانشگاه ناموفق بود.",
      );
    }
  }

  const parentOptions = universities.filter(
    (item) =>
      item.isActive &&
      item.id !== university?.id,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b px-6 py-5 pe-14">
          <SheetTitle>
            {isEdit ? "ویرایش دانشگاه" : "ثبت دانشگاه جدید"}
          </SheetTitle>

          <SheetDescription>
            اطلاعات دانشگاه و در صورت نیاز دانشگاه مادر را مشخص کنید.
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

            {universityTypes.length === 0 && (
              <div
                role="alert"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
              >
                گروه «نوع دانشگاه» یا گزینه‌های فعال آن در کدهای اطلاعات پایه
                پیدا نشد. ابتدا این گروه و گزینه‌های آن را در مدیریت کدها تعریف
                کنید.
              </div>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">اطلاعات اصلی</h3>

              <FormField
                id="university-title"
                label="نام دانشگاه"
                placeholder="نام دانشگاه را وارد کنید"
                maxLength={200}
                error={errors.title?.message}
                {...register("title")}
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="university-type">نوع دانشگاه</Label>

                <select
                  id="university-type"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  disabled={universityTypes.length === 0}
                  {...register("universityTypeId", {
                    setValueAs: (value) =>
                      value === "" ? 0 : Number(value),
                  })}
                >
                  <option value={0}>انتخاب نوع دانشگاه</option>

                  {universityTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>

                {errors.universityTypeId?.message && (
                  <p className="text-xs text-destructive">
                    {errors.universityTypeId.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="university-region">منطقه</Label>

                  <select
                    id="university-region"
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    {...register("region", {
                      setValueAs: (value) => Number(value),
                    })}
                  >
                    {Array.from({ length: 11 }, (_, index) => index + 1).map(
                      (region) => (
                        <option key={region} value={region}>
                          منطقه {region}
                        </option>
                      ),
                    )}
                  </select>

                  {errors.region?.message && (
                    <p className="text-xs text-destructive">
                      {errors.region.message}
                    </p>
                  )}
                </div>

                <FormField
                  id="university-capacity"
                  label="ظرفیت مصوب"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  error={errors.capacityApproved?.message}
                  {...register("capacityApproved", {
                    setValueAs: (value) =>
                      value === "" ? 0 : Number(value),
                  })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="university-parent">دانشگاه مادر</Label>

                <select
                  id="university-parent"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register("parentUniversityId", {
                    setValueAs: (value) =>
                      value === "" ? null : Number(value),
                  })}
                >
                  <option value="">بدون دانشگاه مادر</option>

                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>

                {errors.parentUniversityId?.message && (
                  <p className="text-xs text-destructive">
                    {errors.parentUniversityId.message}
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
                        id="university-active"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />

                      <Label
                        htmlFor="university-active"
                        className="font-normal"
                      >
                        دانشگاه فعال باشد
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
                disabled={isSubmitting || universityTypes.length === 0}
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                {isEdit ? "ذخیره تغییرات" : "ثبت دانشگاه"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
