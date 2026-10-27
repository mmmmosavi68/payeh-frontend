import { toLatinDigits } from "@/lib/digits";
import type { PagedResult } from "@/types/common";
import type { UserInput, UserQuery, UserRecord } from "@/types/user";
import { delay, MockApiError } from "./utils";

const firstNames = ["علی", "محمد", "زهرا", "فاطمه", "رضا", "مریم", "حسین", "سارا", "امیر", "نرگس", "مهدی", "الهام"];
const lastNames = ["موسوی", "رضایی", "کریمی", "احمدی", "حسینی", "محمدی", "جعفری", "صادقی", "نوری", "قاسمی", "اکبری", "یزدانی"];
const roleOrder = ["admin", "supervisor", "operator"] as const;

function seed(): UserRecord[] {
  const base = Date.UTC(2026, 9, 1);

  return Array.from({ length: 47 }, (_, i) => {
    const n = i + 1;
    const roles = [roleOrder[i % 3]];
    if (i % 7 === 0 && i % 3 !== 2) roles.push("operator");

    return {
      id: `u-${n}`,
      username: `user${String(n).padStart(2, "0")}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[(i * 5 + 3) % lastNames.length],
      phone: `0912${String(1000000 + i * 7919)}`,
      roles,
      isActive: i % 5 !== 0,
      createdAt: new Date(base - i * 3 * 86_400_000).toISOString(),
    };
  });
}

let store: UserRecord[] = seed();

export async function listUsers(
  query: UserQuery,
): Promise<PagedResult<UserRecord>> {
  await delay(450);

  const needle = toLatinDigits(query.search.trim()).toLowerCase();

  const filtered = store.filter((user) => {
    if (query.status === "active" && !user.isActive) return false;
    if (query.status === "inactive" && user.isActive) return false;
    if (!needle) return true;
    return [
      user.username,
      user.firstName,
      user.lastName,
      `${user.firstName} ${user.lastName}`,
      user.phone,
    ].some((value) => value.toLowerCase().includes(needle));
  });

  const factor = query.dir === "asc" ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    switch (query.sort) {
      case "username":
        return a.username.localeCompare(b.username) * factor;
      case "name":
        return (
          `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
            "fa",
          ) * factor
        );
      default:
        return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * factor;
    }
  });

  const start = (query.page - 1) * query.pageSize;

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

function isTaken(username: string, ignoreId?: string) {
  return store.some(
    (user) =>
      user.id !== ignoreId &&
      user.username.toLowerCase() === username.toLowerCase(),
  );
}

export async function createUser(
  input: UserInput & { password: string },
): Promise<UserRecord> {
  await delay(500);
  const { password, ...data } = input;
  void password;

  if (isTaken(data.username)) throw new MockApiError("username_taken");

  const record: UserRecord = {
    ...data,
    id: `u-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  store = [record, ...store];
  return record;
}

export async function updateUser(
  id: string,
  input: UserInput,
): Promise<UserRecord> {
  await delay(500);

  const current = store.find((user) => user.id === id);
  if (!current) throw new MockApiError("not_found");
  if (isTaken(input.username, id)) throw new MockApiError("username_taken");

  const updated: UserRecord = { ...current, ...input };
  store = store.map((user) => (user.id === id ? updated : user));
  return updated;
}

export async function deleteUser(id: string): Promise<void> {
  await delay(450);
  if (!store.some((user) => user.id === id)) throw new MockApiError("not_found");
  store = store.filter((user) => user.id !== id);
}