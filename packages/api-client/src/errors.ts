export class ApiClientError extends Error {
  status: number;
  code: string;
  correlationId?: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    correlationId?: string,
    details?: unknown
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
    this.details = details;
  }
}
