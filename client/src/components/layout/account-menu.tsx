"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, ChevronDown, UserCog, ArrowLeftRight, LogOut, Plus, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { useCashback, useCountdown } from "@/lib/cashback";
import { formatMoney, cn } from "@/lib/utils";
import { isStaffRole } from "@/lib/auth-api";
import type { User } from "@/lib/types";

// Balance pill + dropdown (Deposit / Profile / Operations / Logout).
export function AccountMenu({ user }: { user: User }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: cashback } = useCashback();
  const countdown = useCountdown(cashback?.nextPayoutAt);
  // admin_provider has an unlimited network balance (infinite source).
  const unlimited = user.role === "admin_provider";
  const balanceText = unlimited ? "Unlimited" : formatMoney(user.balance, "");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const doLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    logout();
    setOpen(false);
    toast.success("Logged out");
    router.push("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 transition-colors hover:border-gold/40"
      >
        <Wallet className="size-4 text-gold" />
        <span className="text-sm font-semibold tabular-nums">{balanceText}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 sm:right-0 top-[calc(100%+8px)] z-50 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-bg-elevated shadow-xl origin-top-right">
          {/* Balance summary */}
          <div className="border-b border-line p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Balance</span>
              <span className="font-bold tabular-nums">
                {balanceText} {!unlimited && <span className="text-xs text-muted">TND</span>}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted">Bonus</span>
              <span className="font-bold tabular-nums">
                0.00 <span className="text-xs text-muted">TND</span>
              </span>
            </div>
            {/* Weekly 5% cashback on net losses — auto-credited at week reset. */}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted">
                Remise en argent <span className="text-[10px] text-gold">{cashback?.rate ?? 5}%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold tabular-nums">
                  {formatMoney(cashback?.pendingCashback ?? 0, "")}{" "}
                  <span className="text-xs text-muted">TND</span>
                </span>
                <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] tabular-nums text-muted">
                  {countdown}
                </span>
              </span>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-gradient py-2 text-sm font-bold text-brand-foreground hover:brightness-110"
            >
              <Plus className="size-4" /> Deposit
            </Link>
          </div>

          {/* Links */}
          <div className="p-1.5">
            {isStaffRole(user.role) && (
              <MenuLink
                href="/panel"
                icon={LayoutDashboard}
                label="Control Panel"
                onClose={() => setOpen(false)}
              />
            )}
            <MenuLink href="/profile" icon={UserCog} label="My Account" onClose={() => setOpen(false)} />
            <MenuLink
              href="/profile?section=operations"
              icon={ArrowLeftRight}
              label="Operations"
              onClose={() => setOpen(false)}
            />
            <button
              onClick={doLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-surface"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClose,
}: {
  href: string;
  icon: typeof UserCog;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface"
    >
      <Icon className="size-4 text-gold" /> {label}
    </Link>
  );
}
