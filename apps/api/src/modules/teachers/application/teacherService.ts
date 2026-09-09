import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../lib/errors";
import { audit } from "../../audit/audit";
import { assertSelfOrPrivileged } from "../../students/domain/studentProfile";
import type {
  CreateTeacherProfileInput,
  UpdateTeacherProfileInput,
} from "@smart-campus/validation";

type Ctx = { actorId: string; correlationId: string };

export async function list(filters: { departmentId?: string; status?: string }) {
  return prisma.teacherProfile.findMany({
    where: {
      departmentId: filters.departmentId,
      status: filters.status as never,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id: string) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { id } });
  if (!teacher) {
    throw AppError.notFound("TEACHER_NOT_FOUND", "Perfil de docente não encontrado");
  }
  return teacher;
}

export async function getByUserId(userId: string) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId } });
  if (!teacher) {
    throw AppError.notFound("TEACHER_NOT_FOUND", "Perfil de docente não encontrado");
  }
  return teacher;
}

export async function create(input: CreateTeacherProfileInput, ctx: Ctx) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    throw AppError.notFound("USER_NOT_FOUND", "Utilizador não encontrado");
  }
  if (user.role !== "TEACHER") {
    throw AppError.badRequest("O utilizador indicado não tem a role TEACHER");
  }

  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
  });
  if (!department) {
    throw AppError.notFound("DEPARTMENT_NOT_FOUND", "Departamento não encontrado");
  }

  const existing = await prisma.teacherProfile.findUnique({
    where: { userId: input.userId },
  });
  if (existing) {
    throw AppError.conflict("TEACHER_PROFILE_EXISTS", "Este utilizador já tem um perfil de docente");
  }

  const created = await prisma.teacherProfile.create({ data: input });

  await audit({
    action: "TEACHER_PROFILE_CREATED",
    resource: "TeacherProfile",
    resourceId: created.id,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
  });

  return created;
}

export async function update(
  id: string,
  input: UpdateTeacherProfileInput,
  requester: { id: string; role: string },
  ctx: Ctx
) {
  const teacher = await getById(id);
  assertSelfOrPrivileged(requester.id, requester.role, teacher.userId);

  const isSelf = requester.id === teacher.userId;
  const isPrivileged = requester.role === "ADMIN" || requester.role === "COORDINATOR";

  if (isSelf && !isPrivileged) {
    const allowedKeys = Object.keys(input).every((key) => key === "phone");
    if (!allowedKeys) {
      throw AppError.forbidden("Só pode alterar o seu próprio contacto");
    }
  }

  if (input.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!department) {
      throw AppError.notFound("DEPARTMENT_NOT_FOUND", "Departamento não encontrado");
    }
  }

  const updated = await prisma.teacherProfile.update({ where: { id }, data: input });

  await audit({
    action: "TEACHER_PROFILE_UPDATED",
    resource: "TeacherProfile",
    resourceId: updated.id,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    metadata: { fields: Object.keys(input) },
  });

  return updated;
}
