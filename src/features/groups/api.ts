import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

import type { AddGroupUserDto, CreateGroupDto, GroupDto, GroupMemberDto, GroupMenuDto, UpdateGroupDto, UpdateGroupMenuAccessDto } from "./types";

// ------------------------------
// Schemas
// ------------------------------

const groupSchema = z.object({
  id: z.string(),
  groupName: z.string(),
  isActive: z.boolean(),
  createdDate: z.string(),
  userCount: z.number(),
});

const groupMemberSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  isActive: z.boolean(),
});

const groupMenuSchema = z.object({
  id: z.string(),
  menuTitle: z.string(),
  parentId: z.string().nullish(),
  pageCode: z.number().nullish(),
  path: z.string().nullish(),
  icon: z.string().nullish(),
  showMenu: z.boolean().nullish(),
});

// ------------------------------
// Groups
// ------------------------------

/**
 * دریافت فهرست گروه‌ها
 */
export async function listGroups(): Promise<GroupDto[]> {
  return apiRequest("groups", {
    schema: z.array(groupSchema),
  });
}

/**
 * دریافت اطلاعات یک گروه
 */
export async function getGroupById(id: string): Promise<GroupDto> {
  return apiRequest(`groups/${id}`, {
    schema: groupSchema,
  });
}

/**
 * ایجاد گروه جدید
 */
export async function createGroup(input: CreateGroupDto): Promise<GroupDto> {
  return apiRequest("groups", {
    method: "POST",
    body: input,
    schema: groupSchema,
  });
}

/**
 * ویرایش اطلاعات گروه
 */
export async function updateGroup(id: string, input: UpdateGroupDto): Promise<GroupDto> {
  return apiRequest(`groups/${id}`, {
    method: "PUT",
    body: input,
    schema: groupSchema,
  });
}

/**
 * حذف نرم گروه
 */
export async function deleteGroup(id: string): Promise<void> {
  await apiRequest(`groups/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}

// ------------------------------
// Group Members
// ------------------------------

/**
 * دریافت اعضای گروه
 */
export async function listGroupMembers(groupId: string): Promise<GroupMemberDto[]> {
  const members = await apiRequest(`groups/${groupId}/users`, {
    schema: z.array(groupMemberSchema),
  });

  return members.map((member) => ({
    ...member,
    firstName: member.firstName ?? null,
    lastName: member.lastName ?? null,
    phoneNumber: member.phoneNumber ?? null,
  }));
}

/**
 * افزودن کاربر به گروه
 */
export async function addGroupMember(groupId: string, input: AddGroupUserDto): Promise<void> {
  await apiRequest(`groups/${groupId}/users`, {
    method: "POST",
    body: input,
    schema: z.unknown(),
  });
}

/**
 * افزودن گروهی کاربران به گروه
 */
export async function addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
  await apiRequest(`groups/${groupId}/users/bulk`, {
    method: "POST",
    body: { userIds },
    schema: z.unknown(),
  });
}

/**
 * حذف کاربر از گروه
 */
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiRequest(`groups/${groupId}/users/${userId}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}

/**
 * حذف گروهی کاربران از گروه
 */
export async function removeGroupMembers(groupId: string, userIds: string[]): Promise<void> {
  await apiRequest(`groups/${groupId}/users/bulk`, {
    method: "DELETE",
    body: { userIds },
    schema: z.unknown(),
  });
}

// ------------------------------
// Group Menu Access
// ------------------------------

/**
 * دریافت منوهای فعال و قابل انتخاب
 */
export async function listAvailableGroupMenus(): Promise<GroupMenuDto[]> {
  const menus = await apiRequest("groups/available-menus", {
    schema: z.array(groupMenuSchema),
  });

  return menus.map((menu) => ({
    ...menu,
    parentId: menu.parentId ?? null,
    pageCode: menu.pageCode ?? null,
    path: menu.path ?? null,
    icon: menu.icon ?? null,
    showMenu: menu.showMenu ?? null,
  }));
}

/**
 * دریافت شناسه منوهای اختصاص‌یافته به گروه
 */
export async function getGroupMenuAccess(groupId: string): Promise<string[]> {
  return apiRequest(`groups/${groupId}/menu-access`, {
    schema: z.array(z.string()),
  });
}

/**
 * ذخیره یا جایگزینی دسترسی منوهای گروه
 */
export async function updateGroupMenuAccess(groupId: string, input: UpdateGroupMenuAccessDto): Promise<void> {
  await apiRequest(`groups/${groupId}/menu-access`, {
    method: "PUT",
    body: input,
    schema: z.unknown(),
  });
}
