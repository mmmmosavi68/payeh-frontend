import type { SessionRecord } from "@/types/session";
import { delay, MockApiError } from "./utils";

const MINUTE = 60_000;

function seed(): SessionRecord[] {
  const now = Date.now();
  const iso = (offsetMinutes: number) =>
    new Date(now - offsetMinutes * MINUTE).toISOString();

  return [
    { id: "s-1", deviceType: "desktop", device: "Chrome · Windows 11", ip: "185.12.40.21", createdAt: iso(180), lastActiveAt: iso(1), current: true },
    { id: "s-2", deviceType: "mobile", device: "Safari · iPhone", ip: "5.200.14.77", createdAt: iso(1560), lastActiveAt: iso(45), current: false },
    { id: "s-3", deviceType: "desktop", device: "Edge · Windows 10", ip: "91.98.101.5", createdAt: iso(4320), lastActiveAt: iso(600), current: false },
    { id: "s-4", deviceType: "tablet", device: "Chrome · Android", ip: "37.255.8.140", createdAt: iso(10080), lastActiveAt: iso(2880), current: false },
  ];
}

let store: SessionRecord[] = seed();

export async function listSessions(): Promise<SessionRecord[]> {
  await delay(400);
  return [...store].sort(
    (a, b) => Number(b.current) - Number(a.current) ||
      Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt),
  );
}

export async function revokeSession(id: string): Promise<void> {
  await delay(400);
  const target = store.find((session) => session.id === id);
  if (!target) throw new MockApiError("not_found");
  if (target.current) throw new MockApiError("cannot_revoke_current");
  store = store.filter((session) => session.id !== id);
}

export async function revokeOtherSessions(): Promise<void> {
  await delay(500);
  store = store.filter((session) => session.current);
}