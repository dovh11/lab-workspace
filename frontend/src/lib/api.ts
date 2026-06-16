import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Token } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL 
  || (typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1` 
    : "http://127.0.0.1:8000/api/v1");

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    if (error.response?.status === 403 && typeof window !== "undefined") {
      // We don't redirect on 403, just let the UI handle it with a toast
      console.warn("403 Forbidden:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<Token>("/auth/login/json", { username, password }),
  register: (data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    system_role: string;
  }) => api.post<Token>("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get("/projects", { params }),
  create: (data: { title: string; description?: string; status?: string }) =>
    api.post("/projects", data),
  get: (id: number) => api.get(`/projects/${id}`),
  update: (id: number, data: Partial<{ title: string; description: string; status: string }>) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addMember: (projectId: number, data: { user_id: number; role_in_project: string }) =>
    api.post(`/projects/${projectId}/members`, data),
  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
  listMembers: (projectId: number) => api.get(`/projects/${projectId}/members`),
};

// ── Experiments ───────────────────────────────────────────────────────────────
export const experimentsApi = {
  list: (params?: { project_id?: number; skip?: number; limit?: number }) =>
    api.get("/experiments", { params }),
  create: (data: {
    project_id: number;
    experiment_name: string;
    description?: string;
    framework?: string;
    hyperparameters?: Record<string, unknown>;
  }) => api.post("/experiments", data),
  get: (id: number) => api.get(`/experiments/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/experiments/${id}`, data),
  appendMetrics: (id: number, entry: Record<string, unknown>) =>
    api.post(`/experiments/${id}/metrics`, { entry }),
  delete: (id: number) => api.delete(`/experiments/${id}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (params?: { project_id?: number; skip?: number; limit?: number }) =>
    api.get("/documents", { params }),
  create: (data: {
    project_id: number;
    title: string;
    doc_type?: string;
    description?: string;
  }) => api.post("/documents", data),
  get: (id: number) => api.get(`/documents/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/documents/${id}`, data),
  delete: (id: number) => api.delete(`/documents/${id}`),
  listVersions: (documentId: number) =>
    api.get(`/documents/${documentId}/versions`),
  uploadVersion: (documentId: number, file: File, commitMessage?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (commitMessage) form.append("commit_message", commitMessage);
    return api.post(`/documents/${documentId}/versions`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Journal Clubs ─────────────────────────────────────────────────────────────
export const journalClubsApi = {
  list: (params?: { upcoming_only?: boolean; skip?: number; limit?: number }) =>
    api.get("/journal-clubs", { params }),
  create: (data: {
    title: string;
    topic?: string;
    meeting_time: string;
    location_or_link?: string;
    paper_reference?: string;
    paper_pdf_url?: string;
    notes?: string;
  }) => api.post("/journal-clubs", data),
  get: (id: number) => api.get(`/journal-clubs/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/journal-clubs/${id}`, data),
  delete: (id: number) => api.delete(`/journal-clubs/${id}`),
  rsvp: (id: number, rsvp_status: string) =>
    api.post(`/journal-clubs/${id}/rsvp`, { rsvp_status }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get("/users"),
  get: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};
