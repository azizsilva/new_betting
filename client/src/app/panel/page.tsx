"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, DollarSign, TrendingUp, Activity, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";

// Dummy chart data (since we don't have historical data in the backend yet)
const chartData = [
  { name: "Apr 3", partners: 12, users: 200 },
  { name: "Apr 10", partners: 15, users: 210 },
  { name: "Apr 17", partners: 18, users: 250 },
  { name: "Apr 24", partners: 13, users: 190 },
  { name: "May 1", partners: 20, users: 280 },
  { name: "May 8", partners: 25, users: 320 },
  { name: "May 15", partners: 19, users: 260 },
  { name: "May 23", partners: 21, users: 300 },
  { name: "May 31", partners: 24, users: 350 },
  { name: "Jun 7", partners: 28, users: 380 },
  { name: "Jun 14", partners: 38, users: 426 },
];

type SubtreeUser = {
  id: number;
  username: string;
  role: string;
  balance: string;
  parent_id: number;
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Fetch full subtree to calculate role-based counts
  const { data: subtree, isLoading } = useQuery<SubtreeUser[]>({
    queryKey: ["users", "subtree"],
    queryFn: async () => {
      const res = await api.get("/users/subtree");
      return res.data;
    },
    enabled: !!user,
  });

  const computedStats = useMemo(() => {
    if (!subtree) return null;

    const totalUsers = subtree.length;
    const players = subtree.filter((u) => u.role === "player").length;
    const partners = subtree.filter((u) => u.role === "partner").length;
    const agents = subtree.filter((u) => u.role === "agent").length;
    const admins = subtree.filter((u) => u.role === "admin" || u.role === "super_admin").length;
    
    // Sum of balances of direct downline
    const totalBalance = subtree
      .filter((u) => u.parent_id === user?.id)
      .reduce((acc, u) => acc + parseFloat(u.balance || "0"), 0);

    return { totalUsers, players, partners, agents, admins, totalBalance };
  }, [subtree, user?.id]);

  if (!user) return null;

  if (isLoading || !computedStats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    );
  }

  // Determine what stats to show based on role using real data
  let stats = [];

  if (user.role === "admin_provider" || user.role === "owner") {
    stats = [
      { title: "Network Balance", value: formatMoney(computedStats.totalBalance, "$"), trend: "+12.5%", desc: "Direct downline balance", subDesc: "Current period", icon: DollarSign },
      { title: "Total Partners", value: computedStats.partners.toString(), trend: "+5%", desc: "Active network partners", subDesc: "Acquisition on track", icon: Users },
      { title: "Total Agents", value: computedStats.agents.toString(), trend: "+8.2%", desc: "Active agents", subDesc: "Steady growth", icon: Users },
      { title: "Active Players", value: computedStats.players.toString(), trend: "+15%", desc: "Total players in network", subDesc: "Engagement exceed targets", icon: Activity },
    ];
  } else if (user.role === "provider" || user.role === "super_admin" || user.role === "admin") {
    stats = [
      { title: "Network Balance", value: formatMoney(computedStats.totalBalance, "$"), trend: "+8.5%", desc: "Direct downline balance", subDesc: "Current period", icon: DollarSign },
      { title: "Total Agents", value: computedStats.agents.toString(), trend: "+4%", desc: "Active agents", subDesc: "Steady growth", icon: Users },
      { title: "Active Players", value: computedStats.players.toString(), trend: "+10.2%", desc: "Total players in network", subDesc: "Engagement exceed targets", icon: Activity },
      { title: "Total Network", value: computedStats.totalUsers.toString(), trend: "+2.5%", desc: "All downline accounts", subDesc: "Meets growth projections", icon: TrendingUp },
    ];
  } else {
    stats = [
      { title: "Players Balance", value: formatMoney(computedStats.totalBalance, "$"), trend: "+4.5%", desc: "Direct players balance", subDesc: "Current period", icon: DollarSign },
      { title: "Active Players", value: computedStats.players.toString(), trend: "+15.2%", desc: "Strong user retention", subDesc: "Engagement exceed targets", icon: Activity },
      { title: "Network Size", value: computedStats.totalUsers.toString(), trend: "+6.5%", desc: "Total downline size", subDesc: "Steady performance increase", icon: TrendingUp },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{s.title}</span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${s.trend.startsWith("-") ? "text-danger" : "text-emerald-500"}`}>
                {s.trend}
                {s.trend.startsWith("-") ? (
                  <TrendingUp className="size-3 rotate-180" />
                ) : (
                  <TrendingUp className="size-3" />
                )}
              </span>
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-2 text-xs">
              <div className="font-semibold text-fg/80">{s.desc}</div>
              <div className="text-muted">{s.subDesc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Network Growth</h2>
            <p className="text-sm text-muted">Partners and Users over the last 3 months</p>
          </div>
          <div className="flex rounded-lg border border-line bg-bg-elevated p-1">
            <button className="rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-fg shadow-sm">Last 3 months</button>
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-fg">Last 30 days</button>
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-fg">Last 7 days</button>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPartners" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a1a1aa" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a1a1aa" }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                itemStyle={{ color: "#e4e4e7" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Area type="monotone" dataKey="users" name="Active Users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" />
              <Area type="monotone" dataKey="partners" name="Partners" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPartners)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
