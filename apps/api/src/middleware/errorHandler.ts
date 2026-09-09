import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const correlationId = res.locals.correlationId as string;

  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.details,
      correlationId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      correlationId,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({
      code: "CONFLICT",
      message: "Registo duplicado",
      details: err.meta,
      correlationId,
    });
  }

  // Falha inesperada: nunca expor stack trace ou detalhes internos.
  // eslint-disable-next-line no-console
  console.error(`[${correlationId}]`, err);
  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Erro interno inesperado",
    correlationId,
  });
}
