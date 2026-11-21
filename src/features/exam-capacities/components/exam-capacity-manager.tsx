"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, Clock, Pencil, Save, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/data-states";
import { useRemoteData } from "@/hooks/use-remote-data";

import {
  listMyCapacityUniversities,
  listUniversityActiveExams,
  saveUniversityExamCapacity,
} from "../api";

import type { UniversityExamCapacityExamDto } from "../types";

const fa = (n: number) => n.toLocaleString("fa-IR");

const isElectronic = (exam?: UniversityExamCapacityExamDto) =>
  !!exam?.examModeTitle?.includes("الکترونیک");

/** لیست سلکت‌ها: زیر باکس باز شود و هم‌عرض آن باشد */
const selectContentProps = {
  position: "popper" as const,
  align: "start" as const,
  sideOffset: 6,
  className: "max-h-72 w-[var(--radix-select-trigger-width)]",
};

export function ExamCapacityManager() {
  const {
    data: universities,
    loading: universitiesLoading,
    failed: universitiesFailed,
    reload: reloadUniversities,
  } = useRemoteData("capacity-universities", listMyCapacityUniversities);

  const [universityId, setUniversityId] = useState("");

  const selectedUniversity = useMemo(
    () => universities?.find((item) => String(item.id) === universityId),
    [universities, universityId],
  );

  useEffect(() => {
    if (!universities?.length) return;

    if (universities.length === 1) {
      setUniversityId(String(universities[0].id));
    } else if (
      universityId &&
      !universities.some((item) => String(item.id) === universityId)
    ) {
      setUniversityId("");
    }
  }, [universities, universityId]);

  const {
    data: exams,
    loading: examsLoading,
    failed: examsFailed,
    reload: reloadExams,
  } = useRemoteData(`capacity-exams-${universityId}`, () =>
    universityId
      ? listUniversityActiveExams(Number(universityId))
      : Promise.resolve([]),
  );

  const definedExams = useMemo(
    () => exams?.filter((item) => item.isCapacityDefined) ?? [],
    [exams],
  );

  const availableExams = useMemo(
    () => exams?.filter((item) => !item.isCapacityDefined) ?? [],
    [exams],
  );

  const [examId, setExamId] = useState("");
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [allocatedCapacity, setAllocatedCapacity] = useState("");
  const [ownCapacity, setOwnCapacity] = useState("");
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  const selectedExam = useMemo(
    () =>
      examsLoading
        ? undefined
        : exams?.find((item) => item.examId === (editingExamId ?? examId)),
    [exams, examsLoading, editingExamId, examId],
  );

  useEffect(() => {
    if (!exams || editingExamId) return;

    if (!availableExams.length) {
      setExamId("");
      return;
    }

    if (!examId || !availableExams.some((item) => item.examId === examId)) {
      setExamId(availableExams[0].examId);
    }
  }, [exams, availableExams, examId, editingExamId]);

  useEffect(() => {
    if (!selectedExam) {
      setAllocatedCapacity("");
      setOwnCapacity("");
      return;
    }

    setAllocatedCapacity(
      selectedExam.allocatedCapacity == null
        ? ""
        : String(selectedExam.allocatedCapacity),
    );
    setOwnCapacity(
      selectedExam.ownCapacity == null ? "" : String(selectedExam.ownCapacity),
    );
  }, [
    selectedExam?.examId,
    selectedExam?.allocatedCapacity,
    selectedExam?.ownCapacity,
  ]);

  // مجموع ظرفیت آزمون‌های الکترونیک (با مقدار زنده‌ی فرم برای آزمون انتخاب‌شده)
  const electronicUsed = useMemo(() => {
    if (!selectedExam || !isElectronic(selectedExam)) return null;

    const others = definedExams
      .filter((e) => isElectronic(e) && e.examId !== selectedExam.examId)
      .reduce((sum, e) => sum + (e.allocatedCapacity ?? 0), 0);

    return others + (Number(allocatedCapacity) || 0);
  }, [selectedExam, definedExams, allocatedCapacity]);

  async function handleSave() {
    if (!universityId || !selectedExam) return;

    const allocated = Number(allocatedCapacity);
    const own = Number(ownCapacity);

    if (!Number.isInteger(allocated) || allocated <= 0) {
      toast.error("ظرفیت کل باید عدد صحیح و بیشتر از صفر باشد.");
      return;
    }
    if (!Number.isInteger(own) || own < 0) {
      toast.error("ظرفیت اختصاصی باید عدد صحیح و صفر یا بیشتر باشد.");
      return;
    }
    if (own > allocated) {
      toast.error("ظرفیت اختصاصی نمی‌تواند بیشتر از ظرفیت کل باشد.");
      return;
    }

    setSaving(true);
    try {
      await saveUniversityExamCapacity(
        Number(universityId),
        selectedExam.examId,
        { allocatedCapacity: allocated, ownCapacity: own },
      );

      toast.success("ظرفیت آزمون با موفقیت ذخیره شد.");
      setEditingExamId(null);
      setExamId("");
      reloadExams();
    } catch {
      toast.error("ذخیره ظرفیت آزمون ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(exam: UniversityExamCapacityExamDto) {
    setEditingExamId(exam.examId);
    setExamId("");

    // در موبایل پنل بالای جدول است؛ کاربر را به فرم ببریم
    if (window.matchMedia("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleCancelEdit() {
    setEditingExamId(null);
    setExamId("");
  }

  /* ---------- حالت‌های کلی ---------- */

  if (universitiesLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (universitiesFailed) {
    return (
      <ErrorState
        title="خطا در دریافت دانشگاه‌ها"
        description="دریافت فهرست دانشگاه‌های مجاز شما از سرور ناموفق بود."
        onRetry={reloadUniversities}
      />
    );
  }

  if (!universities?.length) {
    return (
      <EmptyState
        icon={<Building2 className="size-5" />}
        title="دانشگاهی برای شما تعریف نشده است"
        description="برای تعیین ظرفیت آزمون، ابتدا باید دسترسی دانشگاه برای حساب کاربری شما ثبت شود."
      />
    );
  }

  const isEditing = !!editingExamId;

  /* ---------- صفحه اصلی ---------- */

  return (
    <div className="flex flex-col gap-3">
      {/* نوار دانشگاه */}
      <div className="flex flex-col gap-2 rounded-xl border bg-card px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
        <div className="flex shrink-0 items-center gap-2 text-sm font-medium">
          <Building2 className="size-4 text-primary" />
          دانشگاه
        </div>

        <div className="min-w-0 sm:w-72">
          {universities.length === 1 ? (
            <div className="flex h-9 items-center truncate rounded-md border bg-muted/40 px-3 text-sm">
              {universities[0].title}
            </div>
          ) : (
            <Select
              value={universityId}
              onValueChange={(value) => {
                setUniversityId(value);
                setExamId("");
                setEditingExamId(null);
              }}
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="دانشگاه را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent {...selectContentProps}>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={String(university.id)}>
                    {university.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedUniversity && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              نوع:{" "}
              <b className="font-medium text-foreground">
                {selectedUniversity.universityTypeTitle || "—"}
              </b>
            </span>
            <span>
              ظرفیت مصوب:{" "}
              <b className="font-semibold tabular-nums text-foreground">
                {fa(selectedUniversity.capacityApproved)}
              </b>
            </span>
          </div>
        )}

        {/* پیشرفت ظرفیت: فقط برای آزمون الکترونیک */}
        {selectedUniversity && electronicUsed != null && (
          <CapacityUsage
            used={electronicUsed}
            approved={selectedUniversity.capacityApproved}
          />
        )}
      </div>

      {!universityId ? (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="دانشگاه را انتخاب کنید"
          description="پس از انتخاب دانشگاه، آزمون‌ها و ظرفیت‌های آن نمایش داده می‌شود."
        />
      ) : examsFailed ? (
        <ErrorState
          title="خطا در دریافت آزمون‌ها"
          description="فهرست آزمون‌های دانشگاه دریافت نشد."
          onRetry={reloadExams}
        />
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
          {/* پنل ثبت / ویرایش */}
          <section
            ref={panelRef}
            className={cn(
              "scroll-mt-4 overflow-hidden rounded-xl border bg-card transition-colors lg:sticky lg:top-4",
              isEditing && "border-amber-300 dark:border-amber-500/40",
            )}
          >
            <header
              className={cn(
                "flex items-center justify-between gap-2 border-b px-3 py-2.5 transition-colors",
                isEditing &&
                  "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
              )}
            >
              <h2
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold",
                  isEditing && "text-amber-900 dark:text-amber-200",
                )}
              >
                {isEditing && (
                  <span
                    className="size-2 rounded-full bg-amber-500 dark:bg-amber-400"
                    aria-hidden
                  />
                )}
                {isEditing ? "ویرایش ظرفیت" : "ثبت ظرفیت جدید"}
              </h2>

              {isEditing && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs text-amber-900 hover:bg-amber-100 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-500/20 dark:hover:text-amber-100"
                  onClick={handleCancelEdit}
                >
                  <X className="size-3.5" />
                  انصراف
                </Button>
              )}
            </header>

            <div className="space-y-3 p-3">
              {examsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : isEditing && selectedExam ? (
                <p className="rounded-md bg-muted/40 px-3 py-2 text-sm font-medium">
                  {selectedExam.examTitle}
                </p>
              ) : availableExams.length ? (
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue placeholder="آزمون را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent {...selectContentProps}>
                    {availableExams.map((exam) => (
                      <SelectItem key={exam.examId} value={exam.examId}>
                        {exam.examTitle}
                        {exam.examSessionTitle
                          ? ` - ${exam.examSessionTitle}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-md bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
                  {definedExams.length
                    ? "ظرفیت همه آزمون‌های فعال ثبت شده است."
                    : "آزمون فعالی برای این دانشگاه وجود ندارد."}
                </p>
              )}

              {selectedExam && (
                <ExamCapacityForm
                  exam={selectedExam}
                  allocatedCapacity={allocatedCapacity}
                  ownCapacity={ownCapacity}
                  onAllocatedChange={setAllocatedCapacity}
                  onOwnChange={setOwnCapacity}
                  onSave={handleSave}
                  saving={saving}
                />
              )}
            </div>
          </section>

          {/* جدول ظرفیت‌های ثبت‌شده */}
          <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
              <h2 className="text-sm font-semibold">ظرفیت‌های ثبت‌شده</h2>

              {!examsLoading && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                    ثبت‌شده
                    <b className="tabular-nums">{fa(definedExams.length)}</b>
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5",
                      availableExams.length
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Clock className="size-3.5" />
                    بدون ظرفیت
                    <b className="tabular-nums">{fa(availableExams.length)}</b>
                  </span>
                </div>
              )}
            </header>

            {examsLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : definedExams.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                هنوز ظرفیتی برای این دانشگاه ثبت نشده است.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-start font-medium">
                        آزمون
                      </th>
                      <th className="px-3 py-2 text-center font-medium">کل</th>
                      <th className="px-3 py-2 text-center font-medium">
                        اختصاصی
                      </th>
                      <th className="hidden px-3 py-2 text-center font-medium sm:table-cell">
                        مهمان
                      </th>
                      <th className="w-10 px-2 py-2">
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {definedExams.map((exam) => {
                      const guest =
                        (exam.allocatedCapacity ?? 0) - (exam.ownCapacity ?? 0);
                      const active = editingExamId === exam.examId;

                      return (
                        <tr
                          key={exam.examId}
                          className={cn(
                            "border-b transition-colors last:border-0",
                            active
                              ? "bg-amber-50 dark:bg-amber-500/10"
                              : "hover:bg-muted/30",
                          )}
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium leading-5">
                              {exam.examTitle}
                            </div>
                            {exam.examSessionTitle && (
                              <div className="text-xs text-muted-foreground">
                                {exam.examSessionTitle}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums">
                            {exam.allocatedCapacity != null
                              ? fa(exam.allocatedCapacity)
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums">
                            {exam.ownCapacity != null
                              ? fa(exam.ownCapacity)
                              : "—"}
                          </td>
                          <td className="hidden px-3 py-2 text-center tabular-nums text-muted-foreground sm:table-cell">
                            {fa(guest)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              aria-label={`ویرایش ظرفیت ${exam.examTitle}`}
                              onClick={() => handleEdit(exam)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CapacityUsage({ used, approved }: { used: number; approved: number }) {
  const free = approved - used;
  const over = free < 0;
  const pct = approved > 0 ? Math.min(100, (used / approved) * 100) : 0;

  return (
    <div className="w-full space-y-1 sm:min-w-56 sm:max-w-sm sm:flex-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">ظرفیت آزمون‌های الکترونیک</span>
        <span className={cn("tabular-nums", over && "text-destructive")}>
          {fa(used)} از {fa(approved)}
        </span>
      </div>

      <div
        className="flex h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={approved}
        aria-valuenow={used}
        aria-label="میزان پرشدن ظرفیت مصوب"
      >
        <div
          className={cn(
            "transition-[width]",
            over ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
        <div className={cn("flex-1", !over && "bg-primary/25")} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          پرشده <b className="tabular-nums">{fa(used)}</b>
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5",
            over && "text-destructive",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              over ? "bg-destructive" : "bg-primary/25",
            )}
          />
          {over ? "بیش از مصوب" : "خالی"}{" "}
          <b className="tabular-nums">{fa(Math.abs(free))}</b>
        </span>
      </div>
    </div>
  );
}

function ExamCapacityForm({
  exam,
  allocatedCapacity,
  ownCapacity,
  onAllocatedChange,
  onOwnChange,
  onSave,
  saving,
}: {
  exam: UniversityExamCapacityExamDto;
  allocatedCapacity: string;
  ownCapacity: string;
  onAllocatedChange: (value: string) => void;
  onOwnChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const allocated = Number(allocatedCapacity || 0);
  const own = Number(ownCapacity || 0);
  const guest = allocated - own;
  const invalid = guest < 0;
  const ownPct =
    allocated > 0 ? Math.min(100, Math.max(0, (own / allocated) * 100)) : 0;

  const canSave =
    !saving &&
    !!allocatedCapacity &&
    !!ownCapacity &&
    allocated > 0 &&
    own >= 0 &&
    own <= allocated;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) onSave();
      }}
    >
      <div className="flex flex-wrap gap-1.5 text-xs">
        <Chip label="نوبت" value={exam.examSessionTitle || "—"} />
        <Chip label="نوع" value={exam.examModeTitle || "—"} />
        <Chip
          label="تاریخ"
          value={
            exam.examDate
              ? new Date(exam.examDate).toLocaleDateString("fa-IR")
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label htmlFor="allocated" className="text-xs font-medium">
            ظرفیت کل
          </label>
          <Input
            id="allocated"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="h-9 tabular-nums"
            value={allocatedCapacity}
            onChange={(e) => onAllocatedChange(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="own" className="text-xs font-medium">
            ظرفیت اختصاصی
          </label>
          <Input
            id="own"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className="h-9 tabular-nums"
            value={ownCapacity}
            onChange={(e) => onOwnChange(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg bg-muted/40 p-2.5">
        <div
          className="flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label="نسبت ظرفیت اختصاصی به کل"
        >
          <div
            className="bg-primary transition-[width]"
            style={{ width: `${ownPct}%` }}
          />
          <div className="flex-1 bg-primary/25" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            اختصاصی
            <b className="tabular-nums">{fa(own)}</b>
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              invalid && "text-destructive",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                invalid ? "bg-destructive" : "bg-primary/25",
              )}
            />
            مهمان
            <b className="tabular-nums">{fa(guest)}</b>
          </span>
        </div>
        {invalid && (
          <p className="text-xs text-destructive">
            ظرفیت اختصاصی نمی‌تواند بیشتر از ظرفیت کل باشد.
          </p>
        )}
      </div>

      <Button type="submit" disabled={!canSave} className="h-9 w-full">
        <Save className="me-2 size-4" />
        {saving ? "در حال ذخیره..." : "ذخیره ظرفیت"}
      </Button>
    </form>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-1 text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
