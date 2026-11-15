
export type RoleInfo = {
  id: number;
  nameEn: string;
  nameFa: string;
};

export type UserRecord = {
  id: string;
  userName: string;

  firstName: string;
  lastName: string;
  fatherName: string;

  phone: string;
  email: string;
  nationalCode: string;

  gender: number | null;
  maritalStatus: number | null;
  religion: number | null;
  leftHanded: number | null;
  nationality: number | null;

  roles: RoleInfo[];
  isActive: boolean;

  createdAt: string;
  lastLoginAt: string | null;
  phoneNumberConfirmed?: boolean | null;
  expireDate: string | null;
};

/** فیلدهای مرتب‌سازی که API پشتیبانی می‌کند. */
export type UserSort =
  | "userName"
  | "createdDate"
  | "lastLoginDate"
  | "email";

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
  fatherName: string;
  phone: string;
  email: string;
  nationalCode: string;

  gender: number;
  maritalStatus: number;
  religion: number;
  leftHanded: number;
  nationality: number;

  expireDate: string;
  password: string;
  roleIds: number[];
  isActive: boolean;
};

export type UpdateUserInput = CreateUserInput;
