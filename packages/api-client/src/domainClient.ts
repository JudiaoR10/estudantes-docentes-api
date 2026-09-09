import { HttpClient, ApiClientConfig } from "./httpClient";
import type {
  ApiSuccess,
  StudentProfileDto,
  TeacherProfileDto,
  EnrolmentDto,
} from "@smart-campus/shared-types";

export function createApiClient(config: ApiClientConfig) {
  const http = new HttpClient(config);

  return {
    tokenStore: http.getTokenStore(),

    auth: {
      async login(email: string, password: string) {
        const res = await http.request<
          ApiSuccess<{
            user: { id: string; email: string; fullName: string; role: string };
            tokens: { accessToken: string; refreshToken: string };
          }>
        >("/auth/login", { method: "POST", body: { email, password }, auth: false });
        http.getTokenStore().setTokens(res.data.tokens);
        return res.data;
      },
      async me() {
        const res = await http.request<ApiSuccess<{ id: string; email: string; fullName: string; role: string }>>(
          "/me"
        );
        return res.data;
      },
      async logout() {
        try {
          await http.request("/auth/logout", { method: "POST" });
        } finally {
          http.getTokenStore().clear();
        }
      },
    },

    students: {
      async list(params?: { courseId?: string; status?: string }) {
        const res = await http.request<ApiSuccess<StudentProfileDto[]>>("/students", {
          query: params,
        });
        return res.data;
      },
      async getMe() {
        const res = await http.request<ApiSuccess<StudentProfileDto>>("/students/me");
        return res.data;
      },
      async getById(id: string) {
        const res = await http.request<ApiSuccess<StudentProfileDto>>(`/students/${id}`);
        return res.data;
      },
      async create(input: {
        userId: string;
        studentNumber: string;
        courseId: string;
        admissionYear: number;
        phone?: string;
      }) {
        const res = await http.request<ApiSuccess<StudentProfileDto>>("/students", {
          method: "POST",
          body: input,
        });
        return res.data;
      },
      async update(id: string, input: Record<string, unknown>) {
        const res = await http.request<ApiSuccess<StudentProfileDto>>(`/students/${id}`, {
          method: "PATCH",
          body: input,
        });
        return res.data;
      },
    },

    teachers: {
      async list(params?: { departmentId?: string; status?: string }) {
        const res = await http.request<ApiSuccess<TeacherProfileDto[]>>("/teachers", {
          query: params,
        });
        return res.data;
      },
      async getMe() {
        const res = await http.request<ApiSuccess<TeacherProfileDto>>("/teachers/me");
        return res.data;
      },
      async getById(id: string) {
        const res = await http.request<ApiSuccess<TeacherProfileDto>>(`/teachers/${id}`);
        return res.data;
      },
      async create(input: {
        userId: string;
        staffNumber: string;
        departmentId: string;
        title?: string;
        phone?: string;
      }) {
        const res = await http.request<ApiSuccess<TeacherProfileDto>>("/teachers", {
          method: "POST",
          body: input,
        });
        return res.data;
      },
      async update(id: string, input: Record<string, unknown>) {
        const res = await http.request<ApiSuccess<TeacherProfileDto>>(`/teachers/${id}`, {
          method: "PATCH",
          body: input,
        });
        return res.data;
      },
    },

    enrolments: {
      async list(params?: { studentId?: string; subjectId?: string; academicYear?: number }) {
        const res = await http.request<ApiSuccess<EnrolmentDto[]>>("/enrolments", {
          query: params,
        });
        return res.data;
      },
      async create(input: { studentId: string; subjectId: string; academicYear: number }) {
        const res = await http.request<ApiSuccess<EnrolmentDto>>("/enrolments", {
          method: "POST",
          body: input,
        });
        return res.data;
      },
      async updateStatus(id: string, status: string) {
        const res = await http.request<ApiSuccess<EnrolmentDto>>(`/enrolments/${id}/status`, {
          method: "PATCH",
          body: { status },
        });
        return res.data;
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export { ApiClientError } from "./errors";
export { TokenStore, InMemoryTokenStore, Tokens } from "./tokenStore";
