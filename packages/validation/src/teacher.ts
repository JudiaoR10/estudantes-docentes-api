import { z } from "zod";

export const teacherProfileStatusEnum = z.enum([
  "ACTIVE",
  "ON_LEAVE",
  "INACTIVE",
]);

export const createTeacherProfileSchema = z.object({
  userId: z.string().min(1),
  staffNumber: z.string().trim().min(2).max(30),
  departmentId: z.string().min(1),
  title: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(6).max(30).optional(),
});

export const updateTeacherProfileSchema = z
  .object({
    departmentId: z.string().min(1).optional(),
    title: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().min(6).max(30).optional(),
    status: teacherProfileStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido",
  });

export const updateOwnTeacherContactSchema = z.object({
  phone: z.string().trim().min(6).max(30),
});

export type CreateTeacherProfileInput = z.infer<
  typeof createTeacherProfileSchema
>;
export type UpdateTeacherProfileInput = z.infer<
  typeof updateTeacherProfileSchema
>;
