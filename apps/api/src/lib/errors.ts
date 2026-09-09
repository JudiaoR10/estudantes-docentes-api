export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthenticated(message = "Não autenticado") {
    return new AppError(401, "UNAUTHENTICATED", message);
  }

  static forbidden(message = "Sem permissão para esta operação") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(code: string, message: string) {
    return new AppError(404, code, message);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }
}
