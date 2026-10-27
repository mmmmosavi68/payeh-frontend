"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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
import { toLatinDigits } from "@/lib/digits";
import { createUser, updateUser } from "@/lib/mock/users";
import { MockApiError } from "@/lib/mock/utils";
import { roleKeys, type UserRecord } from "@/types/user";
import { createUserSchema, type UserFormValues } from "../schemas/user-schema";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRecord | null;
  onSaved: () => void;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
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
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

type UserFormProps = {
  user: UserRecord | null;
  onCancel: () => void;
  onSaved: () => void;
};

function UserForm({ user, onCancel, onSaved }: UserFormProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");
  const mode = user ? "edit" : "create";

  const schema = useMemo(
    () =>
      createUserSchema(
        {
          usernameFormat: t("form.validation.usernameFormat"),
          firstNameRequired: t("form.validation.firstNameRequired"),
          lastNameRequired: t("form.validation.lastNameRequired"),
          phoneInvalid: t("form.validation.phoneInvalid"),
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      password: "",
      roles: user?.roles ?? [],
      isActive: user?.isActive ?? true,
    },
  });

  async function onSubmit(values: UserFormValues) {
    const input = {
      username: values.username.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: toLatinDigits(values.phone.trim()),
      roles: values.roles,
      isActive: values.isActive,
    };

    try {
      if (user) {
        await updateUser(user.id, input);
        toast.success(t("toast.updated"));
      } else {
        await createUser({ ...input, password: values.password });
        toast.success(t("toast.created"));
      }
      onSaved();
    } catch (error) {
      if (error instanceof MockApiError && error.code === "username_taken") {
        setError("username", { message: t("form.usernameTaken") });
      } else {
        toast.error(tc("operationFailed"));
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
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

      <FormField
        id="user-phone"
        label={t("form.phone")}
        dir="ltr"
        inputMode="tel"
        autoComplete="off"
        error={errors.phone?.message}
        {...register("phone")}
      />

      {mode === "create" ? (
        <FormField
          id="user-password"
          label={t("form.password")}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
      ) : null}

      <Controller
        control={control}
        name="roles"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("form.roles")}
            </legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {roleKeys.map((role) => {
                const id = `user-role-${role}`;
                return (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={field.value.includes(role)}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked === true
                            ? [...field.value, role]
                            : field.value.filter((item) => item !== role),
                        )
                      }
                    />
                    <Label htmlFor={id} className="font-normal">
                      {tr(role)}
                    </Label>
                  </div>
                );
              })}
            </div>
            {errors.roles?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.roles.message}
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
        <Button type="submit" className="rounded-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}