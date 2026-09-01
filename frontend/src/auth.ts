import { apiUrl } from "./config";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
};

const TOKEN_KEY = "ad_estimating_token";
const USER_KEY = "ad_estimating_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Invalid email or password");
  }
  return response.json() as Promise<{
    access_token: string;
    user: AuthUser;
  }>;
}

export async function fetchSession(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(apiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      clearSession();
      return null;
    }
    const user = (await response.json()) as AuthUser;
    storeSession(token, user);
    return user;
  } catch {
    return getStoredUser();
  }
}
