export type Tokens = { accessToken: string; refreshToken: string };

export interface TokenStore {
  getTokens(): Tokens | null;
  setTokens(tokens: Tokens): void;
  clear(): void;
}

// Store em memória: útil para testes de script (Node) sem browser.
export class InMemoryTokenStore implements TokenStore {
  private tokens: Tokens | null = null;

  getTokens() {
    return this.tokens;
  }

  setTokens(tokens: Tokens) {
    this.tokens = tokens;
  }

  clear() {
    this.tokens = null;
  }
}
