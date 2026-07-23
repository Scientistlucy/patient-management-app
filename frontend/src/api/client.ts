const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";
const TOKEN_KEY = "patient_chart_token";

export type ApiResponse<T> = {
  message: string;
  success: boolean;
  code: number;
  data: T;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export class ApiError extends Error {
  code: number;
  data: unknown;

  constructor(message: string, code: number, data: unknown = null) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (res.status === 401 && auth) {
    setToken(null);
    localStorage.removeItem("patient_chart_name");
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.message || `Request failed (${res.status})`,
      json?.code || res.status,
      json?.data ?? null,
    );
  }

  return json.data;
}

export const api = {
  signup(body: {
    email: string;
    firstname: string;
    lastname: string;
    password: string;
  }) {
    return request("/user/signup", { method: "POST", body: JSON.stringify(body) }, false);
  },
  signin(body: { email: string; password: string }) {
    return request<{
      id: number;
      name: string;
      email: string;
      access_token: string;
    }>("/user/signin", { method: "POST", body: JSON.stringify(body) }, false);
  },
  forgotPassword(body: { email: string }) {
    return request<{
      message: string;
      email: string;
      emailed?: boolean;
      reset_url?: string;
    }>("/user/forgot-password", { method: "POST", body: JSON.stringify(body) }, false);
  },
  resetPassword(body: { email: string; token: string; password: string }) {
    return request<{ message: string }>(
      "/user/reset-password",
      { method: "POST", body: JSON.stringify(body) },
      false,
    );
  },
  registerPatient(body: {
    unique: string;
    firstname: string;
    lastname: string;
    dob: string;
    gender: string;
    reg_date: string;
  }) {
    return request<{ id: number; unique: string; message: string }>(
      "/patients/register",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  checkPatientUnique(unique: string) {
    return request<{ exists: boolean; unique: string }>(
      `/patients/check-unique/${encodeURIComponent(unique.trim())}`,
    );
  },
  addVital(body: {
    visit_date: string;
    height: string;
    weight: string;
    bmi: string;
    patient_id: string;
  }) {
    return request<{ id: number; patient_id: string; message: string }>(
      "/vital/add",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  addVisit(body: {
    general_health: "Good" | "Poor";
    on_diet?: "Yes" | "No";
    on_drugs?: "Yes" | "No";
    comments: string;
    visit_date: string;
    patient_id: string;
    vital_id: string;
  }) {
    return request<{ message: string }>(
      "/visits/add",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  listVisits(visit_date?: string) {
    return request<{
      rows: Array<{
        patient_id: number;
        unique: string;
        name: string;
        gender: string;
        age: number;
        bmi: string | null;
        status: string;
        visit_date: string | null;
        height: number | null;
        weight: number | null;
      }>;
      stats: {
        total: number;
        underweight: number;
        normal: number;
        overweight: number;
        no_vitals: number;
        average_bmi: number | null;
      };
    }>("/visits/view", {
      method: "POST",
      body: JSON.stringify({ visit_date: visit_date || undefined }),
    });
  },
};
