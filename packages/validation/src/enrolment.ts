import { z } from "zod";

export const enrolmentStatusEnum = z.enum([
  "PENDING",
  "ACTIVE",
  "CANCELLED",
  "COMPLETED",
]);

export const createEnrolmentSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  academicYear: z.number().int().min(2000).max(2100),
});

export const updateEnrolmentStatusSchema = z.object({
  status: enrolmentStatusEnum,
});

export type CreateEnrolmentInput = z.infer<typeof createEnrolmentSchema>;
export type UpdateEnrolmentStatusInput = z.infer<
  typeof updateEnrolmentStatusSchema
>;
