export interface ExamSessionDto {
  id: string;
  title: string;
  examDate: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface CreateExamSessionDto {
  title: string;
  examDate: string;
  startTime: string;
  endTime: string;
}

export interface UpdateExamSessionDto extends CreateExamSessionDto {
  isActive: boolean;
}

export interface ExamSessionFilters {
  search?: string;
  isActive?: boolean;
}
