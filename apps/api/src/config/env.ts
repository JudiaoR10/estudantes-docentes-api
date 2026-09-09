function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente em falta: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.API_PORT ?? 4100),
  host: process.env.API_HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};
