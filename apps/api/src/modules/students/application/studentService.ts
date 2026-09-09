import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../lib/errors";
import { audit } from "../../audit/audit";
import { assertSelfOrPrivileged } from "../domain/studentProfile";
import type {
  CreateStudentProfileInput,
  UpdateStudentProfileInput,
} from "@smart-campus/validation";

type Ctx = { actorId: string; correlationId: string };

export async function list(filters: { courseId?: string; status?: string }) {
  const students = await prisma.studentProfile.findMany({
    where: {
      courseId: filters.courseId,
      status: filters.status as never,
    },
    orderBy: { createdAt: "desc" },
  });
  return students;
}

export async function getById(id: string) {
  const student = await prisma.studentProfile.findUnique({ where: { id } });
  if (!student) {
    throw AppError.notFound("STUDENT_NOT_FOUND", "Perfil de estudante não encontrado");
  }
  return student;
}

export async function getByUserId(userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) {
    throw AppError.notFound("STUDENT_NOT_FOUND", "Perfil de estudante não encontrado");
  }
  return student;
}

export async function create(input: CreateStudentProfileInput, ctx: Ctx) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    throw AppError.notFound("USER_NOT_FOUND", "Utilizador não encontrado");
  }
  if (user.role !== "STUDENT") {
    throw AppError.badRequest("O utilizador indicado não tem a role STUDENT");
  }

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw AppError.notFound("COURSE_NOT_FOUND", "Curso não encontrado");
  }

  const existing = await prisma.studentProfile.findUnique({
    where: { userId: input.userId },
  });
  if (existing) {
    throw AppError.conflict("STUDENT_PROFILE_EXISTS", "Este utilizador já tem um perfil de estudante");
  }

  const created = await prisma.studentProfile.create({ data: input });

  await audit({
    action: "STUDENT_PROFILE_CREATED",
    resource: "StudentProfile",
    resourceId: created.id,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
  });

  return created;
}

export async function update(
  id: string,
  input: UpdateStudentProfileInput,
  requester: { id: string; role: string },
  ctx: Ctx
) {
  const student = await getById(id);
  assertSelfOrPrivileged(requester.id, requester.role, student.userId);

  const isSelf = requester.id === student.userId;
  const isPrivileged = requester.role === "ADMIN" || requester.role === "COORDINATOR";

  // Um STUDENT só pode alterar o próprio contacto (phone); nunca curso ou estado.
  if (isSelf && !isPrivileged) {
    const allowedKeys = Object.keys(input).every((key) => key === "phone");
    if (!allowedKeys) {
      throw AppError.forbidden("Só pode alterar o seu próprio contacto");
    }
  }

  if (input.courseId) {
    const course = await prisma.course.findUnique({ where: { id: input.courseId } });
    if (!course) {
      throw AppError.notFound("COURSE_NOT_FOUND", "Curso não encontrado");
    }
  }

  const updated = await prisma.studentProfile.update({
    where: { id },
    data: input,
  });

  await audit({
    action: "STUDENT_PROFILE_UPDATED",
    resource: "StudentProfile",
    resourceId: updated.id,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    metadata: { fields: Object.keys(input) },
  });

  return updated;
}
