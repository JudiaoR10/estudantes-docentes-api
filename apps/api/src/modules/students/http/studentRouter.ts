import { Router } from "express";
import {
  createStudentProfileSchema,
  updateStudentProfileSchema,
} from "@smart-campus/validation";
import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import { success } from "../../../lib/response";
import { AppError } from "../../../lib/errors";
import * as studentService from "../application/studentService";

export const studentRouter = Router();

studentRouter.get(
  "/students",
  authenticate,
  authorize("ADMIN", "COORDINATOR", "TEACHER"),
  async (req, res, next) => {
    try {
      const { courseId, status } = req.query as { courseId?: string; status?: string };
      const students = await studentService.list({ courseId, status });
      success(res, students);
    } catch (error) {
      next(error);
    }
  }
);

studentRouter.get("/students/me", authenticate, async (req, res, next) => {
  try {
    const student = await studentService.getByUserId(req.user!.id);
    success(res, student);
  } catch (error) {
    next(error);
  }
});

studentRouter.get("/students/:id", authenticate, async (req, res, next) => {
  try {
    const student = await studentService.getById(req.params.id);
    if (req.user!.role === "STUDENT" && req.user!.id !== student.userId) {
      throw AppError.forbidden("Só pode consultar o seu próprio perfil");
    }
    success(res, student);
  } catch (error) {
    next(error);
  }
});

studentRouter.post(
  "/students",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  async (req, res, next) => {
    try {
      const input = createStudentProfileSchema.parse(req.body);
      const created = await studentService.create(input, {
        actorId: req.user!.id,
        correlationId: res.locals.correlationId,
      });
      success(res, created, 201);
    } catch (error) {
      next(error);
    }
  }
);

studentRouter.patch("/students/:id", authenticate, async (req, res, next) => {
  try {
    const input = updateStudentProfileSchema.parse(req.body);
    const updated = await studentService.update(
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
