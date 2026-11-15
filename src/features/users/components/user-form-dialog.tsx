"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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

import {
  createUser,
  getCodeItems,
  updateUser,
  type CodeOption,
} from "../api";
import { userErrorText } from "../error-message";
import {
  createUserSchema,
  type UserCodeOptions,
  type UserFormValues,
} from "../schemas/user-schema";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRecord | null;
  roles: RoleInfo[] | undefined;
  rolesFailed: boolean;
  onRetryRoles: () => void;
  onSaved: () => void;
};

type CodeOptionsState = {
  gender: CodeOption[];
  maritalStatus: CodeOption[];
  religion: CodeOption[];
  leftHanded: CodeOption[];
  nationality: CodeOption[];
};

function dateValue(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function normalizeLeftHanded(value: number | null | undefined) {
  if (value == null || value === 0) {
    return "11";
  }

  return String(value);
}

function getCodeValues(items: CodeOption[]) {
  return items
    .filter(
      (item): item is CodeOption & { subCode: number } =>
        typeof item.subCode === "number" && item.subCode > 1,
    )
    .map((item) => String(item.subCode));
}

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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {user ? t("editTitle") : t("createTitle")}
          </DialogTitle>

          <DialogDescription>
            {user ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <UserForm
          key={user?.id ?? "new-user"}
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

  const [formError, setFormError] = useState<string | null>(null);

  const [codeOptions, setCodeOptions] =
    useState<CodeOptionsState | null>(null);

const [codesLoading, setCodesLoading] = useState(true);
const [codesFailed, setCodesFailed] = useState(false);
const [codesRetryCount, setCodesRetryCount] = useState(0);

useEffect(() => {
  let cancelled = false;

    async function load() {
      setCodesLoading(true);
      setCodesFailed(false);

      try {
        const [
          gender,
          maritalStatus,
          religion,
          leftHanded,
          nationality,
        ] = await Promise.all([
          getCodeItems(2),
          getCodeItems(1),
          getCodeItems(3),
          getCodeItems(5),
          getCodeItems(4),
        ]);

        const result: CodeOptionsState = {
          gender,
          maritalStatus,
          religion,
          leftHanded,
          nationality,
        };

        const hasEmptyList = Object.values(result).some(
          (items) => items.length === 0,
        );

        if (hasEmptyList) {
          throw new Error("One or more code groups are empty.");
        }

        if (!cancelled) {
          setCodeOptions(result);
          setCodesFailed(false);
        }
      } catch {
        if (!cancelled) {
          setCodeOptions(null);
          setCodesFailed(true);
        }
      } finally {
        if (!cancelled) {
          setCodesLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [codesRetryCount]);

  const schemaOptions = useMemo<UserCodeOptions>(
    () => ({
      gender: codeOptions ? getCodeValues(codeOptions.gender) : [],
      maritalStatus: codeOptions
        ? getCodeValues(codeOptions.maritalStatus)
        : [],
      religion: codeOptions
        ? getCodeValues(codeOptions.religion)
        : [],
      leftHanded: codeOptions
        ? getCodeValues(codeOptions.leftHanded)
        : [],
      nationality: codeOptions
        ? getCodeValues(codeOptions.nationality)
        : [],
    }),
    [codeOptions],
  );

  const schema = useMemo(
    () =>
      createUserSchema(
        {
          usernameFormat: t("form.validation.usernameFormat"),
          firstNameRequired: t("form.validation.firstNameRequired"),
          lastNameRequired: t("form.validation.lastNameRequired"),
          fatherNameRequired: t("form.validation.fatherNameRequired"),
          phoneInvalid: t("form.validation.phoneInvalid"),
          emailInvalid: t("form.validation.emailInvalid"),
          nationalCodeInvalid: t("form.validation.nationalCodeInvalid"),
          passwordMin: t("form.validation.passwordMin"),
          rolesRequired: t("form.validation.rolesRequired"),
          genderRequired: t("form.validation.genderRequired"),
          maritalStatusRequired: t("form.validation.maritalStatusRequired"),
          religionRequired: t("form.validation.religionRequired"),
          leftHandedRequired: t("form.validation.leftHandedRequired"),
          nationalityRequired: t("form.validation.nationalityRequired"),
          expireDateRequired: t("form.validation.expireDateRequired"),
        },
        schemaOptions,
      ),
    [t, schemaOptions],
  );

const {
  register,
  handleSubmit,
  control,
  setValue,
  formState: { errors, isSubmitting },
} = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.userName ?? "",

      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      fatherName: user?.fatherName ?? "",

      phone: user?.phone ?? "",
      email: user?.email ?? "",
      nationalCode: user?.nationalCode ?? "",

      gender:
        user?.gender != null
          ? String(user.gender)
          : "10",

      maritalStatus:
        user?.maritalStatus != null
          ? String(user.maritalStatus)
          : "10",

      religion:
        user?.religion != null
          ? String(user.religion)
          : "",

      leftHanded: normalizeLeftHanded(user?.leftHanded),

      nationality:
        user?.nationality != null
          ? String(user.nationality)
          : "",

      expireDate: dateValue(user?.expireDate),

      password: "",
      roleIds: user?.roles.map((role) => role.id) ?? [],
      isActive: user?.isActive ?? true,
    },
  });
useEffect(() => {
  if (!codeOptions) return;

  setValue(
    "gender",
    user?.gender != null ? String(user.gender) : "10",
  );

  setValue(
    "maritalStatus",
    user?.maritalStatus != null
      ? String(user.maritalStatus)
      : "10",
  );

  setValue(
    "religion",
    user?.religion != null ? String(user.religion) : "",
  );

  setValue(
    "leftHanded",
    normalizeLeftHanded(user?.leftHanded),
  );

  setValue(
    "nationality",
    user?.nationality != null
      ? String(user.nationality)
      : "",
  );
}, [codeOptions, user, setValue]);
  async function onSubmit(values: UserFormValues) {
    setFormError(null);

    const payload = {
      userName: values.username.trim(),

      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      fatherName: values.fatherName.trim(),

      phone: normalizeMobile(values.phone),
      email: values.email.trim(),

      nationalCode: toLatinDigits(values.nationalCode.trim()),

      gender: Number(values.gender),
      maritalStatus: Number(values.maritalStatus),
      religion: Number(values.religion),
      leftHanded: Number(values.leftHanded),
      nationality: Number(values.nationality),

      expireDate: values.expireDate,

      password: values.password,
      roleIds: values.roleIds,
      isActive: values.isActive,
    };

    try {
      if (user) {
        await updateUser(user.id, payload);
        toast.success(t("toast.updated"));
      } else {
        await createUser(payload);
        toast.success(t("toast.created"));
      }

      onSaved();
    } catch (error) {
      setFormError(userErrorText(error, tRoot));
    }
  }

  const selectClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const codeSelectDisabled =
    codesLoading || codesFailed || !codeOptions;

  function renderCodeOptions(items: CodeOption[] | undefined) {
    return (
      <>
        <option value="" disabled>
          {codesLoading ? "در حال دریافت اطلاعات..." : "انتخاب کنید"}
        </option>

        {items?.map((item) => (
          <option
            key={item.id}
            value={String(item.subCode)}
          >
            {item.title}
          </option>
        ))}
      </>
    );
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

      {codesFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <span>
            دریافت اطلاعات پایه با خطا مواجه شد. امکان ذخیره فرم وجود ندارد.
          </span>

          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setCodesRetryCount((count) => count + 1)}
          >
            {tc("retry")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="user-username"
          label={t("form.username")}
          dir="ltr"
          autoComplete="off"
          error={errors.username?.message}
          {...register("username")}
        />

        <FormField
          id="user-national-code"
          label={t("form.nationalCode")}
          dir="ltr"
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          error={errors.nationalCode?.message}
          {...register("nationalCode")}
        />
      </div>

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
          id="user-father-name"
          label={t("form.fatherName")}
          error={errors.fatherName?.message}
          {...register("fatherName")}
        />

        <FormField
          id="user-phone"
          label={t("form.phone")}
          dir="ltr"
          inputMode="tel"
          autoComplete="off"
          error={errors.phone?.message}
          {...register("phone")}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-gender">
            {t("form.gender")}
          </Label>

          <select
            id="user-gender"
            className={selectClass}
            disabled={codeSelectDisabled}
            {...register("gender")}
          >
            {renderCodeOptions(codeOptions?.gender)}
          </select>

          {errors.gender?.message ? (
            <p className="text-xs text-destructive">
              {errors.gender.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="user-marital-status">
            {t("form.maritalStatus")}
          </Label>

          <select
            id="user-marital-status"
            className={selectClass}
            disabled={codeSelectDisabled}
            {...register("maritalStatus")}
          >
            {renderCodeOptions(codeOptions?.maritalStatus)}
          </select>

          {errors.maritalStatus?.message ? (
            <p className="text-xs text-destructive">
              {errors.maritalStatus.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-religion">
            {t("form.religion")}
          </Label>

          <select
            id="user-religion"
            className={selectClass}
            disabled={codeSelectDisabled}
            {...register("religion")}
          >
            {renderCodeOptions(codeOptions?.religion)}
          </select>

          {errors.religion?.message ? (
            <p className="text-xs text-destructive">
              {errors.religion.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="user-left-handed">
            {t("form.leftHanded")}
          </Label>

          <select
            id="user-left-handed"
            className={selectClass}
            disabled={codeSelectDisabled}
            {...register("leftHanded")}
          >
            {renderCodeOptions(codeOptions?.leftHanded)}
          </select>

          {errors.leftHanded?.message ? (
            <p className="text-xs text-destructive">
              {errors.leftHanded.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-nationality">
            {t("form.nationality")}
          </Label>

          <select
            id="user-nationality"
            className={selectClass}
            disabled={codeSelectDisabled}
            {...register("nationality")}
          >
            {renderCodeOptions(codeOptions?.nationality)}
          </select>

          {errors.nationality?.message ? (
            <p className="text-xs text-destructive">
              {errors.nationality.message}
            </p>
          ) : null}
        </div>

        <FormField
          id="user-expire-date"
          label={t("form.expireDate")}
          type="date"
          error={errors.expireDate?.message}
          {...register("expireDate")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <FormField
          id="user-password"
          label={user ? t("form.passwordNew") : t("form.password")}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <p className="text-xs text-muted-foreground">
          {user
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
                    <div
                      key={role.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={id}
                        checked={field.value.includes(role.id)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked === true
                              ? [...field.value, role.id]
                              : field.value.filter(
                                  (item) => item !== role.id,
                                ),
                          )
                        }
                      />

                      <Label htmlFor={id} className="font-normal">
                        {locale === "fa"
                          ? role.nameFa
                          : role.nameEn}
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
              onCheckedChange={(checked) =>
                field.onChange(checked === true)
              }
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
          disabled={
            isSubmitting ||
            !roles ||
            codesLoading ||
            codesFailed ||
            !codeOptions
          }
        >
          {isSubmitting ? (
            <Loader2
              className="size-4 animate-spin"
              aria-hidden
            />
          ) : null}

          {tc("save")}
        </Button>
      </div>
    </form>
  );
}