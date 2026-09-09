import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";
import { env } from "../../../config/env";
import { AppError } from "../../../lib/errors";
import type { LoginInput } from "@smart-campus/validation";

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHENTICATED", "Credenciais inválidas");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "UNAUTHENTICATED", "Credenciais inválidas");
  }

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
  const refreshToken = jwt.sign({ sub: user.id }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("USER_NOT_FOUND", "Utilizador não encontrado");
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
  };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { sub: string };
  } catch {
    throw new AppError(401, "UNAUTHENTICATED", "Refresh token inválido ou expirado");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHENTICATED", "Utilizador inválido");
  }

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
  const newRefreshToken = jwt.sign({ sub: user.id }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

  return { tokens: { accessToken, refreshToken: newRefreshToken } };
}
