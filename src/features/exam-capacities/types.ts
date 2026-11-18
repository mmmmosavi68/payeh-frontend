export interface ExamCapacityUniversityDto {
  id: number;
  title: string;
  universityTypeId: number;
  universityTypeTitle: string | null;
  region: number;
  capacityApproved: number;
  parentUniversityId: number | null;
  parentUniversityTitle: string | null;
  isCampus: boolean;
}

export interface UniversityExamCapacityExamDto {
  examId: string;
  examTitle: string;
  examSessionId: string;
  examSessionTitle: string | null;
  examDate: string;
  examModeId: number;
  examModeTitle: string | null;
  isCapacityDefined: boolean;
  capacityId: string | null;
  allocatedCapacity: number | null;
  ownCapacity: number | null;
  capacityIsActive: boolean | null;
}

export interface SaveUniversityExamCapacityDto {
  allocatedCapacity: number;
  ownCapacity: number;
}
