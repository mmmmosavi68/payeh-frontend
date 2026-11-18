import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

import type { ExamCapacityUniversityDto, UniversityExamCapacityExamDto, SaveUniversityExamCapacityDto } from "./types";

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

export async function saveUniversityExamCapacity(universityId: number, examId: string, input: SaveUniversityExamCapacityDto): Promise<void> {
  await apiRequest(`universityExamCapacities/universities/${universityId}/exams/${examId}/capacity`, {
    method: "PUT",
    body: input,
    schema: z.unknown(),
  });
}

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
