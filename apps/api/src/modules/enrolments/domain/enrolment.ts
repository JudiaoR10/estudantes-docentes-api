import { AppError } from "../../../lib/errors";

export function assertCanTransition(current: string, next: string) {
  const allowed: Record<string, string[]> = {
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!allowed[current]?.includes(next)) {
    throw AppError.conflict(
      "INVALID_STATUS_TRANSITION",
      `Não é possível mudar de ${current} para ${next}`
    );
  }
}
