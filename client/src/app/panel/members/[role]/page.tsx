"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getDownline, ROLE_LABEL } from "@/lib/panel-api";
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

  const { data, isLoading } = useQuery({ queryKey: ["downline"], queryFn: getDownline });
  const rows = (data ?? []).filter((u) => u.role === (role as UserRole));

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-4">
        <h1 className="text-lg font-bold">{label}s</h1>
        <p className="mt-1 text-xs text-muted">Total: {rows.length}</p>
      </div>

      {isLoading ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="size-6 animate-spin text-gold" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted">No {label.toLowerCase()}s yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th className="p-3 font-semibold">{label}</th>
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
