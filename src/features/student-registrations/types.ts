export interface RegistrationUniversityDto {
  universityId: number;
  universityTitle: string;
}

export interface RegistrationExamDto {
  examId: string;
  examTitle: string;
}

export interface ExamRegistrationCustomFieldValueDto {
  examCustomFieldId: string;
  fieldLabel: string | null;
  value: string | null;
}

export interface ExamRegistrationDto {
  id: string;
  examId: string;
  universityId: number;
  universityTitle: string | null;
  examVenueUniversityId: number;
  examVenueUniversityTitle: string | null;
  universityExamCapacityId: string;
  universityExamGuestCapacityId: string | null;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  nationalCode: string;
  genderId: number | null;
  birthCertificateNumber: string | null;
  birthDate: string | null;
  studentNumber: string | null;
  entryYear: number | null;
  phoneNumber: string | null;
  emergencyPhoneNumber: string | null;
  createdDate: string;
  customFieldValues: ExamRegistrationCustomFieldValueDto[];
}
