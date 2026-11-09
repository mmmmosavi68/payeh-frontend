import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

export const menuPermissionSchema = z.object({
  id: z.string(), menuTitle: z.string(), parentId: z.string().nullable(), pageCode: z.number().nullable(),
  version: z.string().nullable(), controllerName: z.string().nullable(), actionName: z.string().nullable(),
  showMenu: z.boolean(), icon: z.string().nullable(), link: z.string().nullable(),
});
export type MenuPermission = z.infer<typeof menuPermissionSchema>;
export function getMyPermissions(): Promise<MenuPermission[]> {
  return apiRequest("permissions/me", { schema: z.array(menuPermissionSchema) });
}
