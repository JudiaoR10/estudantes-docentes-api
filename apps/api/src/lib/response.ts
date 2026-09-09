import { Response } from "express";

export function success<T>(
  res: Response,
  data: T,
  status = 200,
  meta: Record<string, unknown> = {}
) {
  const correlationId = res.locals.correlationId as string;
  res.status(status).json({
    data,
    meta: { correlationId, ...meta },
  });
}
