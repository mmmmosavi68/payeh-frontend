import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { toLatinDigits } from "@/lib/digits";
import { parseApiDate } from "@/lib/dates";
import type { PagedResult } from "@/types/common";
import type { CreateUserInput, RoleInfo, UpdateUserInput, UserQuery, UserRecord } from "@/types/user";

const roleSchema = z.object({
  id: z.number(),
  nameEn: z.string(),
  nameFa: z.string(),
});

const userSchema = z.object({
  id: z.string(),
  userName: z.string(),
  emailAddress: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  phoneNumberConfirmed: z.boolean().nullable().optional(),
  expireDate: z.string().optional(),
  isActive: z.boolean(),
  createdDate: z.string(),
  lastLoginDate: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  nationalCode: z.string().nullish(),
  roles: z.array(roleSchema),
});

const pagedSchema = z.object({
  items: z.array(userSchema),
  totalCount: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
});

function toRecord(user: z.infer<typeof userSchema>): UserRecord {
  return {
    id: user.id,
    userName: user.userName,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phoneNumber ?? "",
    email: user.emailAddress ?? "",
    nationalCode: user.nationalCode ?? "",
    roles: user.roles,
    isActive: user.isActive,
    createdAt: parseApiDate(user.createdDate).toISOString(),
    lastLoginAt: user.lastLoginDate ? parseApiDate(user.lastLoginDate).toISOString() : null,
    phoneNumberConfirmed: user.phoneNumberConfirmed ?? null,
    expireDate: user.expireDate ? parseApiDate(user.expireDate).toISOString() : null,
  };
}

export async function listUsers(query: UserQuery): Promise<PagedResult<UserRecord>> {
  const data = await apiRequest("users", {
    query: {
      pageNumber: query.page,
      pageSize: query.pageSize,
      search: toLatinDigits(query.search.trim()) || undefined,
      isActive: query.status === "all" ? undefined : query.status === "active",
      roleId: query.roleId ?? undefined,
      sortBy: query.sort,
      sortDirection: query.dir,
    },
    schema: pagedSchema,
  });

  return {
    items: data.items.map(toRecord),
    total: data.totalCount,
    page: data.pageNumber,
    pageSize: data.pageSize,
  };
}


export async function getUserById(id: string): Promise<UserRecord> {
  const user = await apiRequest(`users/${id}`, { schema: userSchema });
  return toRecord(user);
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const user = await apiRequest("users", {
    method: "POST",
    body: {
      userName: input.userName,
      phoneNumber: input.phone,
      emailAddress: input.email || undefined,
      firstName: input.firstName,
      lastName: input.lastName,
      nationalCode: input.nationalCode,
      password: input.password || undefined,
      roleIds: input.roleIds,
      isActive: input.isActive,
    },
    schema: userSchema,
  });

  return toRecord(user);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  const user = await apiRequest(`users/${id}`, {
    method: "PUT",
    body: {
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phone,
      // بک‌اند رشته‌ی خالی را ایمیل نامعتبر می‌داند؛ پس خالی ارسال نمی‌شود.
      emailAddress: input.email || undefined,
      password: input.password || undefined,
      roleIds: input.roleIds,
      isActive: input.isActive,
    },
    schema: userSchema,
  });

  return toRecord(user);
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest(`users/${id}`, { method: "DELETE", schema: z.unknown() });
}

export async function listRoles(): Promise<RoleInfo[]> {
  return apiRequest("roles", { schema: z.array(roleSchema) });
}
