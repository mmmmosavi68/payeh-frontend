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

/** دانشگاه قابل انتخاب به‌عنوان دانشگاه مهمان */
export interface GuestUniversityDto {
  id: number;
  title: string;
  universityTypeTitle: string | null;
  region: number;
}

/** ظرفیت ثبت‌شده برای دانشگاه مهمان */
export interface UniversityExamGuestCapacityDto {
  id: string;
  universityExamCapacityId: string;
  guestUniversityId: number;
  guestUniversityTitle: string;
  capacity: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/** اطلاعات موردنیاز برای ثبت یا ویرایش ظرفیت مهمان */
export interface SaveUniversityExamGuestCapacityDto {
  capacity: number;
}
