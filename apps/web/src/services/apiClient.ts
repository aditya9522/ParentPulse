// apps/web/src/services/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const cleanUrl = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  try {
    const response = await fetch(cleanUrl, {
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      ...rest,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  } catch (error) {
    // If backend is unreachable or in development preview, propagate error so service can fallback gracefully
    throw error;
  }
}
