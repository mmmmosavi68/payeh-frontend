"use client";

import { useRouter } from "@/i18n/navigation";
import { logout } from "./api";

export function useLogout() {
  const router = useRouter();

  return async function handleLogout() {
    try {
      await logout();
    } catch {
      // BFF در هر حال کوکی‌ها را پاک می‌کند؛ خطای شبکه مانع خروج از صفحه نمی‌شود.
    }
    router.replace("/login");
  };
}