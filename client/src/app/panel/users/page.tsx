"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, CheckCircle2, XCircle, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getDownline, setUserStatus, ROLE_LABEL } from "@/lib/panel-api";
import { useDebounce } from "@/lib/use-debounce";
import { StatsBar } from "@/components/panel/stats-bar";
import { InlineBanking } from "@/components/panel/inline-banking";
import { useAuthStore } from "@/store/auth";
import { formatMoney, cn } from "@/lib/utils";

export default function DashboardPage() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked" | "suspended">("all");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["downline"],
    queryFn: getDownline,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "locked" | "suspended" }) =>
      setUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["downline"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not update status"),
  });

  const term = useDebounce(q, 250).trim().toLowerCase();
  const rows = useMemo(() => {
    return (data ?? []).filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (
        term &&
        !u.username.toLowerCase().includes(term) &&
        !String(u.id).includes(term) &&
        !(u.passwordText ?? "").toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [data, term, statusFilter]);

  const childLabel = rows[0]?.role ? ROLE_LABEL[rows[0].role] ?? rows[0].role : "Downline";

  return (
    <div className="flex flex-col gap-4">
      <StatsBar />

      {/* Header row: actor badge + filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gold-gradient px-2 py-1 text-xs font-bold uppercase text-brand-foreground">
            {me?.role}
          </span>
          <span className="font-bold">{me?.username}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-9 rounded-lg border border-line bg-bg-elevated px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="suspended">Suspended</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search downline…"
              className="h-9 w-44 rounded-lg border border-line bg-bg-elevated pl-8 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="grid h-9 w-9 place-items-center rounded-lg bg-gold-gradient text-brand-foreground"
            title="Refresh"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Downline table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {isLoading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-gold" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-muted">No {childLabel.toLowerCase()} found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-muted">
                  <th className="p-3 font-semibold">Username</th>
                  <th className="p-3 font-semibold">Password</th>
                  <th className="p-3 text-right font-semibold">Balance</th>
                  <th className="p-3 text-right font-semibold">Credit Ref.</th>
                  <th className="p-3 text-right font-semibold">Exposure</th>
                  <th className="p-3 text-right font-semibold">Rate</th>
                  <th className="p-3 text-right font-semibold">Avail. Bal.</th>
                  <th className="p-3 font-semibold">Deposit / Withdraw</th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded bg-gold/15 text-[10px] font-bold text-gold">
                          {(u.role ?? "?")[0]!.toUpperCase()}
                        </span>
                        <div>
                          <div className="font-semibold">{u.username}</div>
                          <div className="text-[11px] text-muted">
                            ID {u.id}
                            {u.childrenCount > 0 && ` · ${u.childrenCount} below`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">{u.passwordText || "—"}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {formatMoney(u.balance, "")}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted">
                      {formatMoney(u.creditRef, "")}
                    </td>
                    <td className="p-3 text-right tabular-nums text-danger">
                      {formatMoney(u.exposure, "")}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted">{Number(u.rate).toFixed(2)}</td>
                    <td className="p-3 text-right font-semibold tabular-nums text-brand">
                      {formatMoney(u.availBalance, "")}
                    </td>
                    <td className="p-3">
                      <InlineBanking userId={u.id} />
                    </td>
                    <td className="p-3 text-center">
                      {u.status === "active" ? (
                        <button onClick={() => statusMut.mutate({ id: u.id, status: "locked" })} title="Active — click to lock">
                          <CheckCircle2 className="size-5 text-brand" />
                        </button>
                      ) : (
                        <button onClick={() => statusMut.mutate({ id: u.id, status: "active" })} title={`${u.status} — click to activate`}>
                          <XCircle className="size-5 text-danger" />
                        </button>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/panel/transfer?user=${u.id}`} className="text-muted hover:text-gold" title="Banking">
                          <Settings className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
