import { z } from "zod";

export const studentProfileStatusEnum = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "GRADUATED",
  "WITHDRAWN",
]);

export const createStudentProfileSchema = z.object({
  userId: z.string().min(1),
  studentNumber: z.string().trim().min(2).max(30),
  courseId: z.string().min(1),
  admissionYear: z.number().int().min(2000).max(2100),
  phone: z.string().trim().min(6).max(30).optional(),
});

export const updateStudentProfileSchema = z
  .object({
    courseId: z.string().min(1).optional(),
    admissionYear: z.number().int().min(2000).max(2100).optional(),
    phone: z.string().trim().min(6).max(30).optional(),
    status: studentProfileStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido",
  });

// Um STUDENT só pode alterar o próprio contacto, nunca curso ou estado.
export const updateOwnStudentContactSchema = z.object({
  phone: z.string().trim().min(6).max(30),
});

export type CreateStudentProfileInput = z.infer<
  typeof createStudentProfileSchema
>;
export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;
