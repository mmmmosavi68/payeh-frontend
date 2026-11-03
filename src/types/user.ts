export type RoleInfo = { id: number; nameEn: string; nameFa: string };

export type UserRecord = {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalCode: string;
  roles: RoleInfo[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

/** فیلدهای مرتب‌سازی که API پشتیبانی می‌کند. */
export type UserSort = "userName" | "createdDate" | "lastLoginDate";

export type UserQuery = {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | "active" | "inactive";
  roleId: number | null;
  sort: UserSort;
  dir: "asc" | "desc";
};

export type CreateUserInput = {
  userName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalCode: string;
  password: string;
  roleIds: number[];
  isActive: boolean;
};

export type UpdateUserInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  roleIds: number[];
  isActive: boolean;
};
