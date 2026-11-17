"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { createExam, updateExam } from "../api";

import type {
  CreateExamDto,
  ExamDto,
  ExamSessionOption,
} from "../types";

import type { ExamCodeOption } from "../options";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamDto | null;
  sessions: ExamSessionOption[];
  examTypes: ExamCodeOption[];
  examModes: ExamCodeOption[];
  onSaved: () => void;
};

type FormValues = {
  title: string;
  examSessionId: string;
  examTypeId: number;
  examModeId: number;
  registrationStartDate: string;
  registrationEndDate: string;
  editStartDate: string;
  editEndDate: string;
  description: string;
  isActive: boolean;
};

const emptyValues: FormValues = {
  title: "",
  examSessionId: "",
  examTypeId: 0,
  examModeId: 0,
  registrationStartDate: "",
  registrationEndDate: "",
  editStartDate: "",
  editEndDate: "",
  description: "",
  isActive: true,
};

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ExamFormSheet({
  open,
  onOpenChange,
  exam,
  sessions,
  examTypes,
  examModes,
  onSaved,
}: Props) {
  const isEdit = exam !== null;

  const [values, setValues] = useState<FormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setError(null);

    if (!exam) {
      setValues(emptyValues);
      return;
    }

    setValues({
      title: exam.title,
      examSessionId: exam.examSessionId,
      examTypeId: exam.examTypeId,
      examModeId: exam.examModeId,
      registrationStartDate: toLocalInput(exam.registrationStartDate),
      registrationEndDate: toLocalInput(exam.registrationEndDate),
      editStartDate: toLocalInput(exam.editStartDate),
      editEndDate: toLocalInput(exam.editEndDate),
      description: exam.description ?? "",
      isActive: exam.isActive,
    });
  }, [open, exam]);

  function setField<K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("عنوان آزمون را وارد کنید.");
      return;
    }

    if (!values.examSessionId) {
      setError("نوبت برگزاری آزمون را انتخاب کنید.");
      return;
    }

    if (!values.examTypeId || !values.examModeId) {
      setError("نوع آزمون و نحوه برگزاری را انتخاب کنید.");
      return;
    }

    if (!values.registrationStartDate || !values.registrationEndDate) {
      setError("تاریخ شروع و پایان ثبت‌نام الزامی است.");
      return;
    }

    if (
      new Date(values.registrationEndDate) <
      new Date(values.registrationStartDate)
    ) {
      setError("پایان ثبت‌نام نمی‌تواند قبل از شروع آن باشد.");
      return;
    }

    if (Boolean(values.editStartDate) !== Boolean(values.editEndDate)) {
      setError("برای بازه ویرایش، هر دو تاریخ شروع و پایان را وارد کنید.");
      return;
    }

    if (
      values.editStartDate &&
      values.editEndDate &&
      new Date(values.editEndDate) < new Date(values.editStartDate)
    ) {
      setError("پایان ویرایش نمی‌تواند قبل از شروع آن باشد.");
      return;
    }

    const payload: CreateExamDto = {
      title: values.title.trim(),
      examSessionId: values.examSessionId,
      examTypeId: values.examTypeId,
      examModeId: values.examModeId,
      registrationStartDate: new Date(values.registrationStartDate).toISOString(),
      registrationEndDate: new Date(values.registrationEndDate).toISOString(),
      editStartDate: values.editStartDate
        ? new Date(values.editStartDate).toISOString()
        : null,
      editEndDate: values.editEndDate
        ? new Date(values.editEndDate).toISOString()
        : null,
      description: values.description.trim() || null,
    };

    setSubmitting(true);

    try {
      if (exam) {
        await updateExam(exam.id, {
          ...payload,
          isActive: values.isActive,
        });
        toast.success("آزمون با موفقیت ویرایش شد.");
      } else {
        await createExam(payload);
        toast.success("آزمون با موفقیت ثبت شد.");
      }

      onOpenChange(false);
      onSaved();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "ذخیره آزمون ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const sessionOptionsReady = sessions.length > 0;
  const codeOptionsReady = examTypes.length > 0 && examModes.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 pe-14">
          <SheetTitle>
            {isEdit ? "ویرایش آزمون" : "تعریف آزمون جدید"}
          </SheetTitle>
          <SheetDescription>
            اطلاعات آزمون و بازه‌های ثبت‌نام را مشخص کنید.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {!sessionOptionsReady && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                ابتدا حداقل یک نوبت آزمون در بخش مدیریت نوبت‌ها ثبت کنید.
              </div>
            )}

            {!codeOptionsReady && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                گروه‌های «نوع آزمون» و «نحوه برگزاری» باید در اطلاعات پایه تعریف شده باشند.
              </div>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">اطلاعات اصلی</h3>

              <FormField
                id="exam-title"
                label="عنوان آزمون"
                placeholder="عنوان آزمون را وارد کنید"
                maxLength={200}
                value={values.title}
                onChange={(event) => setField("title", event.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="exam-session" className="text-sm font-medium">
                    نوبت برگزاری
                  </label>
                  <select
                    id="exam-session"
                    value={values.examSessionId}
                    onChange={(event) => setField("examSessionId", event.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">انتخاب نوبت</option>
                    {sessions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} - {new Date(item.examDate).toLocaleDateString("fa-IR")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="exam-type" className="text-sm font-medium">
                    نوع آزمون
                  </label>
                  <select
                    id="exam-type"
                    value={values.examTypeId}
                    onChange={(event) => setField("examTypeId", Number(event.target.value))}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value={0}>انتخاب نوع آزمون</option>
                    {examTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label htmlFor="exam-mode" className="text-sm font-medium">
                    نحوه برگزاری
                  </label>
                  <select
                    id="exam-mode"
                    value={values.examModeId}
                    onChange={(event) => setField("examModeId", Number(event.target.value))}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value={0}>انتخاب نحوه برگزاری</option>
                    {examModes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-5">
              <h3 className="text-sm font-semibold">بازه ثبت‌نام</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="registration-start"
                  label="شروع ثبت‌نام"
                  type="datetime-local"
                  value={values.registrationStartDate}
                  onChange={(event) => setField("registrationStartDate", event.target.value)}
                />

                <FormField
                  id="registration-end"
                  label="پایان ثبت‌نام"
                  type="datetime-local"
                  value={values.registrationEndDate}
                  onChange={(event) => setField("registrationEndDate", event.target.value)}
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-5">
              <h3 className="text-sm font-semibold">بازه ویرایش اطلاعات (اختیاری)</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="edit-start"
                  label="شروع ویرایش"
                  type="datetime-local"
                  value={values.editStartDate}
                  onChange={(event) => setField("editStartDate", event.target.value)}
                />

                <FormField
                  id="edit-end"
                  label="پایان ویرایش"
                  type="datetime-local"
                  value={values.editEndDate}
                  onChange={(event) => setField("editEndDate", event.target.value)}
                />
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <h3 className="text-sm font-semibold">توضیحات</h3>
              <textarea
                value={values.description}
                onChange={(event) => setField("description", event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="توضیحات تکمیلی آزمون..."
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />

              {isEdit && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.isActive}
                    onChange={(event) => setField("isActive", event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  آزمون فعال باشد
                </label>
              )}
            </section>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>

              <Button
                type="submit"
                className="rounded-full"
                disabled={
                  submitting ||
                  !sessionOptionsReady ||
                  !codeOptionsReady
                }
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "ذخیره تغییرات" : "ثبت آزمون"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}