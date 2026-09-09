import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError } from "@smart-campus/api-client";
import type { EnrolmentDto } from "@smart-campus/shared-types";

export function EnrolmentsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; data: EnrolmentDto[] }
  >({ status: "loading" });
  const [form, setForm] = useState({ studentId: "", subjectId: "", academicYear: 2026 });
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setState({ status: "loading" });
    apiClient.enrolments
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
      await apiClient.enrolments.create(form);
      setForm({ studentId: "", subjectId: "", academicYear: 2026 });
      load();
    } catch (err) {
      // 409 DUPLICATE_ENROLMENT chega aqui com a mensagem já pronta para mostrar.
      setFormError(err instanceof ApiClientError ? err.message : "Erro ao criar inscrição");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await apiClient.enrolments.updateStatus(id, status);
      load();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Erro ao alterar estado");
    }
  }

  return (
    <div>
      <h1>Inscrições</h1>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          placeholder="studentId"
          value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          required
        />
        <input
          placeholder="subjectId"
          value={form.subjectId}
          onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Ano lectivo"
          value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: Number(e.target.value) })}
          required
        />
        <button type="submit">Inscrever</button>
      </form>
      {formError && <p style={{ color: "crimson" }}>{formError}</p>}

      {state.status === "loading" && <p>A carregar inscrições…</p>}
      {state.status === "error" && <p style={{ color: "crimson" }}>{state.message}</p>}
      {state.status === "ok" && state.data.length === 0 && <p>Ainda não há inscrições.</p>}
      {state.status === "ok" && state.data.length > 0 && (
        <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Estudante</th>
              <th>Disciplina</th>
              <th>Ano</th>
              <th>Estado</th>
              {canManage && <th>Acções</th>}
            </tr>
          </thead>
          <tbody>
            {state.data.map((en) => (
              <tr key={en.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{en.studentId}</td>
                <td>{en.subjectId}</td>
                <td>{en.academicYear}</td>
                <td>{en.status}</td>
                {canManage && (
                  <td style={{ display: "flex", gap: 4 }}>
                    {en.status === "PENDING" && (
                      <button onClick={() => handleStatusChange(en.id, "ACTIVE")}>Activar</button>
                    )}
                    {en.status === "ACTIVE" && (
                      <button onClick={() => handleStatusChange(en.id, "COMPLETED")}>Concluir</button>
                    )}
                    {(en.status === "PENDING" || en.status === "ACTIVE") && (
                      <button onClick={() => handleStatusChange(en.id, "CANCELLED")}>Cancelar</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
