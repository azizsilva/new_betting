"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { getDownline, transfer } from "@/lib/panel-api";
import { formatMoney, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function TransferInner() {
  const qc = useQueryClient();
  const params = useSearchParams();
  const { data: downline } = useQuery({ queryKey: ["downline"], queryFn: getDownline });

  const [targetUserId, setTargetUserId] = useState<number | "">(
    params.get("user") ? Number(params.get("user")) : "",
  );
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [description, setDescription] = useState("");

  const mut = useMutation({
    mutationFn: transfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["downline"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Transfer completed");
      setAmount("");
      setDescription("");
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? "Failed") : "Transfer failed"),
  });

  const input =
    "h-11 w-full rounded-lg border border-line bg-bg-elevated px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-4">
        <h1 className="text-lg font-bold">Transfer</h1>
        <p className="mt-1 text-xs text-muted">
          Deposit credit to a downline user, or withdraw it back up.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!targetUserId) return toast.error("Select a user");
          mut.mutate({ targetUserId: Number(targetUserId), amount, type, description });
        }}
        className="flex flex-col gap-4 p-5"
      >
        {/* deposit / withdraw toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-bg-elevated p-1">
          {(["deposit", "withdrawal"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-md py-2 text-sm font-bold uppercase transition-colors",
                type === t ? "bg-gold-gradient text-brand-foreground" : "text-muted hover:text-fg",
              )}
            >
              {t === "deposit" ? "Deposit" : "Withdraw"}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">User</span>
          <select
            className={input}
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Select a user…</option>
            {(downline ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} — {formatMoney(u.balance, "")} ({u.role})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Amount</span>
          <input
            className={input}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Note (optional)</span>
          <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <Button type="submit" variant="brand" size="lg" disabled={mut.isPending} className="gap-2">
          {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
          {type === "deposit" ? "Deposit" : "Withdraw"}
        </Button>
      </form>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-gold" /></div>}>
      <TransferInner />
    </Suspense>
  );
}
