export interface GroupDto {
  id: string;
  groupName: string;
  isActive: boolean;
  createdDate: string;
  userCount: number;
}

export interface CreateGroupDto {
  groupName: string;
  isActive: boolean;
}

export type UpdateGroupDto = CreateGroupDto;

export interface GroupMemberDto {
  userId: string;
  userName: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface AddGroupUserDto {
  userId: string;
}

export interface GroupMenuDto {
  id: string;
  menuTitle: string;
  parentId: string | null;
  pageCode: number | null;
  path: string | null;
  icon: string | null;
  showMenu: boolean | null;
}

export interface UpdateGroupMenuAccessDto {
  menuIds: string[];
}

export interface GroupFormValues {
  groupName: string;
  isActive: boolean;
}
