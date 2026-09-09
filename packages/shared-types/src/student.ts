export type StudentProfileStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "GRADUATED"
  | "WITHDRAWN";

export type StudentProfileDto = {
  id: string;
  userId: string;
  studentNumber: string;
  courseId: string;
  admissionYear: number;
  phone: string | null;
  status: StudentProfileStatus;
  createdAt: string;
  updatedAt: string;
};
