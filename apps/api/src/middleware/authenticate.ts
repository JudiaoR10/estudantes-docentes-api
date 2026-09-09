import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../lib/errors";
import { RoleCode } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  role: RoleCode;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthenticated("Token em falta"));
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as {
      sub: string;
      role: RoleCode;
    };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(AppError.unauthenticated("Token inválido ou expirado"));
  }
}
