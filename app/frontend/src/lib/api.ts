// Helper functions for API calls with authentication

// Use relative URL - nginx will proxy /api to backend
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function hasAuthToken() {
  return Boolean(localStorage.getItem("token"));
}

/**
 * Get authentication headers with JWT bearer token
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Authenticated fetch wrapper
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    if (rawBody && contentType.includes("application/json")) {
      const error = JSON.parse(rawBody);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    throw new Error(rawBody || `HTTP ${response.status}`);
  }

  if (!rawBody) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody);
  }

  return rawBody;
}

export { API_BASE };
