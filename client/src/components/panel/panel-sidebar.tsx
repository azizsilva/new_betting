"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ArrowLeftRight,
  History,
  BarChart3,
  Gamepad2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { ROLE_LABEL, creatableRoles } from "@/lib/panel-api";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Users };
type Group = { title: string; items: Item[] };

export function PanelSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Member list pages the actor can see = the roles they can create.
  const memberItems: Item[] = creatableRoles(user?.role ?? null).map((r) => ({
    href: `/panel/members/${r}`,
    label: `${ROLE_LABEL[r]}s`,
    icon: Users,
  }));

  const groups: Group[] = [
    {
      title: "Menu",
      items: [{ href: "/panel", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Members",
      items: [
        { href: "/panel/create", label: "Create Member", icon: UserPlus },
        ...memberItems,
      ],
    },
    {
      title: "Finance",
      items: [
        { href: "/panel/transfer", label: "Transfer", icon: ArrowLeftRight },
        { href: "/panel/transfers", label: "Transfer History", icon: History },
      ],
    },
    {
      title: "Reports",
      items: [
        { href: "/panel/report", label: "Game Report", icon: BarChart3 },
        { href: "/panel/casino", label: "Casino Bets", icon: Gamepad2 },
      ],
    },
  ];

  const doLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    logout();
    toast.success("Logged out");
    router.push("/");
  };

  return (
    <aside className="flex w-full flex-col rounded-2xl border border-line bg-surface lg:w-[260px] lg:shrink-0">
      <nav className="flex flex-col gap-1 p-2">
        {groups.map((group) => (
          <div key={group.title} className="mb-1">
            <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted">
              {group.title}
            </div>
            {group.items.map((it) => {
              const Icon = it.icon;
              const active =
                it.href === "/panel"
                  ? pathname === "/panel" || pathname === "/panel/users"
                  : pathname === it.href || pathname.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-gold-gradient text-brand-foreground"
                      : "text-fg/90 hover:bg-surface-2",
                  )}
                >
                  <Icon className="size-4.5" />
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}

        <button
          onClick={doLogout}
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-fg/90 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="size-4.5" /> Logout
        </button>
      </nav>

      <div className="mt-auto border-t border-line p-4 text-xs text-muted">
        <div className="font-semibold text-gold">{user?.username}</div>
        <div className="mt-0.5">
          {ROLE_LABEL[user?.role ?? ""] ?? user?.role} · ID {user?.id}
        </div>
      </div>
    </aside>
  );
}
