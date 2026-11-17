
export interface UniversityDto {
  id: number;
  title: string;
  universityTypeId: number;
  universityTypeTitle: string | null;
  region: number;
  capacityApproved: number;
  parentUniversityId: number | null;
  parentUniversityTitle: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface CreateUniversityDto {
  title: string;
  universityTypeId: number;
  region: number;
  capacityApproved: number;
  parentUniversityId: number | null;
}

export interface UpdateUniversityDto extends CreateUniversityDto {
  isActive: boolean;
}

export interface UniversityFilters {
  search?: string;
  universityTypeId?: number;
  region?: number;
  parentUniversityId?: number;
  isActive?: boolean;
}
