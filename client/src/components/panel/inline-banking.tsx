"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { transfer } from "@/lib/panel-api";

// Inline amount + D / W buttons (xbet banking row): deposit credit down to the
// user, or withdraw it back up. Optimistically refetches downline + stats.
export function InlineBanking({ userId }: { userId: number }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");

  const mut = useMutation({
    mutationFn: (type: "deposit" | "withdrawal") =>
      transfer({ targetUserId: userId, amount, type }),
    onSuccess: (_d, type) => {
      qc.invalidateQueries({ queryKey: ["downline"] });
      qc.invalidateQueries({ queryKey: ["downline-stats"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${type === "deposit" ? "Deposited" : "Withdrew"} ${amount}`);
      setAmount("");
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? "Failed") : "Failed"),
  });

  const submit = (type: "deposit" | "withdrawal") => {
    if (!amount || Number(amount) <= 0) return toast.error("Enter an amount");
    mut.mutate(type);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="h-8 w-24 rounded-md border border-line bg-bg-elevated px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      />
      <button
        onClick={() => submit("deposit")}
        disabled={mut.isPending}
        title="Deposit"
        className="grid h-8 w-8 place-items-center rounded-md bg-brand/90 text-sm font-bold text-brand-foreground hover:bg-brand disabled:opacity-50"
      >
        {mut.isPending && mut.variables === "deposit" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          "D"
        )}
      </button>
      <button
        onClick={() => submit("withdrawal")}
        disabled={mut.isPending}
        title="Withdraw"
        className="grid h-8 w-8 place-items-center rounded-md bg-danger text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
      >
        {mut.isPending && mut.variables === "withdrawal" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          "W"
        )}
      </button>
    </div>
  );
}
