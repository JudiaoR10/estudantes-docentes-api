import { StudentProfileStatus } from "@prisma/client";
import { AppError } from "../../../lib/errors";

// Invariante: só é possível criar Enrolment se o estudante estiver ACTIVE.
// Vive aqui (domínio) e não no service de enrolments, porque é uma regra
// sobre o significado de "estudante activo", propriedade do StudentProfile.
export function assertActiveForEnrolment(status: StudentProfileStatus) {
  if (status !== "ACTIVE") {
    throw AppError.conflict(
      "STUDENT_NOT_ACTIVE",
      "O estudante não está activo e não pode ser inscrito em disciplinas"
    );
  }
}

export function assertSelfOrPrivileged(
  requesterId: string,
  requesterRole: string,
  ownerUserId: string
) {
  const privileged = ["ADMIN", "COORDINATOR", "TEACHER"].includes(requesterRole);
  if (!privileged && requesterId !== ownerUserId) {
    throw AppError.forbidden("Só pode consultar ou alterar o seu próprio perfil");
  }
}
