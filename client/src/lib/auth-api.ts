import { api } from "./api";
import type { AuthResponse, User, UserRole } from "./types";

export async function loginRequest(username: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { username, password });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

// Where each role lands after login. Players go to their personal dashboard;
// staff roles go to the back-office panel (built later).
export function landingForRole(role: UserRole | null): string {
  switch (role) {
    case "player":
      return "/profile";
    case "admin_provider":
    case "owner":
    case "partner":
    case "super_admin":
    case "admin":
    case "agent":
      return "/panel";
    default:
      return "/";
  }
}

// True for any back-office staff role (not player / provider).
export function isStaffRole(role: UserRole | null | undefined): boolean {
  return (
    role === "admin_provider" ||
    role === "owner" ||
    role === "partner" ||
    role === "super_admin" ||
    role === "admin" ||
    role === "agent"
  );
}
