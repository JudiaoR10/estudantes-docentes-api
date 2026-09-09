import { NextFunction, Request, Response } from "express";
import { RoleCode } from "@prisma/client";
import { AppError } from "../lib/errors";

export function authorize(...roles: RoleCode[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthenticated());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden());
    }
    next();
  };
}
