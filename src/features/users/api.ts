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

  expireDate: z.string().nullish(),
  isActive: z.boolean(),
  createdDate: z.string(),
  lastLoginDate: z.string().nullish(),

  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  fatherName: z.string().nullish(),
  nationalCode: z.string().nullish(),

  gender: z.number().nullable().optional(),
  maritalStatus: z.number().nullable().optional(),
  religion: z.number().nullable().optional(),
  leftHanded: z.number().nullable().optional(),
  nationality: z.number().nullable().optional(),

  roles: z.array(roleSchema),
});

const pagedSchema = z.object({
  items: z.array(userSchema),
  totalCount: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
});

type ApiUser = z.infer<typeof userSchema>;

function toRecord(user: ApiUser): UserRecord {
  return {
    id: user.id,
    userName: user.userName,

    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    fatherName: user.fatherName ?? "",

    phone: user.phoneNumber ?? "",
    email: user.emailAddress ?? "",
    nationalCode: user.nationalCode ?? "",

    gender: user.gender ?? null,
    maritalStatus: user.maritalStatus ?? null,
    religion: user.religion ?? null,
    leftHanded: user.leftHanded ?? null,
    nationality: user.nationality ?? null,

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
  const user = await apiRequest(`users/${id}`, {
    schema: userSchema,
  });

  return toRecord(user);
}

function toApiBody(input: CreateUserInput | UpdateUserInput) {
  return {
    userName: input.userName.trim(),

    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fatherName: input.fatherName.trim(),

    phoneNumber: input.phone.trim(),
    emailAddress: input.email.trim(),

    nationalCode: toLatinDigits(input.nationalCode.trim()),

    gender: input.gender,
    maritalStatus: input.maritalStatus,
    religion: input.religion,
    leftHanded: input.leftHanded,
    nationality: input.nationality,

    expireDate: input.expireDate,

    password: input.password || undefined,

    roleIds: input.roleIds,
    isActive: input.isActive,
  };
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const user = await apiRequest("users", {
    method: "POST",
    body: toApiBody(input),
    schema: userSchema,
  });

  return toRecord(user);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  const user = await apiRequest(`users/${id}`, {
    method: "PUT",
    body: toApiBody(input),
    schema: userSchema,
  });

  return toRecord(user);
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest("users", {
    method: "DELETE",
    query: { id },
    schema: z.unknown(),
  });
}

export async function listRoles(): Promise<RoleInfo[]> {
  return apiRequest("roles", {
    schema: z.array(roleSchema),
  });
}

const codeOptionSchema = z.object({
  id: z.number(),
  title: z.string(),
  parentId: z.number().nullable().optional(),
  standardCode: z.number().nullable().optional(),
  primaryCode: z.number().nullable().optional(),
  subCode: z.number().nullable().optional(),
  additionalInformation: z.string().nullable().optional(),
});

export type CodeOption = z.infer<typeof codeOptionSchema>;

export async function getCodeItems(primaryCode: number): Promise<CodeOption[]> {
  const items = await apiRequest(`codes/groups/${primaryCode}/items`, {
    schema: z.array(codeOptionSchema),
  });

  // حذف رکوردهای placeholder مانند ". . ."
  return items.filter((item) => (item.subCode ?? 0) > 1);
}

const userMenuSchema = z.object({
  id: z.string(),
  menuTitle: z.string(),
  parentId: z.string().nullable().optional(),
  pageCode: z.number().nullable().optional(),
  path: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  showMenu: z.boolean().optional(),
});

export type UserAvailableMenu = z.infer<typeof userMenuSchema>;

export async function getUserAvailableMenus(): Promise<UserAvailableMenu[]> {
  return apiRequest("user-management/available-menus", {
    schema: z.array(userMenuSchema),
  });
}

export async function getUserMenuAccess(userId: string): Promise<string[]> {
  return apiRequest(`user-management/${userId}/menu-access`, {
    schema: z.array(z.string()),
  });
}

export async function updateUserMenuAccess(userId: string, menuIds: string[]): Promise<void> {
  await apiRequest(`user-management/${userId}/menu-access`, {
    method: "PUT",
    body: { menuIds },
    schema: z.unknown(),
  });
}

const userUniversitySchema = z.object({
  id: z.number(),
  title: z.string(),
  parentUniversityId: z.number().nullable().optional(),
});

export type UserAvailableUniversity = z.infer<typeof userUniversitySchema>;

/**
 * دریافت فهرست دانشگاه‌های قابل تخصیص به کاربران
 */
export async function getUserAvailableUniversities(): Promise<UserAvailableUniversity[]> {
  return apiRequest("user-management/available-universities", {
    schema: z.array(userUniversitySchema),
  });
}

/**
 * دریافت دانشگاه‌های تخصیص‌یافته به یک کاربر
 */
export async function getUserUniversityAccess(userId: string): Promise<number[]> {
  return apiRequest(`user-management/${userId}/university-access`, {
    schema: z.array(z.number()),
  });
}

/**
 * به‌روزرسانی دسترسی دانشگاه‌های یک کاربر
 */
export async function updateUserUniversityAccess(userId: string, universityIds: number[]): Promise<void> {
  await apiRequest(`user-management/${userId}/university-access`, {
    method: "PUT",
    body: { universityIds },
    schema: z.unknown(),
  });
}

export async function bulkDeactivateUsers(userIds: string[]): Promise<void> {
  await apiRequest("user-management/bulk/deactivate", {
    method: "POST",
    body: { userIds },
    schema: z.unknown(),
  });
}

export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
  await apiRequest("user-management/bulk", {
    method: "DELETE",
    body: { userIds },
    schema: z.unknown(),
  });
}
