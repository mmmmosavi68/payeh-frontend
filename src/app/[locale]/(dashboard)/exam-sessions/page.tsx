"use client";

import { useState } from "react";
import { CalendarClock, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { FormField } from "@/components/shared/form-field";
import { useRemoteData } from "@/hooks/use-remote-data";
import { Can } from "@/features/permissions/use-permission";

import {
  deleteExamSession,
  listExamSessions,
} from "@/features/exam-sessions/api";

import type {
  ExamSessionDto,
  ExamSessionFilters,
} from "@/features/exam-sessions/types";

import { ExamSessionsTable } from "@/features/exam-sessions/components/exam-sessions-table";
import { ExamSessionFormSheet } from "@/features/exam-sessions/components/exam-session-form-sheet";

export default function ExamSessionsPage() {
  const [filters, setFilters] = useState<ExamSessionFilters>({});
  const [searchText, setSearchText] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingExamSession, setEditingExamSession] =
    useState<ExamSessionDto | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ExamSessionDto | null>(null);

  const filterKey = JSON.stringify(filters);

  const {
    data,
    loading,
    failed,
    reload,
  } = useRemoteData(
    `exam-sessions-${filterKey}`,
    () => listExamSessions(filters),
  );

  const examSessions = data ?? [];

  function openCreate() {
    setEditingExamSession(null);
    setFormOpen(true);
  }

  function openEdit(item: ExamSessionDto) {
    setEditingExamSession(item);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteExamSession(deleteTarget.id);

      toast.success("نوبت آزمون با موفقیت حذف شد.");

      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "حذف نوبت آزمون ناموفق بود.",
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

  function handleStatusChange(value: string) {
    setFilters((current) => ({
      ...current,
      isActive:
        value === ""
          ? undefined
          : value === "active",
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت نوبت‌های آزمون
          </h1>

          <p className="text-sm text-muted-foreground">
            تعریف و مدیریت تاریخ و بازه‌های زمانی برگزاری آزمون‌ها.
          </p>
        </div>

        <Can controller="ExamSessions" action="Create">
          <Button
            onClick={openCreate}
            className="w-full rounded-full sm:w-auto"
          >
            <Plus className="size-4" />
            افزودن نوبت آزمون
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
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormField
            id="exam-session-search"
            label="عنوان نوبت"
            placeholder="جست‌وجوی عنوان نوبت"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="exam-session-status"
              className="text-sm font-medium"
            >
              وضعیت
            </label>

            <select
              id="exam-session-status"
              value={
                filters.isActive === undefined
                  ? ""
                  : filters.isActive
                    ? "active"
                    : "inactive"
              }
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
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
            در حال دریافت نوبت‌های آزمون...
          </p>
        </div>
      )}

      {!loading && failed && (
        <ErrorState
          title="دریافت نوبت‌های آزمون ناموفق بود"
          description="ارتباط با سرور برقرار نشد یا امکان دریافت اطلاعات وجود ندارد."
          onRetry={reload}
        />
      )}

      {!loading && !failed && examSessions.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              تعداد نتایج:{" "}
              <span className="font-semibold text-foreground">
                {examSessions.length.toLocaleString("fa-IR")}
              </span>
            </p>
          </div>

          <ExamSessionsTable
            examSessions={examSessions}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      {!loading && !failed && examSessions.length === 0 && (
        <EmptyState
          icon={<CalendarClock className="size-5" />}
          title="نوبتی پیدا نشد"
          description="هنوز نوبت آزمونی ثبت نشده است. برای شروع، نوبت جدیدی تعریف کنید."
          action={
            <Can controller="ExamSessions" action="Create">
              <Button onClick={openCreate} className="rounded-full">
                <Plus className="size-4" />
                ثبت نوبت جدید
              </Button>
            </Can>
          }
        />
      )}

      <ExamSessionFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        examSession={editingExamSession}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف نوبت آزمون"
        description={
          deleteTarget
            ? `آیا از حذف نوبت «${deleteTarget.title}» اطمینان دارید؟ اگر آزمونی به این نوبت متصل باشد، Backend اجازه حذف نخواهد داد.`
            : ""
        }
        confirmLabel="حذف نوبت"
        onConfirm={handleDelete}
      />
    </div>
  );
}