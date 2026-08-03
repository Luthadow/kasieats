const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'kasieats.admin.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  const payload = text ? safeJson(text) : undefined;

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    const message = payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }
  return payload as T;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function unwrap<T>(payload: any): T {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export const api = {
  get: async <T>(path: string) => unwrap<T>(await request<any>(path)),
  post: async <T>(path: string, body?: unknown) =>
    unwrap<T>(
      await request<any>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    ),
  raw: <T>(path: string, options?: RequestInit) => request<T>(path, options),
};

export { API_URL };
