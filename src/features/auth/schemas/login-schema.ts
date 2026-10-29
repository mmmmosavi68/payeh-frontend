import { z } from "zod";
import { normalizeMobile } from "@/lib/digits";

export function createMobileSchema(messages: { mobileRequired: string; mobileInvalid: string }) {
  return z.object({
    mobile: z
      .string()
      .trim()
      .min(1, messages.mobileRequired)
      .refine((value) => /^09\d{9}$/.test(normalizeMobile(value)), {
        message: messages.mobileInvalid,
      }),
  });
}

export type MobileValues = z.infer<ReturnType<typeof createMobileSchema>>;

export function createPasswordLoginSchema(messages: { usernameRequired: string; passwordRequired: string }) {
  return z.object({
    username: z.string().trim().min(1, messages.usernameRequired).max(50),
    password: z.string().min(1, messages.passwordRequired).max(128),
  });
}

export type PasswordLoginValues = z.infer<ReturnType<typeof createPasswordLoginSchema>>;

export function createOtpSchema(length: number, message: string) {
  return z.object({
    code: z.string().refine((value) => new RegExp(`^\\d{${length}}$`).test(value), {
      message,
    }),
  });
}

export type OtpValues = z.infer<ReturnType<typeof createOtpSchema>>;
