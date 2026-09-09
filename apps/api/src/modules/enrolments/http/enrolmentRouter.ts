import { Router } from "express";
import {
  createEnrolmentSchema,
  updateEnrolmentStatusSchema,
} from "@smart-campus/validation";
import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import { success } from "../../../lib/response";
import * as enrolmentService from "../application/enrolmentService";

export const enrolmentRouter = Router();

enrolmentRouter.get("/enrolments", authenticate, async (req, res, next) => {
  try {
    const { studentId, subjectId, academicYear } = req.query as {
      studentId?: string;
      subjectId?: string;
      academicYear?: string;
    };
    const enrolments = await enrolmentService.list(
      {
        studentId,
        subjectId,
        academicYear: academicYear ? Number(academicYear) : undefined,
      },
      { id: req.user!.id, role: req.user!.role }
    );
    success(res, enrolments);
  } catch (error) {
    next(error);
  }
});

enrolmentRouter.post("/enrolments", authenticate, async (req, res, next) => {
  try {
    const input = createEnrolmentSchema.parse(req.body);
    const created = await enrolmentService.create(
      input,
      { id: req.user!.id, role: req.user!.role },
      { actorId: req.user!.id, correlationId: res.locals.correlationId }
    );
    success(res, created, 201);
  } catch (error) {
    next(error);
  }
});

enrolmentRouter.patch(
  "/enrolments/:id/status",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  async (req, res, next) => {
    try {
      const input = updateEnrolmentStatusSchema.parse(req.body);
      const updated = await enrolmentService.updateStatus(req.params.id, input, {
        actorId: req.user!.id,
        correlationId: res.locals.correlationId,
      });
      success(res, updated);
    } catch (error) {
      next(error);
    }
  }
);
