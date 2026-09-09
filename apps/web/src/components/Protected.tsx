import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export function Protected({
  roles,
  children,
}: {
  roles?: string[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <p>A carregar sessão…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <p>Não tem permissão para aceder a esta página.</p>;
  }

  return <>{children}</>;
}
