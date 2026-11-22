import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

import type {
  ExamCapacityUniversityDto,
  GuestUniversityDto,
  UniversityExamCapacityExamDto,
  UniversityExamGuestCapacityDto,
  SaveUniversityExamCapacityDto,
  SaveUniversityExamGuestCapacityDto,
} from "./types";

/* ---------------------------------------------------------
   Schemas
--------------------------------------------------------- */

const universitySchema = z.object({
  id: z.number(),
  title: z.string(),
  universityTypeId: z.number(),
  universityTypeTitle: z.string().nullish(),
  region: z.number(),
  capacityApproved: z.number(),
  parentUniversityId: z.number().nullish(),
  parentUniversityTitle: z.string().nullish(),
  isCampus: z.boolean(),
});

const guestUniversitySchema = z.object({
  id: z.number(),
  title: z.string(),
  universityTypeTitle: z.string().nullish(),
  region: z.number(),
});

const examCapacitySchema = z.object({
  examId: z.string(),
  examTitle: z.string(),
  examSessionId: z.string(),
  examSessionTitle: z.string().nullish(),
  examDate: z.string(),
  examModeId: z.number(),
  examModeTitle: z.string().nullish(),
  isCapacityDefined: z.boolean(),
  capacityId: z.string().nullish(),
  allocatedCapacity: z.number().nullish(),
  ownCapacity: z.number().nullish(),
  capacityIsActive: z.boolean().nullish(),
});

const guestCapacitySchema = z.object({
  id: z.string(),
  universityExamCapacityId: z.string(),
  guestUniversityId: z.number(),
  guestUniversityTitle: z.string(),
  capacity: z.number(),
  isActive: z.boolean(),
  createdDate: z.string(),
  updatedDate: z.string().nullish(),
});

/* ---------------------------------------------------------
   Universities
--------------------------------------------------------- */

/** دریافت دانشگاه‌های مجاز کاربر جاری */
export async function listMyCapacityUniversities(): Promise<ExamCapacityUniversityDto[]> {
  const result = await apiRequest("universityExamCapacities/my-universities", {
    schema: z.array(universitySchema),
  });

  return result.map((item) => ({
    ...item,
    universityTypeTitle: item.universityTypeTitle ?? null,
    parentUniversityId: item.parentUniversityId ?? null,
    parentUniversityTitle: item.parentUniversityTitle ?? null,
  }));
}

/** دریافت دانشگاه‌های فعال برای انتخاب دانشگاه مهمان */
export async function listActiveGuestUniversities(): Promise<GuestUniversityDto[]> {
  const result = await apiRequest("universities", {
    query: {
      isActive: true,
    },
    schema: z.array(guestUniversitySchema),
  });

  return result.map((item) => ({
    ...item,
    universityTypeTitle: item.universityTypeTitle ?? null,
  }));
}

/* ---------------------------------------------------------
   Exams
--------------------------------------------------------- */

/** دریافت آزمون‌های فعال دانشگاه */
export async function listUniversityActiveExams(universityId: number): Promise<UniversityExamCapacityExamDto[]> {
  const result = await apiRequest(`universityExamCapacities/universities/${universityId}/active-exams`, {
    schema: z.array(examCapacitySchema),
  });

  return result.map((item) => ({
    ...item,
    examSessionTitle: item.examSessionTitle ?? null,
    examModeTitle: item.examModeTitle ?? null,
    capacityId: item.capacityId ?? null,
    allocatedCapacity: item.allocatedCapacity ?? null,
    ownCapacity: item.ownCapacity ?? null,
    capacityIsActive: item.capacityIsActive ?? null,
  }));
}

/** دریافت آزمون‌هایی که ظرفیت آن‌ها تعریف شده است */
export async function listDefinedUniversityExamCapacities(universityId: number): Promise<UniversityExamCapacityExamDto[]> {
  const result = await apiRequest(`universityExamCapacities/universities/${universityId}/defined-capacities`, {
    schema: z.array(examCapacitySchema),
  });

  return result.map((item) => ({
    ...item,
    examSessionTitle: item.examSessionTitle ?? null,
    examModeTitle: item.examModeTitle ?? null,
    capacityId: item.capacityId ?? null,
    allocatedCapacity: item.allocatedCapacity ?? null,
    ownCapacity: item.ownCapacity ?? null,
    capacityIsActive: item.capacityIsActive ?? null,
  }));
}

/* ---------------------------------------------------------
   Host Capacity
--------------------------------------------------------- */

/** ثبت یا ویرایش ظرفیت دانشگاه میزبان */
export async function saveUniversityExamCapacity(universityId: number, examId: string, input: SaveUniversityExamCapacityDto): Promise<void> {
  await apiRequest(`universityExamCapacities/universities/${universityId}/exams/${examId}/capacity`, {
    method: "PUT",
    body: input,
    schema: z.unknown(),
  });
}

/* ---------------------------------------------------------
   Guest Capacities
--------------------------------------------------------- */

/** دریافت ظرفیت دانشگاه‌های مهمان یک آزمون */
export async function listGuestCapacities(universityId: number, examId: string): Promise<UniversityExamGuestCapacityDto[]> {
  const result = await apiRequest(`universityExamCapacities/universities/${universityId}/exams/${examId}/guest-capacities`, {
    schema: z.array(guestCapacitySchema),
  });

  return result.map((item) => ({
    ...item,
    updatedDate: item.updatedDate ?? null,
  }));
}

/** ثبت یا ویرایش ظرفیت دانشگاه مهمان */
export async function saveGuestCapacity(universityId: number, examId: string, guestUniversityId: number, input: SaveUniversityExamGuestCapacityDto): Promise<UniversityExamGuestCapacityDto> {
  const result = await apiRequest(`universityExamCapacities/universities/${universityId}/exams/${examId}/guest-capacities/${guestUniversityId}`, {
    method: "PUT",
    body: input,
    schema: guestCapacitySchema,
  });

  return {
    ...result,
    updatedDate: result.updatedDate ?? null,
  };
}
