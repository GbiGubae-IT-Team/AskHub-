const API_URL = "https://gibi-askhub.onrender.com/api/v1";//"http://localhost:5000/api/v1";

export const getAuthToken = () => localStorage.getItem("token") || "";
export const setAuthToken = (token: string) => localStorage.setItem("token", token);
export const removeAuthToken = () => localStorage.removeItem("token");

export interface DecodedUser {
  userId: string;
  role: string;
  anonymousId: string;
  exp?: number;
}

export const getCurrentUser = (): DecodedUser | null => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeAuthToken();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const isApprovedStaff = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
};

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
    } catch (e) { }
    throw new Error(errBody.message || errBody.error || `API Error: ${response.statusText}`);
  }

  return response.json();
};
