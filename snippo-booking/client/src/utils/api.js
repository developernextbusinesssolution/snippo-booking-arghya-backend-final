const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
export const STATIC_BASE = API_BASE.replace(/\/api$/, "");
const SESSION_KEY = "snippo_session";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {})
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const readSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveSession = (s) => {
  if (!s) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);
