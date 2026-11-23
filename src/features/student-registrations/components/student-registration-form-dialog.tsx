
"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createExamRegistration,
  getExamRegistration,
  getExamRegistrationOptions,
  updateExamRegistration,
} from "../api";

import type {
  CreateExamRegistrationInput,
  UpdateExamRegistrationInput,
} from "../api";
import type {
  ExamRegistrationCapacityOptionDto,
  ExamRegistrationOptionsDto,
} from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  universityId: number;
  registrationId?: string | null;
  onSaved: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  fatherName: string;
  nationalCode: string;
  genderId: string;
  birthCertificateNumber: string;
  birthDate: string;
  studentNumber: string;
  entryYear: string;
  phoneNumber: string;
  emergencyPhoneNumber: string;
  capacityId: string;
}

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  fatherName: "",
  nationalCode: "",
  genderId: "",
  birthCertificateNumber: "",
  birthDate: "",
  studentNumber: "",
  entryYear: "",
  phoneNumber: "",
  emergencyPhoneNumber: "",
  capacityId: "",
};

const selectContentProps = {
  position: "popper" as const,
  align: "start" as const,
  sideOffset: 6,
  className: "max-h-72 w-[var(--radix-select-trigger-width)]",
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

export function StudentRegistrationFormDialog({
  open,
  onOpenChange,
  examId,
  universityId,
  registrationId,
  onSaved,
}: Props) {
  const isEdit = !!registrationId;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [options, setOptions] = useState<ExamRegistrationOptionsDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setOptions(null);
      setForm(emptyForm);

      try {
        const [registrationOptions, registration] = await Promise.all([
          getExamRegistrationOptions(examId, universityId),
          registrationId
            ? getExamRegistration(registrationId)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setOptions(registrationOptions);

        if (registration) {
          setForm({
            firstName: registration.firstName,
            lastName: registration.lastName,
            fatherName: registration.fatherName ?? "",
            nationalCode: registration.nationalCode,
            genderId:
              registration.genderId != null
                ? String(registration.genderId)
                : "",
            birthCertificateNumber:
              registration.birthCertificateNumber ?? "",
            birthDate: registration.birthDate
              ? registration.birthDate.substring(0, 10)
              : "",
            studentNumber: registration.studentNumber ?? "",
            entryYear:
              registration.entryYear != null
                ? String(registration.entryYear)
                : "",
            phoneNumber: registration.phoneNumber ?? "",
            emergencyPhoneNumber:
              registration.emergencyPhoneNumber ?? "",
            capacityId: registration.universityExamCapacityId,
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error && error.message
              ? error.message
              : "دریافت اطلاعات فرم ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [open, examId, universityId, registrationId]);

  const selectedCapacity: ExamRegistrationCapacityOptionDto | undefined =
    options?.capacities.find(
      (item) => item.universityExamCapacityId === form.capacityId,
    );

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCapacity) {
      toast.error("دانشگاه محل آزمون و ظرفیت آن را انتخاب کنید.");
      return;
    }

    if (!/^\d{10}$/.test(form.nationalCode.trim())) {
      toast.error("کد ملی باید دقیقاً ۱۰ رقم باشد.");
      return;
    }

    const commonData = {
      universityId,
      examVenueUniversityId: selectedCapacity.examVenueUniversityId,
      universityExamCapacityId: selectedCapacity.universityExamCapacityId,
      universityExamGuestCapacityId:
        selectedCapacity.universityExamGuestCapacityId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fatherName: toNullable(form.fatherName),
      nationalCode: form.nationalCode.trim(),
      genderId: form.genderId ? Number(form.genderId) : null,
      birthCertificateNumber: toNullable(form.birthCertificateNumber),
      birthDate: form.birthDate || null,
      studentNumber: toNullable(form.studentNumber),
      entryYear: form.entryYear ? Number(form.entryYear) : null,
      phoneNumber: toNullable(form.phoneNumber),
      emergencyPhoneNumber: toNullable(form.emergencyPhoneNumber),
      customFieldValues: [],
    };

    setSaving(true);

    try {
      if (registrationId) {
        const input: UpdateExamRegistrationInput = commonData;
        await updateExamRegistration(registrationId, input);
        toast.success("اطلاعات داوطلب با موفقیت ویرایش شد.");
      } else {
        const input: CreateExamRegistrationInput = {
          ...commonData,
          examId,
        };
        await createExamRegistration(input);
        toast.success("داوطلب با موفقیت ثبت‌نام شد.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "ذخیره اطلاعات داوطلب ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "ویرایش اطلاعات داوطلب" : "ثبت‌نام داوطلب جدید"}
          </DialogTitle>
          <DialogDescription>
            اطلاعات داوطلب و دانشگاه محل برگزاری آزمون را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : !options ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            دریافت اطلاعات فرم امکان‌پذیر نبود. پنجره را ببندید و دوباره تلاش کنید.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="نام" required>
                <Input
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  maxLength={50}
                  required
                  disabled={saving}
                />
              </Field>

              <Field label="نام خانوادگی" required>
                <Input
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  maxLength={50}
                  required
                  disabled={saving}
                />
              </Field>

              <Field label="نام پدر">
                <Input
                  value={form.fatherName}
                  onChange={(e) => updateField("fatherName", e.target.value)}
                  maxLength={50}
                  disabled={saving}
                />
              </Field>

              <Field label="کد ملی" required>
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  value={form.nationalCode}
                  onChange={(e) =>
                    updateField(
                      "nationalCode",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  maxLength={10}
                  required
                  disabled={saving}
                />
              </Field>

              <Field label="جنسیت">
                <Select
                  value={form.genderId}
                  onValueChange={(value) => updateField("genderId", value)}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب جنسیت" />
                  </SelectTrigger>
                  <SelectContent {...selectContentProps}>
                    <SelectItem value="34">مرد</SelectItem>
                    <SelectItem value="35">زن</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="شماره شناسنامه">
                <Input
                  value={form.birthCertificateNumber}
                  onChange={(e) =>
                    updateField("birthCertificateNumber", e.target.value)
                  }
                  maxLength={20}
                  disabled={saving}
                />
              </Field>

              <Field label="تاریخ تولد">
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                  disabled={saving}
                />
              </Field>

              <Field label="شماره دانشجویی">
                <Input
                  value={form.studentNumber}
                  onChange={(e) =>
                    updateField("studentNumber", e.target.value)
                  }
                  maxLength={30}
                  disabled={saving}
                />
              </Field>

              <Field label="سال ورود">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1300}
                  max={1500}
                  value={form.entryYear}
                  onChange={(e) => updateField("entryYear", e.target.value)}
                  disabled={saving}
                />
              </Field>

              <Field label="شماره تماس">
                <Input
                  dir="ltr"
                  inputMode="tel"
                  value={form.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  maxLength={20}
                  disabled={saving}
                />
              </Field>

              <Field label="شماره تماس اضطراری">
                <Input
                  dir="ltr"
                  inputMode="tel"
                  value={form.emergencyPhoneNumber}
                  onChange={(e) =>
                    updateField("emergencyPhoneNumber", e.target.value)
                  }
                  maxLength={20}
                  disabled={saving}
                />
              </Field>
            </section>

            <section className="space-y-2 rounded-lg border p-3">
              <h3 className="text-sm font-semibold">
                دانشگاه محل برگزاری آزمون
              </h3>

              <Select
                value={form.capacityId}
                onValueChange={(value) => updateField("capacityId", value)}
                disabled={saving || options.capacities.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="دانشگاه محل آزمون را انتخاب کنید" />
                </SelectTrigger>

                <SelectContent {...selectContentProps}>
                  {options.capacities.map((capacity) => (
                    <SelectItem
                      key={capacity.universityExamCapacityId}
                      value={capacity.universityExamCapacityId}
                    >
                      {capacity.examVenueUniversityTitle}
                      {capacity.isOwnUniversity ? " (دانشگاه اصلی)" : " (مهمان)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCapacity && (
                <p className="text-xs text-muted-foreground">
                  {selectedCapacity.isOwnUniversity
                    ? "ظرفیت دانشگاه اصلی انتخاب شده است."
                    : `ظرفیت مهمان: ${selectedCapacity.guestCapacity ?? "—"}`}
                </p>
              )}

              {options.capacities.length === 0 && (
                <p className="text-xs text-destructive">
                  برای این دانشگاه، ظرفیت قابل انتخابی تعریف نشده است.
                </p>
              )}
            </section>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                انصراف
              </Button>

              <Button
                type="submit"
                disabled={saving || options.capacities.length === 0}
              >
                {saving ? (
                  <Loader2 className="me-2 size-4 animate-spin" />
                ) : (
                  <Save className="me-2 size-4" />
                )}
                {saving ? "در حال ذخیره..." : "ذخیره اطلاعات"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
