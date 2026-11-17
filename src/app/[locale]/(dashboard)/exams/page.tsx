"use client";

import { useState } from "react";
import { ClipboardList, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { FormField } from "@/components/shared/form-field";
import { useRemoteData } from "@/hooks/use-remote-data";
import { Can } from "@/features/permissions/use-permission";

import {
  deleteExam,
  listExams,
  listExamSessions,
} from "@/features/exams/api";

import { getExamOptions } from "@/features/exams/options";

import type {
  ExamDto,
  ExamFilters,
  ExamSessionOption,
} from "@/features/exams/types";

import { ExamFormSheet } from "@/features/exams/components/exam-form-sheet";

export default function ExamsPage() {
  const [filters, setFilters] = useState<ExamFilters>({});
  const [searchText, setSearchText] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamDto | null>(null);

  const filterKey = JSON.stringify(filters);

  const {
    data: exams,
    loading,
    failed,
    reload,
  } = useRemoteData(
    `exams-${filterKey}`,
    () => listExams(filters),
  );

  const {
    data: sessions,
  } = useRemoteData<ExamSessionOption[]>(
    "exam-session-options",
    listExamSessions,
  );

  const {
    data: options,
  } = useRemoteData(
    "exam-code-options",
    getExamOptions,
  );

  function openCreate() {
    setEditingExam(null);
    setFormOpen(true);
  }

  function openEdit(exam: ExamDto) {
    setEditingExam(exam);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteExam(deleteTarget.id);
      toast.success("آزمون با موفقیت حذف شد.");
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حذف آزمون ناموفق بود.",
      );
    }
  }

  function handleSaved() {
    reload();
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFilters((current) => ({
      ...current,
      search: searchText.trim() || undefined,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت آزمون‌ها
          </h1>
          <p className="text-sm text-muted-foreground">
            تعریف و مدیریت آزمون‌ها، نوبت برگزاری و بازه‌های ثبت‌نام.
          </p>
        </div>

        <Can controller="Exams" action="Create">
          <Button onClick={openCreate} className="rounded-full">
            <Plus className="size-4" />
            تعریف آزمون جدید
          </Button>
        </Can>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="size-4 text-muted-foreground" />
          جست‌وجو و فیلتر
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormField
            id="exam-search"
            label="عنوان آزمون"
            placeholder="جست‌وجوی عنوان"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="exam-session-filter" className="text-sm font-medium">
              نوبت برگزاری
            </label>
            <select
              id="exam-session-filter"
              value={filters.examSessionId ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  examSessionId: event.target.value || undefined,
                }))
              }
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">همه نوبت‌ها</option>
              {(sessions ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="exam-type-filter" className="text-sm font-medium">
              نوع آزمون
            </label>
            <select
              id="exam-type-filter"
              value={filters.examTypeId ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  examTypeId: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                }))
              }
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">همه انواع</option>
              {(options?.examTypes ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="exam-status-filter" className="text-sm font-medium">
              وضعیت
            </label>
            <select
              id="exam-status-filter"
              value={
                filters.isActive === undefined
                  ? ""
                  : filters.isActive
                    ? "active"
                    : "inactive"
              }
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  isActive:
                    event.target.value === ""
                      ? undefined
                      : event.target.value === "active",
                }))
              }
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit" className="rounded-full">
              <Search className="size-4" />
              جست‌وجو
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSearchText("");
                setFilters({});
              }}
            >
              پاک‌کردن فیلترها
            </Button>
          </div>
        </form>
      </section>

      {loading && (
        <div className="rounded-2xl border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            در حال دریافت آزمون‌ها...
          </p>
        </div>
      )}

      {!loading && failed && (
        <ErrorState
          title="دریافت آزمون‌ها ناموفق بود"
          description="ارتباط با سرور برقرار نشد."
          onRetry={reload}
        />
      )}

      {!loading && !failed && (exams?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-right text-muted-foreground">
                  <th className="px-4 py-3 font-medium">عنوان آزمون</th>
                  <th className="px-4 py-3 font-medium">نوبت</th>
                  <th className="px-4 py-3 font-medium">نوع آزمون</th>
                  <th className="px-4 py-3 font-medium">نحوه برگزاری</th>
                  <th className="px-4 py-3 font-medium">شروع ثبت‌نام</th>
                  <th className="px-4 py-3 font-medium">پایان ثبت‌نام</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-center font-medium">عملیات</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {exams!.map((exam) => (
                  <tr key={exam.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{exam.title}</td>
                    <td className="px-4 py-3">{exam.examSessionTitle || "—"}</td>
                    <td className="px-4 py-3">{exam.examTypeTitle || "—"}</td>
                    <td className="px-4 py-3">{exam.examModeTitle || "—"}</td>
                    <td className="px-4 py-3">
                      {new Date(exam.registrationStartDate).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(exam.registrationEndDate).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      {exam.isActive ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                          فعال
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Can controller="Exams" action="Update">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="ویرایش"
                            onClick={() => openEdit(exam)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </Can>
                        <Can controller="Exams" action="Delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            title="حذف"
                            onClick={() => setDeleteTarget(exam)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !failed && exams?.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="آزمونی ثبت نشده است"
          description="برای شروع، آزمون جدید تعریف کنید."
          action={
            <Can controller="Exams" action="Create">
              <Button onClick={openCreate} className="rounded-full">
                <Plus className="size-4" />
                تعریف آزمون جدید
              </Button>
            </Can>
          }
        />
      )}

      <ExamFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        exam={editingExam}
        sessions={sessions ?? []}
        examTypes={options?.examTypes ?? []}
        examModes={options?.examModes ?? []}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف آزمون"
        description={
          deleteTarget
            ? `آیا از حذف آزمون «${deleteTarget.title}» مطمئن هستید؟ در صورت وجود ظرفیت یا ثبت‌نام، امکان حذف وجود ندارد.`
            : ""
        }
        confirmLabel="حذف آزمون"
        onConfirm={handleDelete}
      />
    </div>
  );
}