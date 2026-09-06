const API_URL = "http://localhost:5000/api/v1";

export const getAuthToken = () => localStorage.getItem("token") || "";
export const setAuthToken = (token: string) => localStorage.setItem("token", token);
export const removeAuthToken = () => localStorage.removeItem("token");

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    if (response.status === 401 && token) {
      removeAuthToken();
      const method = (options.method || "GET").toUpperCase();
      if (method === "GET") {
        const guestHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string> || {}),
        };
        delete guestHeaders["Authorization"];
        const retryRes = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: guestHeaders,
        });
        if (retryRes.ok) {
          return retryRes.json();
        }
      }
    }

    let errBody: any = { message: `API Error: ${response.statusText}` };
    try {
      errBody = await response.json();
    } catch(e) {}
    throw new Error(errBody.message || errBody.error || `API Error: ${response.statusText}`);
  }

  return response.json();
};
