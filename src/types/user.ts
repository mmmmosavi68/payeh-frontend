export const roleKeys = ["admin", "supervisor", "operator"] as const;
export type RoleKey = (typeof roleKeys)[number];

export type UserRecord = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: RoleKey[];
  isActive: boolean;
  createdAt: string;
};

export type UserInput = Omit<UserRecord, "id" | "createdAt">;

export type UserQuery = {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | "active" | "inactive";
  sort: "name" | "username" | "createdAt";
  dir: "asc" | "desc";
};