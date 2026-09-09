export type TeacherProfileStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";

export type TeacherProfileDto = {
  id: string;
  userId: string;
  staffNumber: string;
  departmentId: string;
  title: string | null;
  phone: string | null;
  status: TeacherProfileStatus;
  createdAt: string;
  updatedAt: string;
};
