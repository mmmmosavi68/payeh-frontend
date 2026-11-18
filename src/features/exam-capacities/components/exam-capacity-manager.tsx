
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, GraduationCap, Save, Users } from "lucide-react";

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
    [universities, universityId]
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
  } = useRemoteData(
    `capacity-exams-${universityId}`,
    () =>
      universityId
        ? listUniversityActiveExams(Number(universityId))
        : Promise.resolve([])
  );

  // آزمون‌هایی که قبلاً ظرفیت دارند
  const definedExams = useMemo(
    () => exams?.filter((item) => item.isCapacityDefined) ?? [],
    [exams]
  );

  // آزمون‌هایی که هنوز ظرفیت ندارند
  const availableExams = useMemo(
    () => exams?.filter((item) => !item.isCapacityDefined) ?? [],
    [exams]
  );

  const [examId, setExamId] = useState("");
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [allocatedCapacity, setAllocatedCapacity] = useState("");
  const [ownCapacity, setOwnCapacity] = useState("");
  const [saving, setSaving] = useState(false);

  // در حالت عادی از آزمون‌های تعیین‌ظرفیت‌نشده انتخاب می‌کنیم.
  // در حالت ویرایش، آزمون از جدول ظرفیت‌های ثبت‌شده انتخاب می‌شود.
