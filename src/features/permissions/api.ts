import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

export const menuPermissionSchema = z.object({
  id: z.coerce.string(),
  menuTitle: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  parentId: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => (v != null ? String(v) : null)),
  pageCode: z.coerce
    .number()
    .nullish()
    .transform((v) => v ?? null),
  version: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => (v != null ? String(v) : null)),
  controllerName: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  actionName: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  showMenu: z
    .boolean()
    .nullish()
    .transform((v) => v ?? true),
  icon: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  link: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
});

export type MenuPermission = z.infer<typeof menuPermissionSchema>;

export async function getMyPermissions(): Promise<MenuPermission[]> {
  const data = await apiRequest("permissions/me", {
    schema: z.array(menuPermissionSchema).nullish(),
  });
  return data ?? [];
}
