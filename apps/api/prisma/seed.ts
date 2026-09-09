import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@smartcampus.demo" },
    update: {},
    create: {
      email: "admin@smartcampus.demo",
      passwordHash,
      fullName: "Admin Demo",
      role: "ADMIN",
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { email: "coordinator@smartcampus.demo" },
    update: {},
    create: {
      email: "coordinator@smartcampus.demo",
      passwordHash,
      fullName: "Coordenador Demo",
      role: "COORDINATOR",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@smartcampus.demo" },
    update: {},
    create: {
      email: "student@smartcampus.demo",
      passwordHash,
      fullName: "Estudante Demo",
      role: "STUDENT",
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@smartcampus.demo" },
    update: {},
    create: {
      email: "teacher@smartcampus.demo",
      passwordHash,
      fullName: "Docente Demo",
      role: "TEACHER",
    },
  });

  // Stubs do G1 — apenas para o G2 ter FKs válidas em ambiente demo.
  const department = await prisma.department.upsert({
    where: { name: "Engenharia Informática" },
    update: {},
    create: { name: "Engenharia Informática" },
  });

  const course = await prisma.course.upsert({
    where: { name: "Licenciatura em Informática" },
    update: {},
    create: { name: "Licenciatura em Informática" },
  });

  const subject = await prisma.subject.upsert({
    where: { code: "PTP3" },
    update: {},
    create: { code: "PTP3", name: "Projecto e Trabalho Prático III" },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentNumber: "2026-0001",
      courseId: course.id,
      admissionYear: 2024,
      phone: "+258 84 000 0001",
      status: "ACTIVE",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      staffNumber: "T-0001",
      departmentId: department.id,
      title: "Assistente",
      phone: "+258 84 000 0002",
      status: "ACTIVE",
    },
  });

  await prisma.enrolment.upsert({
    where: {
      studentId_subjectId_academicYear: {
        studentId: studentProfile.id,
        subjectId: subject.id,
        academicYear: 2026,
      },
    },
    update: {},
    create: {
      studentId: studentProfile.id,
      subjectId: subject.id,
      academicYear: 2026,
      status: "ACTIVE",
    },
  });

  console.log("Seed concluído.");
  console.log({ admin: admin.email, coordinator: coordinator.email });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
