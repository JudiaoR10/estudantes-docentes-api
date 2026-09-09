# Smart Campus — Core mínimo + Módulo G2 (Estudantes e Docentes)

Este repositório contém um Core mínimo (Auth + `/health` + auditoria) e o módulo
particular **G2 — Estudantes e Docentes** (`StudentProfile`, `TeacherProfile`,
`Enrolment`), implementado seguindo a arquitectura definida no
`G2_arquitectura_modulo.md`.

`Department`, `Course` e `Subject` estão presentes apenas como **stubs** (para
permitir as relações), já que pertencem ao domínio do G1 (Gestão Académica) e
devem ser substituídos/alinhados quando esse contrato existir.

## 1. Arrancar o ambiente

```bash
cp .env.example .env
npm install
docker compose up -d db
npm run build:packages
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev:api
```

Noutro terminal, confirme a saúde da API:

```bash
curl -s http://localhost:4100/health
```

## 2. Utilizadores de demonstração (seed)

| Email | Password | Role |
|---|---|---|
| admin@smartcampus.demo | Admin123! | ADMIN |
| coordinator@smartcampus.demo | Admin123! | COORDINATOR |
| teacher@smartcampus.demo | Admin123! | TEACHER |
| student@smartcampus.demo | Admin123! | STUDENT |

## 3. Testar rapidamente com curl

```bash
export API=http://localhost:4100/api/v1
export TOKEN=$(curl -s $API/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"coordinator@smartcampus.demo","password":"Admin123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")
export AUTH="Authorization: Bearer $TOKEN"

curl -s $API/students -H "$AUTH" | jq
curl -s $API/teachers -H "$AUTH" | jq
curl -s $API/enrolments -H "$AUTH" | jq
```

## 4. Correr os testes

```bash
npm test
```

(os testes assumem que a base de dados de desenvolvimento já tem o seed aplicado)

## 5. Estrutura do módulo G2

```
apps/api/src/modules/
├── students/
│   ├── domain/studentProfile.ts       # invariantes (activo p/ inscrever, self-or-privileged)
│   ├── application/studentService.ts  # casos de uso
│   └── http/studentRouter.ts          # rotas /students
├── teachers/                          # mesmo padrão
└── enrolments/                        # mesmo padrão + regra de transição de estado
```

## 7. Frontend (apps/web)

```bash
cp apps/web/.env.example apps/web/.env
npm run dev:web
```

Abra `http://localhost:5173`, entre com `coordinator@smartcampus.demo` / `Admin123!`
e navegue por Estudantes, Docentes e Inscrições. O `STUDENT` só vê o seu próprio
perfil; `ADMIN`/`COORDINATOR` veem listas completas e podem criar registos.

O frontend usa exclusivamente o `@smart-campus/api-client` (nunca `fetch` directo
nas páginas), com refresh automático de sessão em 401 e tokens em `localStorage`.

## 8. Próximos passos sugeridos

- Alinhar `Department`/`Course`/`Subject` com o que o G1 entregar (contrato de IDs estáveis).
- Adicionar mais casos de teste (400 de payload inválido, 404 de curso/disciplina inexistente).
- Gerar o `api-client` e as páginas de frontend (`/students`, `/teachers`, `/enrolments`).
- Publicar o contrato no Swagger/OpenAPI.
