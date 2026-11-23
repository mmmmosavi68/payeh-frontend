import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

import type { RegistrationUniversityDto, RegistrationExamDto, ExamRegistrationDto } from "./types";

/* ---------------------------------------------------------
   Input Types
--------------------------------------------------------- */

export interface ExamRegistrationCustomFieldInput {
  examCustomFieldId: string;
  value: string | null;
}

export interface CreateExamRegistrationInput {
  examId: string;
  universityId: number;
  examVenueUniversityId: number;
  universityExamCapacityId: string;
  universityExamGuestCapacityId: string | null;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  nationalCode: string;
  genderId: number | null;
  birthCertificateNumber: string | null;
  birthDate: string | null;
  studentNumber: string | null;
  entryYear: number | null;
  phoneNumber: string | null;
  emergencyPhoneNumber: string | null;
  customFieldValues: ExamRegistrationCustomFieldInput[];
}

export type UpdateExamRegistrationInput = Omit<CreateExamRegistrationInput, "examId">;

/* ---------------------------------------------------------
   Schemas
--------------------------------------------------------- */

const universitySchema = z.object({
  universityId: z.number(),
  universityTitle: z.string(),
});

const examSchema = z.object({
  examId: z.string(),
  examTitle: z.string(),
});

const customFieldValueSchema = z.object({
  examCustomFieldId: z.string(),
  fieldLabel: z.string().nullish(),
  value: z.string().nullish(),
});

const registrationSchema = z.object({
  id: z.string(),
  examId: z.string(),
  universityId: z.number(),
  universityTitle: z.string().nullish(),
  examVenueUniversityId: z.number(),
  examVenueUniversityTitle: z.string().nullish(),
  universityExamCapacityId: z.string(),
  universityExamGuestCapacityId: z.string().nullish(),
  firstName: z.string(),
  lastName: z.string(),
  fatherName: z.string().nullish(),
  nationalCode: z.string(),
  genderId: z.number().nullish(),
  birthCertificateNumber: z.string().nullish(),
  birthDate: z.string().nullish(),
  studentNumber: z.string().nullish(),
  entryYear: z.number().nullish(),
  phoneNumber: z.string().nullish(),
  emergencyPhoneNumber: z.string().nullish(),
  createdDate: z.string(),
  customFieldValues: z.array(customFieldValueSchema),
});

/* ---------------------------------------------------------
   Normalizers
--------------------------------------------------------- */

function normalizeRegistration(item: z.infer<typeof registrationSchema>): ExamRegistrationDto {
  return {
    ...item,
    universityTitle: item.universityTitle ?? null,
    examVenueUniversityTitle: item.examVenueUniversityTitle ?? null,
    universityExamGuestCapacityId: item.universityExamGuestCapacityId ?? null,
    fatherName: item.fatherName ?? null,
    genderId: item.genderId ?? null,
    birthCertificateNumber: item.birthCertificateNumber ?? null,
    birthDate: item.birthDate ?? null,
    studentNumber: item.studentNumber ?? null,
    entryYear: item.entryYear ?? null,
    phoneNumber: item.phoneNumber ?? null,
    emergencyPhoneNumber: item.emergencyPhoneNumber ?? null,
    customFieldValues: item.customFieldValues.map((field) => ({
      ...field,
      fieldLabel: field.fieldLabel ?? null,
      value: field.value ?? null,
    })),
  };
}

/* ---------------------------------------------------------
   Universities
--------------------------------------------------------- */

/** دانشگاه‌های مجاز کاربر واردشده */
export async function listRegistrationUniversities(): Promise<RegistrationUniversityDto[]> {
  return apiRequest("examRegistrations/universities", {
    schema: z.array(universitySchema),
  });
}

/* ---------------------------------------------------------
   Exams
--------------------------------------------------------- */

/** آزمون‌های قابل ثبت‌نام برای دانشگاه انتخاب‌شده */
export async function listRegistrationExams(universityId: number): Promise<RegistrationExamDto[]> {
  return apiRequest("examRegistrations/exams", {
    query: { universityId },
    schema: z.array(examSchema),
  });
}

/* ---------------------------------------------------------
   Registrations
--------------------------------------------------------- */

/** ثبت‌نام‌های یک آزمون در دانشگاه انتخاب‌شده */
export async function listExamRegistrations(examId: string, universityId: number): Promise<ExamRegistrationDto[]> {
  const result = await apiRequest("examRegistrations", {
    query: {
      examId,
      universityId,
    },
    schema: z.array(registrationSchema),
  });

  return result.map(normalizeRegistration);
}

/** دریافت جزئیات یک ثبت‌نام */
export async function getExamRegistration(id: string): Promise<ExamRegistrationDto> {
  const result = await apiRequest(`examRegistrations/${id}`, {
    schema: registrationSchema,
  });

  return normalizeRegistration(result);
}

/** ثبت داوطلب جدید */
export async function createExamRegistration(input: CreateExamRegistrationInput): Promise<ExamRegistrationDto> {
  const result = await apiRequest("examRegistrations", {
    method: "POST",
    body: input,
    schema: registrationSchema,
  });

  return normalizeRegistration(result);
}

/** ویرایش اطلاعات داوطلب */
export async function updateExamRegistration(id: string, input: UpdateExamRegistrationInput): Promise<ExamRegistrationDto> {
  const result = await apiRequest(`examRegistrations/${id}`, {
    method: "PUT",
    body: input,
    schema: registrationSchema,
  });

  return normalizeRegistration(result);
}

/** حذف نرم ثبت‌نام */
export async function deleteExamRegistration(id: string): Promise<void> {
  await apiRequest(`examRegistrations/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}
