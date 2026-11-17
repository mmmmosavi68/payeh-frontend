
"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Can } from "@/features/permissions/use-permission";

import type { UniversityDto } from "../types";

type UniversitiesTableProps = {
  universities: UniversityDto[];
  onEdit: (university: UniversityDto) => void;
  onDelete: (university: UniversityDto) => void;
};

export function UniversitiesTable({
  universities,
  onEdit,
  onDelete,
}: UniversitiesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-right text-muted-foreground">
              <th className="px-4 py-3 font-medium">نام دانشگاه</th>
              <th className="px-4 py-3 font-medium">نوع دانشگاه</th>
              <th className="px-4 py-3 font-medium">منطقه</th>
              <th className="px-4 py-3 font-medium">ظرفیت مصوب</th>
              <th className="px-4 py-3 font-medium">دانشگاه مادر</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 text-center font-medium">عملیات</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {universities.map((university) => (
              <tr
                key={university.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">
                  {university.title}
                </td>

                <td className="px-4 py-3">
                  {university.universityTypeTitle || "—"}
                </td>

                <td className="px-4 py-3">
                  منطقه {university.region}
                </td>

                <td className="px-4 py-3 tabular-nums">
                  {university.capacityApproved.toLocaleString("fa-IR")}
                </td>

                <td className="px-4 py-3">
                  {university.parentUniversityTitle || "—"}
                </td>

                <td className="px-4 py-3">
                  {university.isActive ? (
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
                    <Can controller="Universities" action="Update">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="ویرایش"
                        onClick={() => onEdit(university)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </Can>

                    <Can controller="Universities" action="Delete">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        title="حذف"
                        onClick={() => onDelete(university)}
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
