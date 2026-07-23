const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";
const TOKEN_KEY = "patient_chart_token";
const NAME_KEY = "patient_chart_name";
const REMEMBER_EMAIL_KEY = "patient_chart_remember_email";

export type ApiResponse<T> = {
  message: string;
  success: boolean;
  code: number;
  data: T;
};

function authStore(persistent: boolean): Storage {
  return persistent ? localStorage : sessionStorage;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredName(): string | null {
  return localStorage.getItem(NAME_KEY) ?? sessionStorage.getItem(NAME_KEY);
}

export function setAuthSession(token: string | null, name: string | null, remember = true) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(NAME_KEY);

  if (!token) return;

  const store = authStore(remember);
  store.setItem(TOKEN_KEY, token);
  if (name) store.setItem(NAME_KEY, name);
}

export function getRememberedEmail(): string {
  return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
}

export function setRememberedEmail(email: string | null) {
  if (!email) localStorage.removeItem(REMEMBER_EMAIL_KEY);
  else localStorage.setItem(REMEMBER_EMAIL_KEY, email);
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
    setAuthSession(null, null);
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
    const value = unique.trim();
    return request<{ exists: boolean; unique: string }>(
      `/patients/check-unique/${encodeURIComponent(value)}`,
    ).catch(async (err) => {
      // Fallback if the check endpoint is not deployed yet
      if (!(err instanceof ApiError) || (err.code !== 404 && err.code !== 405)) {
        throw err;
      }
      const patients = await request<
        Array<{ unique: string }>
      >("/patients/view");
      return {
        exists: patients.some((p) => p.unique.toLowerCase() === value.toLowerCase()),
        unique: value,
      };
    });
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
  seedDemoPatients() {
    return request<{
      message: string;
      created: number;
      skipped: number;
      total: number;
    }>("/patients/seed-demo", { method: "POST", body: "{}" });
  },
};
