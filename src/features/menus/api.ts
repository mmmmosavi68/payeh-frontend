import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import type { MenuDto, CreateMenuDto, UpdateMenuDto } from "./types";

/**
 * ساختار اطلاعات منو در پاسخ API
 *
 * فیلدهای اختیاری و nullable برای سازگاری با خروجی Entity و DTO.
 */
const menuSchema = z.object({
  id: z.string(),
  parentId: z.string().nullish(),

  menuTitle: z.string(),
  pageCode: z.number().nullable().optional(),

  path: z.string().nullish(),
  version: z.string().nullish(),

  controllerName: z.string().nullish(),
  actionName: z.string().nullish(),

  showMenu: z.boolean().nullable().optional(),

  cssClass: z.string().nullish(),
  icon: z.string().nullish(),
  link: z.string().nullish(),

  isActive: z.boolean(),
});

/**
 * تبدیل خروجی API به مدل استاندارد فرانت‌اند.
 */
function toMenuRecord(menu: z.infer<typeof menuSchema>): MenuDto {
  return {
    id: menu.id,
    parentId: menu.parentId ?? null,

    menuTitle: menu.menuTitle,
    pageCode: menu.pageCode ?? null,

    path: menu.path ?? null,
    version: menu.version ?? null,

    controllerName: menu.controllerName ?? null,
    actionName: menu.actionName ?? null,

    showMenu: menu.showMenu ?? null,

    cssClass: menu.cssClass ?? null,
    icon: menu.icon ?? null,
    link: menu.link ?? null,

    isActive: menu.isActive,
  };
}

/**
 * دریافت تمام منوهای حذف‌نشده، شامل منوهای غیرفعال.
 */
export async function listMenus(): Promise<MenuDto[]> {
  const menus = await apiRequest("menus", {
    schema: z.array(menuSchema),
  });

  return menus.map(toMenuRecord);
}

/**
 * دریافت جزئیات یک منو.
 */
export async function getMenuById(id: string): Promise<MenuDto> {
  const menu = await apiRequest(`menus/${id}`, {
    schema: menuSchema,
  });

  return toMenuRecord(menu);
}

/**
 * ایجاد منوی جدید.
 */
export async function createMenu(input: CreateMenuDto): Promise<MenuDto> {
  const menu = await apiRequest("menus", {
    method: "POST",
    body: input,
    schema: menuSchema,
  });

  return toMenuRecord(menu);
}

/**
 * ویرایش منو.
 */
export async function updateMenu(id: string, input: UpdateMenuDto): Promise<MenuDto> {
  const menu = await apiRequest(`menus/${id}`, {
    method: "PUT",
    body: input,
    schema: menuSchema,
  });

  return toMenuRecord(menu);
}

/**
 * حذف نرم منو.
 */
export async function deleteMenu(id: string): Promise<void> {
  await apiRequest(`menus/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}
