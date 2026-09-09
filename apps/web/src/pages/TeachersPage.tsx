import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError } from "@smart-campus/api-client";
import type { TeacherProfileDto } from "@smart-campus/shared-types";

export function TeachersPage() {
  const { user } = useAuth();
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; data: TeacherProfileDto[] }
  >({ status: "loading" });
  const [form, setForm] = useState({
    userId: "",
    staffNumber: "",
    departmentId: "",
    title: "",
    phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setState({ status: "loading" });
    apiClient.teachers
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
      await apiClient.teachers.create({
        ...form,
        title: form.title || undefined,
        phone: form.phone || undefined,
      });
      setForm({ userId: "", staffNumber: "", departmentId: "", title: "", phone: "" });
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Erro ao criar perfil");
    }
  }

  return (
    <div>
      <h1>Docentes</h1>

      {user?.role === "ADMIN" && (
        <>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <input
              placeholder="userId"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            />
            <input
              placeholder="Nº de docente"
              value={form.staffNumber}
              onChange={(e) => setForm({ ...form, staffNumber: e.target.value })}
              required
            />
            <input
              placeholder="departmentId"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              required
            />
            <input
              placeholder="Título (opcional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              placeholder="Telefone (opcional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <button type="submit">Criar perfil</button>
          </form>
          {formError && <p style={{ color: "crimson" }}>{formError}</p>}
        </>
      )}

      {state.status === "loading" && <p>A carregar docentes…</p>}
      {state.status === "error" && <p style={{ color: "crimson" }}>{state.message}</p>}
      {state.status === "ok" && state.data.length === 0 && <p>Ainda não há docentes registados.</p>}
      {state.status === "ok" && state.data.length > 0 && (
        <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Nº</th>
              <th>Departamento</th>
              <th>Título</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{t.staffNumber}</td>
                <td>{t.departmentId}</td>
                <td>{t.title ?? "—"}</td>
                <td>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
