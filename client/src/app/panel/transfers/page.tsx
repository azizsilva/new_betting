"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getTransactions } from "@/lib/panel-api";
import { formatMoney, cn } from "@/lib/utils";

export default function TransferHistoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ["transactions"], queryFn: () => getTransactions(100) });

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-4">
        <h1 className="text-lg font-bold">Transfer History</h1>
      </div>

      {isLoading ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="size-6 animate-spin text-gold" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="p-10 text-center text-muted">No transfers yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Counterparty</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 text-right font-semibold">Amount</th>
                <th className="p-3 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-line/60 last:border-0">
                  <td className="p-3 text-muted">
                    {new Date(t.createdAt).toLocaleString("en-GB")}
                  </td>
                  <td className="p-3 font-medium">{t.counterparty ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        t.direction === "in" ? "bg-brand/15 text-brand" : "bg-gold/15 text-gold",
                      )}
                    >
                      {t.direction === "in" ? (
                        <ArrowDownLeft className="size-3" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      {t.direction === "in" ? "Received" : "Sent"}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "p-3 text-right font-semibold tabular-nums",
                      t.direction === "in" ? "text-brand" : "text-gold",
                    )}
                  >
                    {t.direction === "in" ? "+" : "−"}
                    {formatMoney(t.amount, "")}
                  </td>
                  <td className="p-3 text-xs text-muted">{t.txnRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
