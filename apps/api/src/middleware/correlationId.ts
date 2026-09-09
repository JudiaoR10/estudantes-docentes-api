import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-correlation-id");
  const id = incoming && incoming.trim().length > 0 ? incoming : uuid();
  res.locals.correlationId = id;
  res.setHeader("x-correlation-id", id);
  next();
}
