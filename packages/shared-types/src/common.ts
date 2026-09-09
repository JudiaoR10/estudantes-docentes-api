export type ApiSuccess<T> = {
  data: T;
  meta?: {
    correlationId: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  correlationId: string;
};

export type RoleCode =
  | "STUDENT"
  | "TEACHER"
  | "TECHNICIAN"
  | "COORDINATOR"
  | "ADMIN";
