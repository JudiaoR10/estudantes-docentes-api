import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Catálogo simplificado: só o G2 está implementado nesta fase. Os restantes
// módulos entrarão aqui quando os outros grupos entregarem o seu trabalho.
const campusModules = [
  { label: "Estudantes", path: "/students", status: "available" as const },
  { label: "Docentes", path: "/teachers", status: "available" as const },
  { label: "Inscrições", path: "/enrolments", status: "available" as const },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <aside style={{ width: 220, borderRight: "1px solid #ddd", padding: 16 }}>
        <h2 style={{ fontSize: 18 }}>Smart Campus</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
          {campusModules.map((m) => (
            <NavLink key={m.path} to={m.path} style={{ textDecoration: "none" }}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
            borderBottom: "1px solid #eee",
            paddingBottom: 12,
          }}
        >
          <span>
            {user?.fullName} · <strong>{user?.role}</strong>
          </span>
          <button onClick={() => logout()}>Sair</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
