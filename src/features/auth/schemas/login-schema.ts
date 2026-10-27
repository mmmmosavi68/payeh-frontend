import { z } from "zod";

export type LoginMessages = {
  usernameRequired: string;
  passwordRequired: string;
};

export function createLoginSchema(messages: LoginMessages) {
  return z.object({
    username: z.string().trim().min(1, messages.usernameRequired).max(64),
    password: z.string().min(1, messages.passwordRequired).max(128),
  });
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createOtpSchema(invalidMessage: string) {
  return z.object({
    code: z.string().regex(/^\d{6}$/, invalidMessage),
  });
}

export type OtpValues = z.infer<ReturnType<typeof createOtpSchema>>;