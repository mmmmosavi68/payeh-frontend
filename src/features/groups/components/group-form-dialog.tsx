
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createGroup, updateGroup } from "../api";
import { groupSchema, type GroupFormInput } from "../schemas/group-schema";
import type { GroupDto } from "../types";

type GroupFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupDto | null;
  onSaved: () => void;
};

export function GroupFormDialog({
  open,
  onOpenChange,
  group,
  onSaved,
}: GroupFormDialogProps) {
  const editing = group !== null;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      groupName: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    reset({
      groupName: group?.groupName ?? "",
      isActive: group?.isActive ?? true,
    });
    setFormError(null);
  }, [group, open, reset]);

  async function onSubmit(values: GroupFormInput) {
    setFormError(null);

    try {
      const payload = {
        groupName: values.groupName.trim(),
        isActive: values.isActive,
      };

      if (group) {
        await updateGroup(group.id, payload);
        toast.success("گروه با موفقیت ویرایش شد.");
      } else {
        await createGroup(payload);
        toast.success("گروه با موفقیت ایجاد شد.");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "عملیات ذخیره گروه ناموفق بود.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "ویرایش گروه کاربری" : "ایجاد گروه کاربری"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "اطلاعات گروه کاربری را ویرایش کنید."
              : "اطلاعات گروه کاربری جدید را وارد کنید."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
        >
          {formError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="group-name">عنوان گروه</Label>
            <Input
              id="group-name"
              placeholder="مثلاً مدیران سامانه"
              maxLength={100}
              autoFocus
              {...register("groupName")}
              aria-invalid={Boolean(errors.groupName)}
            />
            {errors.groupName?.message ? (
              <p className="text-xs text-destructive">
                {errors.groupName.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="group-active"
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked === true, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <Label htmlFor="group-active" className="font-normal">
              گروه فعال باشد
            </Label>
          </div>

          <div className="mt-1 flex justify-end gap-2">
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
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              ذخیره
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
