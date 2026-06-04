"use client";

import { useQuery } from "@tanstack/react-query";
import { getDownlineStats } from "@/lib/panel-api";
import { useAuthStore } from "@/store/auth";
import { formatMoney } from "@/lib/utils";

// Top stats bar (xbet): totals across the actor's direct downline + own balance.
export function StatsBar() {
  const me = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ["downline-stats"], queryFn: getDownlineStats });

  const isAdmin = me?.role === "admin_provider";

  const items = [
    { label: "Total Balance", value: formatMoney(data?.totalBalance ?? 0, ""), tone: "" },
    { label: "Total Exposure", value: `(${formatMoney(data?.totalExposure ?? 0, "")})`, tone: "text-danger" },
    { label: "Total Avail. Balance", value: formatMoney(data?.totalAvailBalance ?? 0, ""), tone: "" },
    ...(isAdmin
      ? []
      : [{ label: "My Balance", value: formatMoney(me?.balance ?? 0, ""), tone: "text-gold" }]),
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl bg-bg-elevated px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted">{it.label}</div>
          <div className={`mt-0.5 text-lg font-bold tabular-nums ${it.tone}`}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}
