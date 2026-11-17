
import { z } from "zod";

const nullablePositiveInteger = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === undefined ||
      value === null ||
      (typeof value === "number" && Number.isNaN(value))
    ) {
      return null;
    }

    return Number(value);
  },
  z.number().int().positive().nullable(),
);

export const universitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "عنوان دانشگاه الزامی است.")
    .max(200, "عنوان دانشگاه نباید بیشتر از ۲۰۰ کاراکتر باشد."),

  universityTypeId: z.preprocess(
    (value) => Number(value),
    z.number().int().positive("انتخاب نوع دانشگاه الزامی است."),
  ),

  region: z.preprocess(
    (value) => Number(value),
    z
      .number()
      .int()
      .min(1, "منطقه باید بین ۱ تا ۱۱ باشد.")
      .max(11, "منطقه باید بین ۱ تا ۱۱ باشد."),
  ),

  capacityApproved: z.preprocess(
    (value) => Number(value),
    z
      .number()
      .int()
      .min(0, "ظرفیت مصوب نمی‌تواند منفی باشد."),
  ),

  parentUniversityId: nullablePositiveInteger,

  isActive: z.boolean(),
});

export type UniversityFormInput = z.input<typeof universitySchema>;
export type UniversityFormValues = z.output<typeof universitySchema>;
