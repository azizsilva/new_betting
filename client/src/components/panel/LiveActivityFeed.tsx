"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Loader2, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type LiveEvent = {
  id: number;
  username: string;
  action: "bet" | "win" | "refund";
  game: string;
  amount: number;
  createdAt: string;
};

export function LiveActivityFeed() {
  const { user } = useAuthStore();

  const { data: events, isLoading } = useQuery<LiveEvent[]>({
    queryKey: ["casino", "live-feed"],
    queryFn: async () => {
      const res = await api.get("/casino/live-feed");
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 3000, // Poll every 3 seconds for "en direct" feel
  });

  if (!user) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-5 flex flex-col h-[400px]">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="size-5 text-emerald-500 animate-pulse" />
        <h2 className="text-lg font-bold">Live Player Activity</h2>
      </div>

      {isLoading && !events ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-gold" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-3">
            {events?.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg bg-bg-elevated p-3 border border-line">
                <div className="flex items-center gap-3">
                  <div className={`flex size-8 items-center justify-center rounded-full ${ev.action === "win" ? "bg-emerald-500/10 text-emerald-500" : "bg-danger/10 text-danger"}`}>
                    {ev.action === "win" ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-fg">{ev.username}</div>
                    <div className="text-xs text-muted">{ev.game}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${ev.action === "win" ? "text-emerald-500" : "text-danger"}`}>
                    {ev.action === "win" ? "+" : "-"}{formatMoney(ev.amount, "TND")}
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(ev.createdAt).toLocaleTimeString('en-US', { hour12: false })}
                  </div>
                </div>
              </div>
            ))}

            {events?.length === 0 && (
              <div className="text-center text-sm text-muted py-8">
                No recent activity.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
