import { ApiClientError } from "./errors";
import { TokenStore, InMemoryTokenStore } from "./tokenStore";

export type ApiClientConfig = {
  baseUrl: string;
  tokenStore?: TokenStore;
  onSessionExpired?: () => void;
};

export class HttpClient {
  private baseUrl: string;
  private tokenStore: TokenStore;
  private onSessionExpired?: () => void;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.tokenStore = config.tokenStore ?? new InMemoryTokenStore();
    this.onSessionExpired = config.onSessionExpired;
  }

  getTokenStore() {
    return this.tokenStore;
  }

  private async refresh(): Promise<void> {
    const tokens = this.tokenStore.getTokens();
    if (!tokens) {
      throw new ApiClientError(401, "UNAUTHENTICATED", "Sem sessão activa");
    }

    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) {
      this.tokenStore.clear();
      this.onSessionExpired?.();
      throw new ApiClientError(401, "UNAUTHENTICATED", "Sessão expirada");
    }

    const body = await res.json();
    this.tokenStore.setTokens(body.data.tokens);
  }

  async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      auth?: boolean;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, query, auth = true } = options;

    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
      });
    }

    const doFetch = async (): Promise<Response> => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (auth) {
        const tokens = this.tokenStore.getTokens();
        if (tokens) headers["Authorization"] = `Bearer ${tokens.accessToken}`;
      }
      return fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    };

    let res = await doFetch();

    // Refresh automático em 401: apenas uma tentativa, evita loop infinito.
    if (res.status === 401 && auth && this.tokenStore.getTokens()) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refresh().finally(() => {
          this.refreshPromise = null;
        });
      }
      try {
        await this.refreshPromise;
        res = await doFetch();
      } catch {
        // refresh falhou; segue para tratamento de erro abaixo
      }
    }

    const contentType = res.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
      const correlationId = payload?.correlationId ?? res.headers.get("x-correlation-id") ?? undefined;
      throw new ApiClientError(
        res.status,
        payload?.code ?? "UNKNOWN_ERROR",
        payload?.message ?? "Erro de comunicação com a API",
        correlationId,
        payload?.details
      );
    }

    return payload as T;
  }
}
