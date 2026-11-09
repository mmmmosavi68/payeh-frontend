"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMyPermissions, type MenuPermission } from "./api";

type PermissionContextValue = { items: MenuPermission[]; loading: boolean; failed: boolean; reload: () => void };
const PermissionContext = createContext<PermissionContextValue | null>(null);
export function PermissionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuPermission[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [version, setVersion] = useState(0);
  useEffect(() => { let cancelled = false; setLoading(true); setFailed(false); getMyPermissions().then(value => { if (!cancelled) setItems(value); }).catch(() => { if (!cancelled) setFailed(true); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [version]);
  const value = useMemo(() => ({ items, loading, failed, reload: () => setVersion(v => v + 1) }), [items, loading, failed]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}
export function usePermissionContext() { const value = useContext(PermissionContext); if (!value) throw new Error("usePermissionContext must be used inside PermissionProvider"); return value; }
