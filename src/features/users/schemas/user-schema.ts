import { z } from "zod";
import { normalizeMobile, toLatinDigits } from "@/lib/digits";

export type UserSchemaMessages = {
  usernameFormat: string;
  firstNameRequired: string;
  lastNameRequired: string;
  fatherNameRequired: string;
  phoneInvalid: string;
  emailInvalid: string;
  nationalCodeInvalid: string;
  passwordMin: string;
  rolesRequired: string;
  genderRequired: string;
  maritalStatusRequired: string;
  religionRequired: string;
  leftHandedRequired: string;
  nationalityRequired: string;
  expireDateRequired: string;
};

export type UserCodeOptions = {
  gender: string[];
  maritalStatus: string[];
  religion: string[];
  leftHanded: string[];
  nationality: string[];
};

export function createUserSchema(
  messages: UserSchemaMessages,
  options: UserCodeOptions,
) {
  const requiredCode = (message: string, allowed: string[]) =>
    z
      .string()
      .trim()
      .min(1, message)
      .refine((value) => allowed.includes(value), message);

  return z.object({
    username: z
      .string()
      .trim()
      .min(3, messages.usernameFormat)
      .max(50, messages.usernameFormat)
      .regex(/^[A-Za-z][A-Za-z0-9._]*$/, messages.usernameFormat),

    firstName: z
      .string()
      .trim()
      .min(1, messages.firstNameRequired)
      .max(50),

    lastName: z
      .string()
      .trim()
      .min(1, messages.lastNameRequired)
      .max(50),

    fatherName: z
      .string()
      .trim()
      .min(1, messages.fatherNameRequired)
      .max(50),

    phone: z.string().trim().refine(
      (value) => /^09\d{9}$/.test(normalizeMobile(value)),
      { message: messages.phoneInvalid },
    ),

    email: z
      .string()
      .trim()
      .min(1, messages.emailInvalid)
      .max(100, messages.emailInvalid)
      .refine((value) => z.email().safeParse(value).success, {
        message: messages.emailInvalid,
      }),

    nationalCode: z.string().trim().refine(
      (value) => /^\d{10}$/.test(toLatinDigits(value)),
      { message: messages.nationalCodeInvalid },
    ),

    gender: requiredCode(
      messages.genderRequired,
      options.gender,
    ),

    maritalStatus: requiredCode(
      messages.maritalStatusRequired,
      options.maritalStatus,
    ),

    religion: requiredCode(
      messages.religionRequired,
      options.religion,
    ),

    leftHanded: requiredCode(
      messages.leftHandedRequired,
      options.leftHanded,
    ),

    nationality: requiredCode(
      messages.nationalityRequired,
      options.nationality,
    ),

    expireDate: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      messages.expireDateRequired,
    ),

    password: z.string().max(128).refine(
      (value) => value === "" || value.length >= 8,
      messages.passwordMin,
    ),

    roleIds: z
      .array(z.number())
      .min(1, messages.rolesRequired),

    isActive: z.boolean(),
  });
}

export type UserFormValues = z.infer<
  ReturnType<typeof createUserSchema>
>;