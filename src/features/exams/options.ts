import { listCodes } from "@/features/codes/api";
import type { CodeDto } from "@/features/codes/types";

export interface ExamCodeOption {
  id: number;
  title: string;
}

function getGroupItems(
  codes: CodeDto[],
  groupTitle: string,
): ExamCodeOption[] {
  const group = codes.find(
    (item) =>
      item.parentId === 1 &&
      item.subCode === 0 &&
      item.title.trim() === groupTitle &&
      item.isActive,
  );

  if (!group) return [];

  return codes
    .filter(
      (item) =>
        item.parentId === group.id &&
        item.isActive &&
        item.title.trim(),
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "fa"));
}

export async function getExamOptions() {
  const codes = await listCodes();

  return {
    examTypes: getGroupItems(codes, "نوع آزمون"),
    examModes: getGroupItems(codes, "نحوه برگزاری"),
  };
}