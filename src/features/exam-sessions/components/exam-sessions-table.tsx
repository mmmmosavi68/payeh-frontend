"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Can } from "@/features/permissions/use-permission";

import type { ExamSessionDto } from "../types";

type ExamSessionsTableProps = {
  examSessions: ExamSessionDto[];
  onEdit: (item: ExamSessionDto) => void;
  onDelete: (item: ExamSessionDto) => void;
};

function formatExamDate(value: string): string {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return "—";

  return new Intl.DateTimeFormat("fa-IR").format(
    new Date(year, month - 1, day),
  );
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function ExamSessionsTable({
  examSessions,
  onEdit,
  onDelete,
}: ExamSessionsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-right text-muted-foreground">
              <th className="px-4 py-3 font-medium">عنوان نوبت</th>
              <th className="px-4 py-3 font-medium">تاریخ برگزاری</th>
              <th className="px-4 py-3 font-medium">ساعت شروع</th>
              <th className="px-4 py-3 font-medium">ساعت پایان</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 text-center font-medium">عملیات</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {examSessions.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">
                  {item.title}
                </td>

                <td className="px-4 py-3 tabular-nums">
                  {formatExamDate(item.examDate)}
                </td>

                <td className="px-4 py-3 tabular-nums" dir="ltr">
                  {formatTime(item.startTime)}
                </td>

                <td className="px-4 py-3 tabular-nums" dir="ltr">
                  {formatTime(item.endTime)}
                </td>

                <td className="px-4 py-3">
                  {item.isActive ? (
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      فعال
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      غیرفعال
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Can controller="ExamSessions" action="Update">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="ویرایش"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </Can>

                    <Can controller="ExamSessions" action="Delete">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        title="حذف"
                        onClick={() => onDelete(item)}
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
  );
}