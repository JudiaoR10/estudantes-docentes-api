# Módulo: G2 — Estudantes e Docentes (Students & Teachers)

## Problema e objectivo

- **Utilizadores afectados:** estudantes, docentes, coordenadores de curso, administradores.
- **Capacidade principal:** manter o perfil académico completo de estudantes e docentes (dados
  próprios, ligação ao curso/departamento, situação/estado) e gerir as inscrições (enrolments)
  de estudantes em disciplinas por ano lectivo.
- **Fora do escopo:** autenticação e gestão de contas (`User`, `Role` — já resolvido pelo Core/Auth);
  gestão de cursos, disciplinas e departamentos (pertence ao G1 — Gestão Académica); avaliações,
  notas e horários (pertence ao G3 — Avaliações e Horários). O G2 **consome** `Course`, `Subject` e
  `Department` do G1 por referência (`id`), nunca duplica os seus dados.

## Entidades e regras

- **Entidades (nomes em inglês, alinhados com o schema Prisma do Core):**
  - `StudentProfile`
  - `TeacherProfile`
  - `Enrolment`

- **Campos essenciais:**
  - `StudentProfile(id, userId, studentNumber, courseId, admissionYear, phone, status, createdAt, updatedAt)`
  - `TeacherProfile(id, userId, staffNumber, departmentId, title, phone, status, createdAt, updatedAt)`
  - `Enrolment(id, studentId, subjectId, academicYear, status, createdAt, updatedAt)`

- **Estados:**
  - `StudentProfileStatus`: `ACTIVE`, `SUSPENDED`, `GRADUATED`, `WITHDRAWN`
  - `TeacherProfileStatus`: `ACTIVE`, `ON_LEAVE`, `INACTIVE`
  - `EnrolmentStatus`: `PENDING`, `ACTIVE`, `CANCELLED`, `COMPLETED`

- **Invariantes:**
  - `StudentProfile.userId` deve referenciar um `User` existente com `role = STUDENT`.
  - `TeacherProfile.userId` deve referenciar um `User` existente com `role = TEACHER`.
  - `studentNumber` e `staffNumber` são únicos.
  - `StudentProfile.courseId` deve existir no domínio do G1.
  - `Enrolment.subjectId` deve existir no domínio do G1.
  - Um estudante não pode ter duas `Enrolment` para a mesma `(subjectId, academicYear)`
    (unicidade composta).
  - Só é possível criar `Enrolment` se `StudentProfile.status = ACTIVE`.
  - Um `User` só pode ter um `StudentProfile` **ou** um `TeacherProfile`, nunca ambos.

- **Relações com o Core:**
  - `User`, `Role` → módulo Auth/Users do Core (não duplicar login nem roles).
  - `Course`, `Department` → G1, referenciados por `id`.
  - `Subject` → G1, referenciado por `id`.
  - `AuditEvent` → módulo de auditoria do Core (reutilizado, não recriado).

## Roles e permissões

| Operação | Role | Regra por objecto |
|---|---|---|
| Listar estudantes | ADMIN, COORDINATOR, TEACHER | TEACHER só vê estudantes inscritos nas suas disciplinas |
| Consultar próprio perfil de estudante | STUDENT | Apenas o próprio `userId` |
| Criar perfil de estudante | ADMIN, COORDINATOR | Requer `User` existente com role STUDENT |
| Actualizar perfil de estudante (completo) | ADMIN, COORDINATOR | Qualquer estudante |
| Actualizar contacto próprio | STUDENT | Apenas `phone` do próprio perfil |
| Listar/consultar docentes | Todos autenticados | Directório de docentes é público na plataforma |
| Consultar próprio perfil de docente | TEACHER | Apenas o próprio `userId` |
| Criar perfil de docente | ADMIN | Requer `User` existente com role TEACHER |
| Actualizar perfil de docente (completo) | ADMIN, COORDINATOR | Qualquer docente |
| Actualizar contacto próprio | TEACHER | Apenas `phone` do próprio perfil |
| Criar inscrição (enrolment) | STUDENT (própria), COORDINATOR, ADMIN | STUDENT só cria para si mesmo |
| Listar inscrições | ADMIN, COORDINATOR, TEACHER, STUDENT | STUDENT vê só as suas; TEACHER só as da sua disciplina |
| Alterar estado da inscrição | COORDINATOR, ADMIN | — |

