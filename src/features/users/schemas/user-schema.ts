import { z } from "zod";
import { toLatinDigits } from "@/lib/digits";
import { roleKeys } from "@/types/user";

export type UserSchemaMessages = {
  usernameFormat: string;
  firstNameRequired: string;
  lastNameRequired: string;
  phoneInvalid: string;
  passwordMin: string;
  rolesRequired: string;
};

export function createUserSchema(
  messages: UserSchemaMessages,
  mode: "create" | "edit",
) {
  return z
    .object({
      username: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9._-]{3,32}$/, messages.usernameFormat),
      firstName: z.string().trim().min(1, messages.firstNameRequired).max(50),
      lastName: z.string().trim().min(1, messages.lastNameRequired).max(50),
      phone: z
        .string()
        .trim()
        .refine((value) => /^09\d{9}$/.test(toLatinDigits(value)), {
          message: messages.phoneInvalid,
        }),
      password: z.string().max(128),
      roles: z.array(z.enum(roleKeys)).min(1, messages.rolesRequired),
      isActive: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (mode === "create" && value.password.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: messages.passwordMin,
        });
      }
    });
}

export type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>;