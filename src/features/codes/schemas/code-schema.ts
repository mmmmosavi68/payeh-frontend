import { z } from "zod";

const nullableInteger = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null || (typeof value === "number" && Number.isNaN(value))) {
    return null;
  }

  return Number(value);
}, z.number().int().nullable());

export const codeSchema = z
  .object({
    kind: z.enum(["group", "item"]),

    title: z.string().trim().min(1, "عنوان الزامی است.").max(200, "عنوان نباید بیشتر از ۲۰۰ کاراکتر باشد."),

    parentId: nullableInteger,

    primaryCode: nullableInteger,

    subCode: nullableInteger,

    standardCode: nullableInteger,

    additionalInformation: z.string().trim().max(400, "اطلاعات اضافی نباید بیشتر از ۴۰۰ کاراکتر باشد."),

    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.kind === "group") {
      if (value.primaryCode === null || value.primaryCode <= 0) {
        context.addIssue({
          code: "custom",
          path: ["primaryCode"],
          message: "کد اصلی گروه باید عددی بزرگ‌تر از صفر باشد.",
        });
      }
    }

    if (value.kind === "item") {
      if (value.parentId === null || value.parentId <= 0) {
        context.addIssue({
          code: "custom",
          path: ["parentId"],
          message: "انتخاب گروه الزامی است.",
        });
      }

      if (value.subCode === null || value.subCode < 1) {
        context.addIssue({
          code: "custom",
          path: ["subCode"],
          message: "کد فرعی باید عددی بزرگ‌تر یا مساوی یک باشد.",
        });
      }
    }
  });

export type CodeFormInput = z.input<typeof codeSchema>;
export type CodeFormValues = z.output<typeof codeSchema>;
