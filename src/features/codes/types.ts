export interface CodeDto {
  id: number;
  title: string;
  parentId: number | null;
  standardCode: number | null;
  primaryCode: number | null;
  subCode: number | null;
  additionalInformation: string | null;
  isActive: boolean;
}

export interface CreateCodeDto {
  title: string;
  parentId: number;
  standardCode: number | null;
  primaryCode: number | null;
  subCode: number;
  additionalInformation: string | null;
}

export interface UpdateCodeDto extends CreateCodeDto {
  isActive: boolean;
}

export type CodeFormKind = "group" | "item";
