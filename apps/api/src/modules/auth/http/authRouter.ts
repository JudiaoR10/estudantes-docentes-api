import { Router } from "express";
import { loginSchema } from "@smart-campus/validation";
import { success } from "../../../lib/response";
import { AppError } from "../../../lib/errors";
import { authenticate } from "../../../middleware/authenticate";
import * as authService from "../application/authService";

export const authRouter = Router();

authRouter.post("/auth/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    success(res, result, 200);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await authService.me(req.user!.id);
    success(res, result, 200);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new AppError(400, "VALIDATION_ERROR", "refreshToken em falta");
    }
    const result = await authService.refresh(refreshToken);
    success(res, result, 200);
  } catch (error) {
    next(error);
  }
});

// Nota: esta versão mínima não guarda/revoga refresh tokens em BD (o manual do
// Core recomenda hash em BD para permitir revogação real). O logout aqui é
// apenas "esquecer" os tokens no cliente; para revogação real, seria preciso
// um modelo RefreshToken e checar essa tabela em /auth/refresh.
authRouter.post("/auth/logout", authenticate, async (_req, res) => {
  success(res, { revoked: true }, 200);
});