## API

| Método | Rota | Pedido | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/v1/students` | query: `courseId?`, `status?`, `page?` | 200 `{ data: StudentProfileDto[], meta }` | 401, 403 |
| GET | `/api/v1/students/me` | — (via token) | 200 `{ data: StudentProfileDto }` | 401, 404 |
| GET | `/api/v1/students/:id` | — | 200 `{ data: StudentProfileDto }` | 401, 403, 404 |
| POST | `/api/v1/students` | `{ userId, studentNumber, courseId, admissionYear, phone }` | 201 `{ data: StudentProfileDto }` | 400, 401, 403, 404 (`USER_NOT_FOUND`, `COURSE_NOT_FOUND`), 409 (`STUDENT_NUMBER_TAKEN`) |
| PATCH | `/api/v1/students/:id` | campos parciais (`courseId`, `status`, `phone`, ...) | 200 `{ data: StudentProfileDto }` | 400, 401, 403, 404, 409 |
| GET | `/api/v1/teachers` | query: `departmentId?`, `status?` | 200 `{ data: TeacherProfileDto[], meta }` | 401 |
| GET | `/api/v1/teachers/me` | — | 200 `{ data: TeacherProfileDto }` | 401, 404 |
| GET | `/api/v1/teachers/:id` | — | 200 `{ data: TeacherProfileDto }` | 401, 404 |
| POST | `/api/v1/teachers` | `{ userId, staffNumber, departmentId, title, phone }` | 201 `{ data: TeacherProfileDto }` | 400, 401, 403, 404, 409 (`STAFF_NUMBER_TAKEN`) |
| PATCH | `/api/v1/teachers/:id` | campos parciais | 200 `{ data: TeacherProfileDto }` | 400, 401, 403, 404, 409 |
| GET | `/api/v1/enrolments` | query: `studentId?`, `subjectId?`, `academicYear?` | 200 `{ data: EnrolmentDto[], meta }` | 401, 403 |
| POST | `/api/v1/enrolments` | `{ studentId, subjectId, academicYear }` | 201 `{ data: EnrolmentDto }` | 400, 401, 403, 404 (`STUDENT_NOT_FOUND`, `SUBJECT_NOT_FOUND`), 409 (`DUPLICATE_ENROLMENT`) |
| PATCH | `/api/v1/enrolments/:id/status` | `{ status }` | 200 `{ data: EnrolmentDto }` | 400, 401, 403, 404, 409 |

Todas as respostas seguem o envelope do Core: sucesso `{ data, meta: { correlationId } }`,
erro `{ code, message, details, correlationId }`.

## Persistência

- **Modelos Prisma:**
  ```prisma
  model StudentProfile {
    id             String   @id @default(cuid())
    userId         String   @unique
    studentNumber  String   @unique
    courseId       String
    admissionYear  Int
    phone          String?
    status         StudentProfileStatus @default(ACTIVE)
    enrolments     Enrolment[]
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
  }

  model TeacherProfile {
    id           String   @id @default(cuid())
    userId       String   @unique
    staffNumber  String   @unique
    departmentId String
    title        String?
    phone        String?
    status       TeacherProfileStatus @default(ACTIVE)
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
  }

  model Enrolment {
    id           String   @id @default(cuid())
    studentId    String
    student      StudentProfile @relation(fields: [studentId], references: [id])
    subjectId    String
    academicYear Int
    status       EnrolmentStatus @default(PENDING)
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    @@unique([studentId, subjectId, academicYear])
  }

  enum StudentProfileStatus { ACTIVE SUSPENDED GRADUATED WITHDRAWN }
  enum TeacherProfileStatus { ACTIVE ON_LEAVE INACTIVE }
  enum EnrolmentStatus { PENDING ACTIVE CANCELLED COMPLETED }
  ```
- **Migration:** `npx prisma migrate dev --name add_g2_students_teachers`
- **Índices:** `studentNumber` (único), `staffNumber` (único), `[studentId, subjectId, academicYear]`
  (único, para bloquear inscrição duplicada), índice em `courseId` e `departmentId` para listagens
  filtradas.
- **Seed/demo:** criar 3–5 `User` com role STUDENT e respectivo `StudentProfile` ligado a um
  `courseId` fictício do G1; 2–3 `User` com role TEACHER e `TeacherProfile`; algumas `Enrolment`
  de exemplo com estados diferentes (`PENDING`, `ACTIVE`, `COMPLETED`). Dados claramente fictícios.

## Frontend

- **Path:** `/students`, `/teachers`, `/enrolments`
- **Estado:** `partial` (perfis e inscrições dependem de `courseId`/`subjectId` reais do G1, que
  ainda podem estar em `development`)
- **Componentes:** `StudentsPage` (lista + filtro por curso), `StudentProfilePage` (detalhe/editar),
  `TeachersPage`, `TeacherProfilePage`, `EnrolmentsPage` (lista + criar inscrição)
- **Loading/empty/error:** cada página trata explicitamente os três estados; erro mostra
  `message` do envelope de erro do Core, nunca detalhes internos.

## Testes

- **Unitários:** invariante de `role` do `User` ao criar perfil; unicidade de `studentNumber`;
  regra de "não duplicar inscrição na mesma disciplina/ano"; regra "só inscreve se perfil `ACTIVE`".
- **Integração:** rotas com Supertest cobrindo 200/201, 400 (payload inválido), 401 (sem token),
  403 (role insuficiente), 404 (`courseId`/`subjectId`/`userId` inexistente), 409 (duplicação).
- **Frontend:** renderização de loading/empty/error nas três páginas; formulário de inscrição
  bloqueia submissão com campos inválidos.
- **End-to-end:** login como COORDINATOR → criar `StudentProfile` → criar `Enrolment` →
  login como STUDENT → consultar `/students/me` e `/enrolments` (só vê as suas) → consultar
  `/audit-events` como ADMIN e confirmar `STUDENT_PROFILE_CREATED` e `ENROLMENT_CREATED`.

## Integração

- **DTOs partilhados (`shared-types`):** `StudentProfileDto`, `TeacherProfileDto`, `EnrolmentDto`,
  reexportando os enums de estado.
- **Schemas Zod (`validation`):** `createStudentProfileSchema`, `updateStudentProfileSchema`,
  `createTeacherProfileSchema`, `updateTeacherProfileSchema`, `createEnrolmentSchema`,
  `updateEnrolmentStatusSchema`.
- **api-client:** métodos tipados `getStudents`, `getStudentById`, `getMyStudentProfile`,
  `createStudentProfile`, `updateStudentProfile`, equivalentes para `teachers` e `enrolments`.
- **AuditEvent:** acções `STUDENT_PROFILE_CREATED`, `STUDENT_PROFILE_UPDATED`,
  `TEACHER_PROFILE_CREATED`, `TEACHER_PROFILE_UPDATED`, `ENROLMENT_CREATED`,
  `ENROLMENT_STATUS_CHANGED`.
- **correlationId:** propagado do middleware do Core em todas as respostas e eventos de auditoria
  deste módulo, sem lógica própria de geração.
- **Dependências:**
  - Core/Auth: `User`, `Role`, `authenticate`, `authorize`.
  - G1 (Gestão Académica): `Course`, `Department`, `Subject` — contrato a negociar (IDs estáveis,
    endpoint de consulta, o que acontece se um `Course`/`Subject` for eliminado com inscrições
    activas).
  - Sem dependência de G3, G4, G5 ou G6 nesta fase.
