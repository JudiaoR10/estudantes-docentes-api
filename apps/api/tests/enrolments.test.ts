import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

// Pré-requisito: base de dados de teste com seed aplicada
// (npm run db:seed) e as variáveis de ambiente carregadas.
const app = createApp();

async function loginAs(email: string, password = "Admin123!") {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
  return res.body.data.tokens.accessToken as string;
}

describe("Módulo G2 — Enrolments", () => {
  let coordinatorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    coordinatorToken = await loginAs("coordinator@smartcampus.demo");
    studentToken = await loginAs("student@smartcampus.demo");
  });

  it("rejeita listagem sem token", async () => {
    const res = await request(app).get("/api/v1/enrolments");
    expect(res.status).toBe(401);
  });

  it("estudante só vê as suas próprias inscrições", async () => {
    const res = await request(app)
      .get("/api/v1/enrolments")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("rejeita alterar estado sem role adequada", async () => {
    const list = await request(app)
      .get("/api/v1/enrolments")
      .set("Authorization", `Bearer ${coordinatorToken}`);
    const enrolmentId = list.body.data[0]?.id;

    const res = await request(app)
      .patch(`/api/v1/enrolments/${enrolmentId}/status`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ status: "COMPLETED" });

    expect(res.status).toBe(403);
  });

  it("rejeita inscrição duplicada (mesma disciplina/ano)", async () => {
    const students = await request(app)
      .get("/api/v1/students")
      .set("Authorization", `Bearer ${coordinatorToken}`);
    const student = students.body.data[0];

    const enrolments = await request(app)
      .get("/api/v1/enrolments")
      .set("Authorization", `Bearer ${coordinatorToken}`);
    const existing = enrolments.body.data[0];

    const res = await request(app)
      .post("/api/v1/enrolments")
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .send({
        studentId: student.id,
        subjectId: existing.subjectId,
        academicYear: existing.academicYear,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DUPLICATE_ENROLMENT");
  });
});
