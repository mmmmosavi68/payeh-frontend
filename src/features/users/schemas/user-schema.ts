import { z } from "zod";
import { normalizeMobile, toLatinDigits } from "@/lib/digits";

export type UserSchemaMessages = {
  usernameFormat: string;
  firstNameRequired: string;
  lastNameRequired: string;
  phoneInvalid: string;
  emailInvalid: string;
  nationalCodeInvalid: string;
  passwordMin: string;
  rolesRequired: string;
};

export function createUserSchema(messages: UserSchemaMessages, mode: "create" | "edit") {
  return z
    .object({
      // در ویرایش این دو فقط‌خواندنی‌اند و اعتبارسنجی نمی‌شوند.
      username: z.string().trim(),
      nationalCode: z.string().trim(),
      firstName: z.string().trim().min(1, messages.firstNameRequired).max(50),
      lastName: z.string().trim().min(1, messages.lastNameRequired).max(50),
      phone: z
        .string()
        .trim()
        .refine((value) => /^09\d{9}$/.test(normalizeMobile(value)), {
          message: messages.phoneInvalid,
        }),
      email: z
        .string()
        .trim()
        .max(100, messages.emailInvalid)
        .refine((value) => value === "" || z.email().safeParse(value).success, {
          message: messages.emailInvalid,
        }),
      password: z.string().max(128),
      roleIds: z.array(z.number()).min(1, messages.rolesRequired),
      isActive: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (mode === "create") {
        if (!/^[A-Za-z][A-Za-z0-9._]{2,49}$/.test(value.username)) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message: messages.usernameFormat,
          });
        }
        if (!/^\d{10}$/.test(toLatinDigits(value.nationalCode))) {
          ctx.addIssue({
            code: "custom",
            path: ["nationalCode"],
            message: messages.nationalCodeInvalid,
          });
        }
      }

      if (value.password !== "" && value.password.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: messages.passwordMin,
        });
      }
    });
}

export type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>;
