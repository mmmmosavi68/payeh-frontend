
import { listCodes } from "@/features/codes/api";
import type { CodeDto } from "@/features/codes/types";

export interface UniversityTypeOption {
  id: number;
  title: string;
}

export function getUniversityTypeOptions(
  codes: CodeDto[],
): UniversityTypeOption[] {
  const group = codes.find(
    (code) =>
      code.parentId === 1 &&
      code.subCode === 0 &&
      code.title?.trim() === "نوع دانشگاه" &&
      code.isActive,
  );

  if (!group) {
    console.log("University type group not found.", codes);
    return [];
  }

  const options = codes
    .filter(
      (code) =>
        code.parentId === group.id &&
        code.isActive &&
        code.title?.trim(),
    )
    .map((code) => ({
      id: code.id,
      title: code.title.trim(),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "fa"));

  console.log("University type options:", options);

  return options;
}

export async function listUniversityTypeOptions(): Promise<UniversityTypeOption[]> {
  const codes = await listCodes();
  console.log("Codes received from API:", codes);

  return getUniversityTypeOptions(codes);
}
