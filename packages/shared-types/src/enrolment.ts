export type EnrolmentStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "COMPLETED";

export type EnrolmentDto = {
  id: string;
  studentId: string;
  subjectId: string;
  academicYear: number;
  status: EnrolmentStatus;
  createdAt: string;
  updatedAt: string;
};
