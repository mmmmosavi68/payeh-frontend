import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { parseApiDate } from "@/lib/dates";
import type { SessionRecord } from "@/types/session";

const sessionSchema = z.object({
  id: z.string(),
  deviceName: z.string().nullish(),
  userAgent: z.string().nullish(),
  ipAddress: z.string().nullish(),
  createdDate: z.string(),
  lastUsedAt: z.string().nullish(),
  refreshTokenExpireDate: z.string(),
  isCurrent: z.boolean(),
});

function deviceTypeFrom(userAgent?: string | null): SessionRecord["deviceType"] {
  const ua = userAgent ?? "";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "tablet";
  }
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export async function listSessions(): Promise<SessionRecord[]> {
  const items = await apiRequest("auth/sessions", {
    schema: z.array(sessionSchema),
  });

  return items
    .map((item) => {
      const createdAt = parseApiDate(item.createdDate);
      const lastActiveAt = item.lastUsedAt ? parseApiDate(item.lastUsedAt) : createdAt;

      return {
        id: item.id,
        deviceType: deviceTypeFrom(item.userAgent),
        device: item.deviceName || "—",
        ip: item.ipAddress || "—",
        createdAt: createdAt.toISOString(),
        lastActiveAt: lastActiveAt.toISOString(),
        refreshTokenExpireAt: parseApiDate(item.refreshTokenExpireDate).toISOString(),
        current: item.isCurrent,
      } satisfies SessionRecord;
    })
    .sort((a, b) => Number(b.current) - Number(a.current) || Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt));
}

export async function revokeSession(id: string): Promise<void> {
  await apiRequest(`auth/sessions/${id}`, {
    method: "DELETE",
    schema: z.unknown(),
  });
}

/**
 * API فقط «خروج از همه» (شامل دستگاه فعلی) دارد؛ برای «سایر دستگاه‌ها»
 * نشست‌های غیرفعلی یکی‌یکی باطل می‌شوند.
 */
export async function revokeOtherSessions(): Promise<void> {
  const sessions = await listSessions();
  await Promise.all(sessions.filter((session) => !session.current).map((session) => revokeSession(session.id)));
}
