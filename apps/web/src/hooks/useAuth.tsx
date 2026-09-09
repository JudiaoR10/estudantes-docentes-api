import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "../lib/apiClient";

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = apiClient.tokenStore.getTokens();
    if (!tokens) {
      setLoading(false);
      return;
    }
    apiClient.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await apiClient.auth.login(email, password);
    setUser(result.user);
  }

  async function logout() {
    await apiClient.auth.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
