const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & { token?: string };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (typeof window !== "undefined") {
    const stored = localStorage.getItem("accessToken");
    if (stored) headers["Authorization"] = `Bearer ${stored}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    // Try to refresh token
    if (typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          headers["Authorization"] = `Bearer ${data.accessToken}`;
          // Retry
          const retryRes = await fetch(`${API_URL}${path}`, { ...init, headers });
          if (!retryRes.ok) {
            const err = await retryRes.json().catch(() => ({}));
            throw err;
          }
          return retryRes.json();
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          throw new Error("Session expired");
        }
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: "An error occurred" } }));
    const message =
      err?.error?.message ||
      err?.message ||
      (typeof err === "string" ? err : "An error occurred");
    const errorObj = new Error(message);
    Object.assign(errorObj, err);
    throw errorObj;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), ...opts }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body), ...opts }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...opts }),
};

// Auth-specific helpers
export const authApi = {
  login: (loginId: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>("/auth/login", { loginId, password }),

  signup: (data: SignupData) =>
    api.post<{ user: User }>("/auth/signup", data),

  me: () => api.get<{ user: User }>("/auth/me"),

  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),

  forgotPassword: (loginIdOrEmail: string) =>
    api.post<{ message: string; _devOtp?: string }>("/auth/forgot-password", { loginIdOrEmail }),

  verifyOtp: (loginIdOrEmail: string, otp: string) =>
    api.post<{ resetToken: string }>("/auth/verify-otp", { loginIdOrEmail, otp }),

  resetPassword: (resetToken: string, newPassword: string, confirmPassword: string) =>
    api.post("/auth/reset-password", { resetToken, newPassword, confirmPassword }),
};

// Type stubs (full types in shared/)
interface User {
  id: string;
  loginId: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface SignupData {
  loginId: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}
