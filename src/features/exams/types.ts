export interface ExamDto {
  id: string;
  title: string;

  examSessionId: string;
  examSessionTitle: string | null;
  examDate: string;

  examTypeId: number;
  examTypeTitle: string | null;

  examModeId: number;
  examModeTitle: string | null;

  registrationStartDate: string;
  registrationEndDate: string;
  editStartDate: string | null;
  editEndDate: string | null;

  description: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ExamSessionOption {
  id: string;
  title: string;
  examDate: string;
}

export interface ExamFilters {
  search?: string;
  examSessionId?: string;
  examTypeId?: number;
  examModeId?: number;
  isActive?: boolean;
}

export interface CreateExamDto {
  title: string;
  examSessionId: string;
  examTypeId: number;
  examModeId: number;
  registrationStartDate: string;
  registrationEndDate: string;
  editStartDate: string | null;
  editEndDate: string | null;
  description: string | null;
}

export interface UpdateExamDto extends CreateExamDto {
  isActive: boolean;
}