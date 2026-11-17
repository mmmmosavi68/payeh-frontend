import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

import type {
  CreateExamDto,
  ExamDto,
  ExamFilters,
  ExamSessionOption,
  UpdateExamDto,
} from "./types";

const examSchema = z.object({
  id: z.string(),
  title: z.string(),

  examSessionId: z.string(),
  examSessionTitle: z.string().nullish(),
  examDate: z.string(),

  examTypeId: z.number(),
  examTypeTitle: z.string().nullish(),

  examModeId: z.number(),
  examModeTitle: z.string().nullish(),

  registrationStartDate: z.string(),
  registrationEndDate: z.string(),
  editStartDate: z.string().nullish(),
  editEndDate: z.string().nullish(),

  description: z.string().nullish(),
  isActive: z.boolean(),
  createdDate: z.string(),
  updatedDate: z.string().nullish(),
});

const sessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  examDate: z.string(),
});

function toExamDto(value: z.infer<typeof examSchema>): ExamDto {
  return {
    ...value,
    examSessionTitle: value.examSessionTitle ?? null,
    examTypeTitle: value.examTypeTitle ?? null,
    examModeTitle: value.examModeTitle ?? null,
    editStartDate: value.editStartDate ?? null,
    editEndDate: value.editEndDate ?? null,
    description: value.description ?? null,
    updatedDate: value.updatedDate ?? null,
  };
}

export async function listExams(
  filters: ExamFilters = {},
): Promise<ExamDto[]> {
  const result = await apiRequest("exams", {
    query: {
      search: filters.search,
      examSessionId: filters.examSessionId,
      examTypeId: filters.examTypeId,
      examModeId: filters.examModeId,
      isActive: filters.isActive,
    },
    schema: z.array(examSchema),
  });

  return result.map(toExamDto);
}

export async function getExamById(id: string): Promise<ExamDto> {
  const result = await apiRequest(`exams/${id}`, {
    schema: examSchema,
  });

  return toExamDto(result);
}

export async function createExam(
  input: CreateExamDto,
): Promise<ExamDto> {
  const result = await apiRequest("exams", {
    method: "POST",
    body: input,
    schema: examSchema,
  });

  return toExamDto(result);
}

export async function updateExam(
  id: string,
  input: UpdateExamDto,
): Promise<ExamDto> {
  const result = await apiRequest(`exams/${id}`, {
    method: "PUT",
    body: input,
    schema: examSchema,
  });

  return toExamDto(result);
}

export async function deleteExam(id: string): Promise<void> {
  await apiRequest(`exams/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}

export async function listExamSessions(): Promise<ExamSessionOption[]> {
  return apiRequest("examSessions", {
    schema: z.array(sessionSchema),
  });
}