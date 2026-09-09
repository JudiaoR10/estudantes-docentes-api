import { Router } from "express";
import {
  createTeacherProfileSchema,
  updateTeacherProfileSchema,
} from "@smart-campus/validation";
import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import { success } from "../../../lib/response";
import * as teacherService from "../application/teacherService";

export const teacherRouter = Router();

// Directório de docentes é público na plataforma (todos autenticados).
teacherRouter.get("/teachers", authenticate, async (req, res, next) => {
  try {
    const { departmentId, status } = req.query as {
      departmentId?: string;
      status?: string;
    };
    const teachers = await teacherService.list({ departmentId, status });
    success(res, teachers);
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/teachers/me", authenticate, async (req, res, next) => {
  try {
    const teacher = await teacherService.getByUserId(req.user!.id);
    success(res, teacher);
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/teachers/:id", authenticate, async (req, res, next) => {
  try {
    const teacher = await teacherService.getById(req.params.id);
    success(res, teacher);
  } catch (error) {
    next(error);
  }
});

teacherRouter.post(
  "/teachers",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const input = createTeacherProfileSchema.parse(req.body);
      const created = await teacherService.create(input, {
        actorId: req.user!.id,
        correlationId: res.locals.correlationId,
      });
      success(res, created, 201);
    } catch (error) {
      next(error);
    }
  }
);

teacherRouter.patch("/teachers/:id", authenticate, async (req, res, next) => {
  try {
    const input = updateTeacherProfileSchema.parse(req.body);
    const updated = await teacherService.update(
      req.params.id,
      input,
      { id: req.user!.id, role: req.user!.role },
      { actorId: req.user!.id, correlationId: res.locals.correlationId }
    );
    success(res, updated);
  } catch (error) {
    next(error);
  }
});