const selectedExam = useMemo(
  () =>
    examsLoading
      ? undefined
      : exams?.find(
          (item) => item.examId === (editingExamId ?? examId)
        ),
  [exams, examsLoading, editingExamId, examId]
);

  useEffect(() => {
    if (!exams || editingExamId) return;

    if (!availableExams.length) {
      setExamId("");
      return;
    }

    if (
      !examId ||
      !availableExams.some((item) => item.examId === examId)
    ) {
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
        : String(selectedExam.allocatedCapacity)
    );

    setOwnCapacity(
      selectedExam.ownCapacity == null
        ? ""
        : String(selectedExam.ownCapacity)
    );
  }, [
    selectedExam?.examId,
    selectedExam?.allocatedCapacity,
    selectedExam?.ownCapacity,
  ]);

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
        {
          allocatedCapacity: allocated,
          ownCapacity: own,
        }
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
  }

  function handleCancelEdit() {
    setEditingExamId(null);
    setExamId("");
  }

  if (universitiesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
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

  return (
    <div className="flex flex-col gap-5">
{universityId && (
        <>
          {/* جدول ظرفیت‌های ثبت‌شده */}
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-semibold">ظرفیت‌های ثبت‌شده</h2>
              <span className="text-xs text-muted-foreground">
                {definedExams.length.toLocaleString("fa-IR")} آزمون
              </span>
            </div>

            {examsLoading ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : !examsFailed && definedExams.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">
                هنوز ظرفیتی برای این دانشگاه ثبت نشده است.
              </p>
            ) : !examsFailed ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-3 text-right font-medium">آزمون</th>
                      <th className="px-3 py-3 text-right font-medium">نوبت</th>
                      <th className="px-3 py-3 text-center font-medium">
                        ظرفیت کل
                      </th>
                      <th className="px-3 py-3 text-center font-medium">
                        ظرفیت اختصاصی
                      </th>
                      <th className="px-3 py-3 text-center font-medium">
                        عملیات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {definedExams.map((exam) => (
                      <tr
                        key={exam.examId}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-3 font-medium">
                          {exam.examTitle}
                        </td>
                        <td className="px-3 py-3">
                          {exam.examSessionTitle || "—"}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums">
                          {exam.allocatedCapacity?.toLocaleString("fa-IR") ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums">
                          {exam.ownCapacity?.toLocaleString("fa-IR") ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(exam)}
                          >
                            ویرایش
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
      {/* انتخاب دانشگاه */}
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h2 className="font-semibold">انتخاب دانشگاه</h2>
        </div>

        {universities.length === 1 ? (
          <div className="rounded-xl border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">دانشگاه</p>
            <p className="mt-1 font-medium">{universities[0].title}</p>
          </div>
        ) : (
          <Select
            dir="rtl"
            value={universityId}
            onValueChange={(value) => {
              setUniversityId(value);
              setExamId("");
              setEditingExamId(null);
            }}
          >
            <SelectTrigger className="w-full sm:max-w-md">
              <SelectValue placeholder="دانشگاه موردنظر را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {universities.map((university) => (
                <SelectItem
                  key={university.id}
                  value={String(university.id)}
                >
                  {university.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedUniversity && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">نوع دانشگاه</p>
              <p className="mt-1 font-medium">
                {selectedUniversity.universityTypeTitle || "—"}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                ظرفیت مصوب دانشگاه
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {selectedUniversity.capacityApproved.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>
        )}
      </section>
          {/* انتخاب آزمون */}
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <h2 className="font-semibold">انتخاب آزمون</h2>
            </div>

            {examsLoading ? (
              <Skeleton className="h-10 w-full sm:max-w-xl" />
            ) : examsFailed ? (
              <ErrorState
                title="خطا در دریافت آزمون‌ها"
                description="فهرست آزمون‌های دانشگاه دریافت نشد."
                onRetry={reloadExams}
              />
            ) : editingExamId && selectedExam ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">ویرایش ظرفیت</p>
                  <p className="mt-1 font-medium">
                    {selectedExam.examTitle}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  انصراف
                </Button>
              </div>
            ) : !availableExams.length ? (
              <EmptyState
                icon={<GraduationCap className="size-5" />}
                title={
                  definedExams.length
                    ? "تمام آزمون‌های فعال تعیین ظرفیت شده‌اند"
                    : "آزمون فعالی یافت نشد"
                }
                description={
                  definedExams.length
                    ? "برای این دانشگاه آزمون جدیدی جهت تعیین ظرفیت وجود ندارد."
                    : "برای این دانشگاه آزمون فعالی جهت تعیین ظرفیت وجود ندارد."
                }
              />
            ) : (
              <Select
                dir="rtl"
                value={examId}
                onValueChange={setExamId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="آزمون را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
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
          </section>
        </>
      )}


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
  const remainingCapacity =
    Number(allocatedCapacity || 0) - Number(ownCapacity || 0);

  return (
    <div className="mt-5 space-y-5 border-t pt-5">
      <div>
        <h3 className="font-semibold">{exam.examTitle}</h3>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>نوبت: {exam.examSessionTitle || "—"}</span>
          <span>نوع آزمون: {exam.examModeTitle || "—"}</span>
          <span>
            تاریخ:{" "}
            {exam.examDate
              ? new Date(exam.examDate).toLocaleDateString("fa-IR")
              : "—"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ظرفیت کل تخصیص‌یافته
          </label>
          <Input
            type="number"
            min={1}
            step={1}
            value={allocatedCapacity}
            onChange={(event) => onAllocatedChange(event.target.value)}
            placeholder="ظرفیت کل"
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            مجموع ظرفیت اختصاصی و ظرفیت دانشگاه‌های مهمان
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            ظرفیت اختصاصی دانشگاه
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            value={ownCapacity}
            onChange={(event) => onOwnChange(event.target.value)}
            placeholder="ظرفیت اختصاصی"
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            ظرفیت قابل استفاده توسط دانشجویان همین دانشگاه
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            ظرفیت کل
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums">
            {Number(allocatedCapacity || 0).toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            ظرفیت اختصاصی
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums">
            {Number(ownCapacity || 0).toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <div className="text-sm text-muted-foreground">
            ظرفیت قابل تخصیص به مهمان
          </div>
          <p
            className={`mt-2 text-xl font-bold tabular-nums ${
              remainingCapacity < 0 ? "text-destructive" : ""
            }`}
          >
            {remainingCapacity.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={
            saving ||
            !allocatedCapacity ||
            !ownCapacity ||
            Number(allocatedCapacity) <= 0 ||
            Number(ownCapacity) < 0 ||
            Number(ownCapacity) > Number(allocatedCapacity)
          }
          className="w-full sm:w-auto"
        >
          <Save className="me-2 size-4" />
          {saving ? "در حال ذخیره..." : "ذخیره ظرفیت"}
        </Button>
      </div>
    </div>
  );
}
