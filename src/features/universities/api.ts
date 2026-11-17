
import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

import type {
  CreateUniversityDto,
  UniversityDto,
  UniversityFilters,
  UpdateUniversityDto,
} from "./types.ts";

const universitySchema = z.object({
  id: z.number(),
  title: z.string(),
  universityTypeId: z.number(),
  universityTypeTitle: z.string().nullish(),
  region: z.number(),
  capacityApproved: z.number(),
  parentUniversityId: z.number().nullish(),
  parentUniversityTitle: z.string().nullish(),
  isActive: z.boolean(),
  createdDate: z.string(),
  updatedDate: z.string().nullish(),
});

function toUniversityRecord(
  university: z.infer<typeof universitySchema>,
): UniversityDto {
  return {
    id: university.id,
    title: university.title,
    universityTypeId: university.universityTypeId,
    universityTypeTitle: university.universityTypeTitle ?? null,
    region: university.region,
    capacityApproved: university.capacityApproved,
    parentUniversityId: university.parentUniversityId ?? null,
    parentUniversityTitle: university.parentUniversityTitle ?? null,
    isActive: university.isActive,
    createdDate: university.createdDate,
    updatedDate: university.updatedDate ?? null,
  };
}

/**
 * دریافت فهرست دانشگاه‌ها با فیلترهای اختیاری.
 */
export async function listUniversities(
  filters: UniversityFilters = {},
): Promise<UniversityDto[]> {
  const universities = await apiRequest("universities", {
    query: {
      search: filters.search,
      universityTypeId: filters.universityTypeId,
      region: filters.region,
      parentUniversityId: filters.parentUniversityId,
      isActive: filters.isActive,
    },
    schema: z.array(universitySchema),
  });

  return universities.map(toUniversityRecord);
}

/**
 * دریافت جزئیات یک دانشگاه.
 */
export async function getUniversityById(
  id: number,
): Promise<UniversityDto> {
  const university = await apiRequest(`universities/${id}`, {
    schema: universitySchema,
  });

  return toUniversityRecord(university);
}

/**
 * ایجاد دانشگاه جدید.
 */
export async function createUniversity(
  input: CreateUniversityDto,
): Promise<UniversityDto> {
  const university = await apiRequest("universities", {
    method: "POST",
    body: input,
    schema: universitySchema,
  });

  return toUniversityRecord(university);
}

/**
 * ویرایش دانشگاه.
 */
export async function updateUniversity(
  id: number,
  input: UpdateUniversityDto,
): Promise<UniversityDto> {
  const university = await apiRequest(`universities/${id}`, {
    method: "PUT",
    body: input,
    schema: universitySchema,
  });

  return toUniversityRecord(university);
}

/**
 * حذف نرم دانشگاه.
 */
export async function deleteUniversity(id: number): Promise<void> {
  await apiRequest(`universities/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}
