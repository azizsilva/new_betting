// Shared types mirroring the BetSlate backend API.

export type UserRole =
  | "bigboss"
  | "admin_provider"
  | "owner"
  | "partner"
  | "super_admin"
  | "admin"
  | "agent"
  | "player"
  | "provider";
// chain top→bottom: admin_provider → owner → partner → super_admin → admin → agent → player

export interface User {
  id: number;
  username: string;
  email: string | null;
  mobile: string;
  role: UserRole | null;
  parentId: number | null;
  balance: string;
  exposure: string;
  creditRef: string;
  rate: string;
  status: "active" | "locked" | "suspended";
  language: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Balance {
  balance: string;
  exposure: string;
  available: string;
  creditRef: string;
}

export interface WebSettings {
  siteLogo?: string;
  telegramLink?: string;
  instagramLink?: string;
  facebookLink?: string;
  isLoginOn?: boolean;
  isSignupOn?: boolean;
}
