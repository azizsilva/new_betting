import { api } from "./api";
import type { User, UserRole } from "./types";

// ── Hierarchy (role-aware: every endpoint is scoped to the actor's subtree) ──

export interface SubtreeNode {
  id: number;
  username: string;
  role: string;
  balance: string;
  parent_id: number;
}

export interface DownlineUser extends User {
  childrenCount: number;
  availBalance: string;
}

export async function getDownline(): Promise<DownlineUser[]> {
  const { data } = await api.get<DownlineUser[]>("/users/downline");
  return data;
}

export interface DownlineStats {
  totalBalance: string;
  totalExposure: string;
  totalAvailBalance: string;
  count: number;
}

export async function getDownlineStats(): Promise<DownlineStats> {
  const { data } = await api.get<DownlineStats>("/users/stats");
  return data;
}

export async function getSubtree(): Promise<SubtreeNode[]> {
  const { data } = await api.get<SubtreeNode[]>("/users/subtree");
  return data;
}

export interface CreateUserInput {
  username: string;
  password: string;
  mobile: string;
  email?: string;
  role: UserRole;
  rate?: number;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<User>("/users", input);
  return data;
}

export async function setUserStatus(
  id: number,
  status: "active" | "locked" | "suspended",
): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}/status`, { status });
  return data;
}

// ── Wallet / transfers ──

export interface TransferInput {
  targetUserId: number;
  amount: number | string;
  type: "deposit" | "withdrawal";
  description?: string;
}

export async function transfer(input: TransferInput) {
  const { data } = await api.post("/wallet/transfer", input);
  return data;
}

export interface Txn {
  id: number;
  amount: string;
  type: "deposit" | "withdrawal";
  description: string | null;
  txnRef: string | null;
  createdAt: string;
  direction: "in" | "out";
  counterparty?: string;
}

export async function getTransactions(limit = 50): Promise<Txn[]> {
  const { data } = await api.get<Txn[]>("/wallet/transactions", { params: { limit } });
  return data;
}

// The role an actor of `role` can create directly below itself.
// Chain: admin_provider → owner → partner → super_admin → admin → agent → player.
export const ROLE_ORDER: UserRole[] = [
  "admin_provider",
  "owner",
  "partner",
  "super_admin",
  "admin",
  "agent",
  "player",
];

// Every role can create ANY role strictly below it (matches the backend).
export function creatableRoles(role: UserRole | null): UserRole[] {
  const i = role ? ROLE_ORDER.indexOf(role) : -1;
  if (i === -1 || i >= ROLE_ORDER.length - 1) return [];
  return ROLE_ORDER.slice(i + 1);
}

export const ROLE_LABEL: Record<string, string> = {
  admin_provider: "Admin Provider",
  owner: "Owner",
  partner: "Partner",
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Shop",
  player: "Player",
  provider: "Provider",
};
