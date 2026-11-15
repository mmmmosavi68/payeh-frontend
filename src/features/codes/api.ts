import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

import type { CodeDto, CreateCodeDto, UpdateCodeDto } from "./types";

const codeSchema = z.object({
  id: z.number(),
  title: z.string(),

  parentId: z.number().nullish(),
  standardCode: z.number().nullish(),
  primaryCode: z.number().nullish(),
  subCode: z.number().nullish(),
  additionalInformation: z.string().nullish(),

  isActive: z.boolean(),
});
function toCodeRecord(code: z.infer<typeof codeSchema>): CodeDto {
  return {
    id: code.id,
    title: code.title,
    parentId: code.parentId ?? null,
    standardCode: code.standardCode ?? null,
    primaryCode: code.primaryCode ?? null,
    subCode: code.subCode ?? null,
    additionalInformation: code.additionalInformation ?? null,
    isActive: code.isActive,
  };
}   

/**
 * دریافت تمام کدهای حذف‌نشده، شامل گروه‌ها و آیتم‌ها.
 */
export async function listCodes(): Promise<CodeDto[]> {
  const codes = await apiRequest("codes", {
    schema: z.array(codeSchema),
  });

  return codes.map(toCodeRecord);
}

/**
 * دریافت جزئیات یک کد.
 */
export async function getCodeById(id: number): Promise<CodeDto> {
  const code = await apiRequest(`codes/${id}`, {
    schema: codeSchema,
  });

  return toCodeRecord(code);
}

/**
 * ایجاد گروه یا آیتم.
 */
export async function createCode(input: CreateCodeDto): Promise<CodeDto> {
  const code = await apiRequest("codes", {
    method: "POST",
    body: input,
    schema: codeSchema,
  });

  return toCodeRecord(code);
}

/**
 * ویرایش گروه یا آیتم.
 */
export async function updateCode(id: number, input: UpdateCodeDto): Promise<CodeDto> {
  const code = await apiRequest(`codes/${id}`, {
    method: "PUT",
    body: input,
    schema: codeSchema,
  });

  return toCodeRecord(code);
}

/**
 * حذف نرم کد.
 */
export async function deleteCode(id: number): Promise<void> {
  await apiRequest(`codes/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}
