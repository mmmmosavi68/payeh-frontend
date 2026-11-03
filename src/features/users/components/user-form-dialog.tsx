"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeMobile, toLatinDigits } from "@/lib/digits";
import type { RoleInfo, UserRecord } from "@/types/user";
import { createUser, updateUser } from "../api";
import { userErrorText } from "../error-message";
import { createUserSchema, type UserFormValues } from "../schemas/user-schema";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRecord | null;
  roles: RoleInfo[] | undefined;
  rolesFailed: boolean;
  onRetryRoles: () => void;
  onSaved: () => void;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  rolesFailed,
  onRetryRoles,
  onSaved,
}: UserFormDialogProps) {
  const t = useTranslations("users.form");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {user ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          user={user}
          roles={roles}
          rolesFailed={rolesFailed}
          onRetryRoles={onRetryRoles}
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

type UserFormProps = {
  user: UserRecord | null;
  roles: RoleInfo[] | undefined;
  rolesFailed: boolean;
  onRetryRoles: () => void;
  onCancel: () => void;
  onSaved: () => void;
};

function UserForm({
  user,
  roles,
  rolesFailed,
  onRetryRoles,
  onCancel,
  onSaved,
}: UserFormProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const tRoot = useTranslations();
  const locale = useLocale();
  const mode = user ? "edit" : "create";
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      createUserSchema(
        {
          usernameFormat: t("form.validation.usernameFormat"),
          firstNameRequired: t("form.validation.firstNameRequired"),
          lastNameRequired: t("form.validation.lastNameRequired"),
          phoneInvalid: t("form.validation.phoneInvalid"),
          emailInvalid: t("form.validation.emailInvalid"),
          nationalCodeInvalid: t("form.validation.nationalCodeInvalid"),
          passwordMin: t("form.validation.passwordMin"),
          rolesRequired: t("form.validation.rolesRequired"),
        },
        mode,
      ),
    [t, mode],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.userName ?? "",
      nationalCode: user?.nationalCode ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      password: "",
      roleIds: user?.roles.map((role) => role.id) ?? [],
      isActive: user?.isActive ?? true,
    },
  });

  async function onSubmit(values: UserFormValues) {
    setFormError(null);

    const common = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: normalizeMobile(values.phone),
      email: values.email.trim(),
      password: values.password,
      roleIds: values.roleIds,
      isActive: values.isActive,
    };

    try {
      if (user) {
        await updateUser(user.id, common);
        toast.success(t("toast.updated"));
      } else {
        await createUser({
          ...common,
          userName: values.username.trim(),
          nationalCode: toLatinDigits(values.nationalCode.trim()),
        });
        toast.success(t("toast.created"));
      }
      onSaved();
    } catch (error) {
      setFormError(userErrorText(error, tRoot));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <FormField
        id="user-username"
        label={t("form.username")}
        dir="ltr"
        autoComplete="off"
        readOnly={mode === "edit"}
        error={errors.username?.message}
        {...register("username")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="user-first-name"
          label={t("form.firstName")}
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <FormField
          id="user-last-name"
          label={t("form.lastName")}
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="user-phone"
          label={t("form.phone")}
          dir="ltr"
          inputMode="tel"
          autoComplete="off"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <FormField
          id="user-national-code"
          label={t("form.nationalCode")}
          dir="ltr"
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          readOnly={mode === "edit"}
          error={errors.nationalCode?.message}
          {...register("nationalCode")}
        />
      </div>

      <FormField
        id="user-email"
        label={t("form.email")}
        type="email"
        dir="ltr"
        autoComplete="off"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="flex flex-col gap-1">
        <FormField
          id="user-password"
          label={mode === "edit" ? t("form.passwordNew") : t("form.password")}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <p className="text-xs text-muted-foreground">
          {mode === "edit"
            ? t("form.passwordHintEdit")
            : t("form.passwordHintCreate")}
        </p>
      </div>

      <Controller
        control={control}
        name="roleIds"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("form.roles")}
            </legend>

            {roles ? (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {roles.map((role) => {
                  const id = `user-role-${role.id}`;
                  return (
                    <div key={role.id} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={field.value.includes(role.id)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked === true
                              ? [...field.value, role.id]
                              : field.value.filter((item) => item !== role.id),
                          )
                        }
                      />
                      <Label htmlFor={id} className="font-normal">
                        {locale === "fa" ? role.nameFa : role.nameEn}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : rolesFailed ? (
              <p className="flex items-center gap-2 text-sm text-destructive">
                {t("form.rolesFailed")}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={onRetryRoles}
                >
                  {tc("retry")}
                </Button>
              </p>
            ) : (
              <Skeleton className="h-5 w-48" />
            )}

            {errors.roleIds?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.roleIds.message}
              </p>
            ) : null}
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="user-active"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <Label htmlFor="user-active" className="font-normal">
              {t("form.isActive")}
            </Label>
          </div>
        )}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          {tc("cancel")}
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={isSubmitting || !roles}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}