"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { getDownline, ROLE_LABEL } from "@/lib/panel-api";
import { useDebounce } from "@/lib/use-debounce";
import { formatMoney, cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

// Per-role member list (Owners / Partners / Super Admins / Admins / Shops / Players).
// xbet columns: Username · Password · Commission % · Balance · Credit Limit · Downline · Status.
export default function MembersByRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = use(params);
  const label = ROLE_LABEL[role] ?? role;

  const [q, setQ] = useState("");
  const term = useDebounce(q, 250).trim().toLowerCase();

  const { data, isLoading } = useQuery({ queryKey: ["downline"], queryFn: getDownline });
  const rows = useMemo(() => {
    const inRole = (data ?? []).filter((u) => u.role === (role as UserRole));
    if (!term) return inRole;
    return inRole.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        String(u.id).includes(term) ||
        (u.passwordText ?? "").toLowerCase().includes(term),
    );
  }, [data, role, term]);

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold">{label}s</h1>
          <p className="mt-1 text-xs text-muted">Total: {rows.length}</p>
        </div>
        {/* Debounced search by username / ID / password. */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}s…`}
            className="h-10 w-full rounded-lg border border-line bg-bg-elevated pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="size-6 animate-spin text-gold" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted">
          {term ? `No ${label.toLowerCase()}s match "${q}".` : `No ${label.toLowerCase()}s yet.`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th className="p-3 font-semibold">{label}</th>
                <th className="p-3 font-semibold">Password</th>
                <th className="p-3 text-right font-semibold">Commission %</th>
                <th className="p-3 text-right font-semibold">Balance</th>
                <th className="p-3 text-right font-semibold">Credit Limit</th>
                <th className="p-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                  <td className="p-3">
                    <div className="font-semibold text-gold">{u.username}</div>
                    <div className="text-[11px] text-muted">ID {u.id}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{u.passwordText || "—"}</td>
                  <td className="p-3 text-right tabular-nums">{Number(u.rate).toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{formatMoney(u.balance, "")}</td>
                  <td className="p-3 text-right tabular-nums text-muted">{formatMoney(u.creditRef, "")}</td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                        u.status === "active"
                          ? "bg-brand/15 text-brand"
                          : "bg-danger/15 text-danger",
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
