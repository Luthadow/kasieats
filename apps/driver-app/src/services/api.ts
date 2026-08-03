const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await response.text();
  const payload = text ? safeJson(text) : undefined;

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) || `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
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

export async function apiData<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiRequest<{ success?: boolean; data?: T } & Record<string, unknown>>(
    path,
    options,
  );
  return (res && 'data' in res ? (res.data as T) : (res as unknown as T)) as T;
}

export const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export { API_URL };
