import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { correlationId } from "./middleware/correlationId";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/http/authRouter";
import { studentRouter } from "./modules/students/http/studentRouter";
import { teacherRouter } from "./modules/teachers/http/teacherRouter";
import { enrolmentRouter } from "./modules/enrolments/http/enrolmentRouter";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: "100kb" }));
  app.use(correlationId);

  // /health fica fora de /api/v1: serve à infraestrutura, não é contrato de domínio.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const v1 = express.Router();
  v1.use(authRouter);
  v1.use(studentRouter);
  v1.use(teacherRouter);
  v1.use(enrolmentRouter);

  app.use("/api/v1", v1);

  app.use(errorHandler);

  return app;
}
