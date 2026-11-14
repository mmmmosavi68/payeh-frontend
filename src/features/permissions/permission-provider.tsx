"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMyPermissions,
  type MenuPermission,
} from "./api";

type PermissionContextValue = {
  items: MenuPermission[];
  loading: boolean;
  failed: boolean;
  reload: () => void;
};

type PermissionResult = {
  version: number;
  items: MenuPermission[];
  failed: boolean;
};

const EMPTY_PERMISSIONS: MenuPermission[] = [];

const PermissionContext =
  createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [version, setVersion] = useState(0);

  const [result, setResult] =
    useState<PermissionResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyPermissions()
      .then((items) => {
        if (cancelled) return;

        setResult({
          version,
          items,
          failed: false,
        });
      })
      .catch(() => {
        if (cancelled) return;

        setResult({
          version,
          items: EMPTY_PERMISSIONS,
          failed: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo<PermissionContextValue>(
    () => ({
      items: result?.items ?? EMPTY_PERMISSIONS,
      loading: result?.version !== version,
      failed:
        result?.version === version && result.failed,
      reload: () => setVersion((current) => current + 1),
    }),
    [result, version],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const value = useContext(PermissionContext);

  if (!value) {
    throw new Error(
      "usePermissionContext must be used inside PermissionProvider",
    );
  }

  return value;
}