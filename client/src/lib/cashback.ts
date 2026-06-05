import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "@/store/auth";

export interface CashbackStatus {
  rate: number;
  currentWeekLoss: number;
  pendingCashback: number;
  nextPayoutAt: string;
  secondsUntilPayout: number;
  lastPayout: { weekStart: string; amount: number } | null;
}

// Weekly 5% cashback status. Hitting the endpoint also AUTO-settles any completed
// week (credits last week's 5% to the balance), so loading the dashboard is what
// pays it out — no cron needed.
export function useCashback() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["cashback"],
    queryFn: async () => (await api.get<CashbackStatus>("/cashback")).data,
    enabled: Boolean(token),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

// Live HH:MM:SS countdown to the next weekly payout.
export function useCountdown(targetIso: string | undefined): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!targetIso) return "--:--:--";
  const secs = Math.max(0, Math.floor((new Date(targetIso).getTime() - now) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
