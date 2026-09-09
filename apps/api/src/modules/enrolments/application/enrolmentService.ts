import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../lib/errors";
import { audit } from "../../audit/audit";
import { assertActiveForEnrolment } from "../../students/domain/studentProfile";
import { assertCanTransition } from "../domain/enrolment";
import type {
  CreateEnrolmentInput,
  UpdateEnrolmentStatusInput,
} from "@smart-campus/validation";

type Ctx = { actorId: string; correlationId: string };
type Requester = { id: string; role: string };

export async function list(
  filters: { studentId?: string; subjectId?: string; academicYear?: number },
  requester: Requester
) {
  const where: Record<string, unknown> = {
    subjectId: filters.subjectId,
    academicYear: filters.academicYear,
  };

  if (requester.role === "STUDENT") {
    const own = await prisma.studentProfile.findUnique({
      where: { userId: requester.id },
    });
    if (!own) {
      return [];
    }
    where.studentId = own.id;
  } else if (filters.studentId) {
    where.studentId = filters.studentId;
  }

  return prisma.enrolment.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function create(
  input: CreateEnrolmentInput,
  requester: Requester,
  ctx: Ctx
) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: input.studentId },
  });
  if (!student) {
    throw AppError.notFound("STUDENT_NOT_FOUND", "Perfil de estudante não encontrado");
  }

  // STUDENT só pode inscrever-se a si próprio.
  if (requester.role === "STUDENT" && requester.id !== student.userId) {
    throw AppError.forbidden("Só pode criar inscrições para si próprio");
  }

  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) {
    throw AppError.notFound("SUBJECT_NOT_FOUND", "Disciplina não encontrada");
  }

  assertActiveForEnrolment(student.status);

  const existing = await prisma.enrolment.findUnique({
    where: {
      studentId_subjectId_academicYear: {
        studentId: input.studentId,
        subjectId: input.subjectId,
        academicYear: input.academicYear,
      },
    },
  });
  if (existing) {
    throw AppError.conflict(
      "DUPLICATE_ENROLMENT",
      "O estudante já está inscrito nesta disciplina neste ano lectivo"
    );
  }

  const created = await prisma.enrolment.create({ data: input });

  await audit({
    action: "ENROLMENT_CREATED",
    resource: "Enrolment",
    resourceId: created.id,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
  });

  return created;
}

export async function updateStatus(
  id: string,
  input: UpdateEnrolmentStatusInput,
  ctx: Ctx
) {
  const enrolment = await prisma.enrolment.findUnique({ where: { id } });
  if (!enrolment) {
    throw AppError.notFound("ENROLMENT_NOT_FOUND", "Inscrição não encontrada");
  }

  assertCanTransition(enrolment.status, input.status);

  const updated = await prisma.enrolment.update({
    where: { id },
    data: { status: input.status },
  });

  await audit({
    action: "ENROLMENT_STATUS_CHANGED",
    resource: "Enrolment",
    resourceId: updated.id,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    metadata: { from: enrolment.status, to: input.status },
  });

  return updated;
}
