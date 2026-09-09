import { createApiClient, TokenStore, Tokens } from "@smart-campus/api-client";

const STORAGE_KEY = "smart-campus.tokens";

// Store em localStorage: única excepção consciente ao "não reinventar o
// api-client" — é exactamente o que o api-client espera que o frontend forneça.
class LocalStorageTokenStore implements TokenStore {
  getTokens(): Tokens | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  }
  setTokens(tokens: Tokens): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4100/api/v1",
  tokenStore: new LocalStorageTokenStore(),
  onSessionExpired: () => {
    window.location.href = "/login";
  },
});
