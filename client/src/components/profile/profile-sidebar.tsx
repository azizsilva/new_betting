"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  UserCog,
  ShieldCheck,
  Bell,
  ArrowLeftRight,
  Star,
  Gift,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatMoney, cn } from "@/lib/utils";
import type { User } from "@/lib/types";

// Dashboard menu — "Mes paris" (My bets) intentionally omitted (no sportsbook).
const MENU = [
  { id: "personal", label: "Personal Information", icon: UserCog },
  { id: "kyc", label: "Identity Verification", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "operations", label: "Operations", icon: ArrowLeftRight },
  { id: "cashback", label: "Cashback", icon: Star },
  { id: "benefits", label: "Benefits", icon: Gift },
];

export function ProfileSidebar({
  user,
  active,
  onSelect,
}: {
  user: User;
  active: string;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(String(user.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const doLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    logout();
    toast.success("Logged out");
    router.push("/");
  };

  const joined = new Date(user.createdAt).toLocaleDateString("en-GB");

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
      {/* Balance card */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-gold-gradient">{user.username}</h2>
        </div>
        <button
          onClick={copyId}
          className="mt-1 flex items-center gap-1.5 text-sm text-muted hover:text-fg"
        >
          Player ID: {user.id}
          {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
        </button>

        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Balance</span>
            <span className="font-bold tabular-nums">
              {formatMoney(user.balance, "")}
              <span className="ml-1 text-xs text-muted">TND</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Bonus</span>
            <span className="font-bold tabular-nums">
              0.00<span className="ml-1 text-xs text-muted">TND</span>
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg">Withdraw</Button>
          <Button variant="brand" size="lg">Deposit</Button>
        </div>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {MENU.map((m) => {
          const Icon = m.icon;
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition-colors",
                isActive
                  ? "border-gold/50 bg-surface-2 text-fg"
                  : "border-line bg-surface text-fg/90 hover:bg-surface-2",
              )}
            >
              <span className="grid size-9 place-items-center rounded-full bg-bg-elevated">
                <Icon className="size-4 text-gold" />
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Account footer */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <div className="text-xs text-muted">
          Account registered
          <div className="font-semibold text-fg">{joined}</div>
        </div>
        <Button variant="outline" size="sm" onClick={doLogout} className="gap-1.5">
          <LogOut className="size-4" /> Logout
        </Button>
      </div>
    </aside>
  );
}
