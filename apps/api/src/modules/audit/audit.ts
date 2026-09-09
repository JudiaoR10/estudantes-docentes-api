import { prisma } from "../../lib/prisma";

export type AuditInput = {
  action: string;
  resource: string;
  resourceId: string;
  actorId?: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput) {
  await prisma.auditEvent.create({
    data: {
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      actorId: input.actorId,
      correlationId: input.correlationId,
      metadata: input.metadata,
    },
  });
}
