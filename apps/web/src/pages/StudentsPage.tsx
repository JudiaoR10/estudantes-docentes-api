import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError } from "@smart-campus/api-client";
import type { StudentProfileDto } from "@smart-campus/shared-types";

export function StudentsPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "ADMIN" || user?.role === "COORDINATOR" || user?.role === "TEACHER";

  return isPrivileged ? <StudentsList /> : <OwnStudentProfile />;
}

function OwnStudentProfile() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; data: StudentProfileDto }
  >({ status: "loading" });

  useEffect(() => {
    apiClient.students
      .getMe()
      .then((data) => setState({ status: "ok", data }))
      .catch((err) =>
        setState({
          status: "error",
          message: err instanceof ApiClientError ? err.message : "Erro inesperado",
        })
      );
  }, []);

  if (state.status === "loading") return <p>A carregar o seu perfil…</p>;
  if (state.status === "error") return <p style={{ color: "crimson" }}>{state.message}</p>;

  const s = state.data;
  return (
    <div>
      <h1>O meu perfil de estudante</h1>
      <p>Número: {s.studentNumber}</p>
      <p>Curso: {s.courseId}</p>
      <p>Ano de admissão: {s.admissionYear}</p>
      <p>Telefone: {s.phone ?? "—"}</p>
      <p>Estado: {s.status}</p>
    </div>
  );
}

function StudentsList() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; data: StudentProfileDto[] }
  >({ status: "loading" });
  const [form, setForm] = useState({
    userId: "",
    studentNumber: "",
    courseId: "",
    admissionYear: 2026,
    phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setState({ status: "loading" });
    apiClient.students
      .list()
      .then((data) => setState({ status: "ok", data }))
      .catch((err) =>
        setState({
          status: "error",
          message: err instanceof ApiClientError ? err.message : "Erro inesperado",
        })
      );
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await apiClient.students.create({
        ...form,
        phone: form.phone || undefined,
      });
      setForm({ userId: "", studentNumber: "", courseId: "", admissionYear: 2026, phone: "" });
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Erro ao criar perfil");
    }
  }

  return (
    <div>
      <h1>Estudantes</h1>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          placeholder="userId"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          required
        />
        <input
          placeholder="Nº de estudante"
          value={form.studentNumber}
          onChange={(e) => setForm({ ...form, studentNumber: e.target.value })}
          required
        />
        <input
          placeholder="courseId"
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Ano de admissão"
          value={form.admissionYear}
          onChange={(e) => setForm({ ...form, admissionYear: Number(e.target.value) })}
          required
        />
        <input
          placeholder="Telefone (opcional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <button type="submit">Criar perfil</button>
      </form>
      {formError && <p style={{ color: "crimson" }}>{formError}</p>}

      {state.status === "loading" && <p>A carregar estudantes…</p>}
      {state.status === "error" && <p style={{ color: "crimson" }}>{state.message}</p>}
      {state.status === "ok" && state.data.length === 0 && <p>Ainda não há estudantes registados.</p>}
      {state.status === "ok" && state.data.length > 0 && (
        <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Nº</th>
              <th>Curso</th>
              <th>Ano</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{s.studentNumber}</td>
                <td>{s.courseId}</td>
                <td>{s.admissionYear}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
