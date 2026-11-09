"use client";

import type { ReactNode } from "react";
import { usePermissionContext } from "./permission-provider";

export function usePermission(controller: string, action: string) {
  const { items, loading, failed } = usePermissionContext();
  const allowed = items.some(item => item.controllerName?.toLowerCase() === controller.toLowerCase() && item.actionName?.toLowerCase() === action.toLowerCase());
  return { allowed, loading, failed };
}
export function Can({ controller, action, children, fallback = null }: { controller: string; action: string; children: ReactNode; fallback?: ReactNode }) {
  const permission = usePermission(controller, action);
  if (permission.loading || permission.failed || !permission.allowed) return <>{fallback}</>;
  return <>{children}</>;
}
