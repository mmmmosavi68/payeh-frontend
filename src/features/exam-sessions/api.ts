import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

import type { CreateExamSessionDto, ExamSessionDto, ExamSessionFilters, UpdateExamSessionDto } from "./types";

const examSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  examDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean(),
  createdDate: z.string(),
  updatedDate: z.string().nullish(),
});

function toExamSessionDto(value: z.infer<typeof examSessionSchema>): ExamSessionDto {
  return {
    ...value,
    updatedDate: value.updatedDate ?? null,
  };
}

export async function listExamSessions(filters: ExamSessionFilters = {}): Promise<ExamSessionDto[]> {
  const result = await apiRequest("examSessions", {
    query: {
      search: filters.search,
      isActive: filters.isActive,
    },
    schema: z.array(examSessionSchema),
  });

  return result.map(toExamSessionDto);
}

export async function getExamSessionById(id: string): Promise<ExamSessionDto> {
  const result = await apiRequest(`examSessions/${id}`, {
    schema: examSessionSchema,
  });

  return toExamSessionDto(result);
}

export async function createExamSession(input: CreateExamSessionDto): Promise<ExamSessionDto> {
  const result = await apiRequest("examSessions", {
    method: "POST",
    body: input,
    schema: examSessionSchema,
  });

  return toExamSessionDto(result);
}

export async function updateExamSession(id: string, input: UpdateExamSessionDto): Promise<ExamSessionDto> {
  const result = await apiRequest(`examSessions/${id}`, {
    method: "PUT",
    body: input,
    schema: examSessionSchema,
  });

  return toExamSessionDto(result);
}

export async function deleteExamSession(id: string): Promise<void> {
  await apiRequest(`examSessions/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}
