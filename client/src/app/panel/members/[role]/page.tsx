"use client";

import { use, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, X, CheckCircle2, XCircle, PauseCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import { getMembersByRole, setUserStatus, ROLE_LABEL } from "@/lib/panel-api";
import { useDebounce } from "@/lib/use-debounce";
import { formatMoney, cn } from "@/lib/utils";
import { InlineBanking } from "@/components/panel/inline-banking";
import { EditUserModal } from "@/components/panel/edit-user-modal";

// Per-role member list (Owners / Partners / Super Admins / Admins / Shops / Players).
// xbet columns: Username · Password · Commission % · Balance · Credit Limit · Downline · Status.
export default function MembersByRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const qc = useQueryClient();
  const { role } = use(params);
  const label = ROLE_LABEL[role] ?? role;

  const [q, setQ] = useState("");
  const term = useDebounce(q, 250).trim().toLowerCase();
  
  const [editingUser, setEditingUser] = useState<{ id: number; username: string } | null>(null);

  const { data, isLoading } = useQuery({ 
    queryKey: ["members", role], 
    queryFn: () => getMembersByRole(role) 
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "locked" | "suspended" }) =>
      setUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", role] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not update status"),
  });

  const rows = useMemo(() => {
    const inRole = data ?? [];
    if (!term) return inRole;
    return inRole.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        String(u.id).includes(term) ||
        (u.passwordText ?? "").toLowerCase().includes(term),
    );
  }, [data, term]);

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
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th className="p-3 font-semibold">{label}</th>
                <th className="p-3 font-semibold">Password</th>
                <th className="p-3 text-right font-semibold">Commission %</th>
                <th className="p-3 text-right font-semibold">Balance</th>
                <th className="p-3 text-right font-semibold">Credit Limit</th>
                <th className="p-3 font-semibold">Banking</th>
                <th className="p-3 text-center font-semibold">Status</th>
                <th className="p-3 text-center font-semibold">Actions</th>
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
                  <td className="p-3">
                    <InlineBanking userId={u.id} />
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                        u.status === "active" ? "bg-brand/15 text-brand" :
                        u.status === "locked" ? "bg-danger/15 text-danger" :
                        "bg-yellow-500/15 text-yellow-500"
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* Active Button */}
                      <button
                        onClick={() => statusMut.mutate({ id: u.id, status: "active" })}
                        disabled={u.status === "active"}
                        className={cn("p-1 rounded-md transition-colors", u.status === "active" ? "opacity-30 cursor-not-allowed" : "hover:bg-brand/20 text-brand")}
                        title="Activate"
                      >
                        <CheckCircle2 className="size-4" />
                      </button>
                      
                      {/* Suspend Button */}
                      <button
                        onClick={() => statusMut.mutate({ id: u.id, status: "suspended" })}
                        disabled={u.status === "suspended"}
                        className={cn("p-1 rounded-md transition-colors", u.status === "suspended" ? "opacity-30 cursor-not-allowed" : "hover:bg-yellow-500/20 text-yellow-500")}
                        title="Suspend"
                      >
                        <PauseCircle className="size-4" />
                      </button>

                      {/* Lock Button */}
                      <button
                        onClick={() => statusMut.mutate({ id: u.id, status: "locked" })}
                        disabled={u.status === "locked"}
                        className={cn("p-1 rounded-md transition-colors", u.status === "locked" ? "opacity-30 cursor-not-allowed" : "hover:bg-danger/20 text-danger")}
                        title="Lock"
                      >
                        <XCircle className="size-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingUser({ id: u.id, username: u.username })}
                        className="p-1 rounded-md hover:bg-gold/20 text-gold transition-colors ml-2 border-l border-line pl-3"
                        title="Edit Account"
                      >
                        <Edit className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
}
