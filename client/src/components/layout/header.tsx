"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LayoutDashboard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { AccountMenu } from "@/components/layout/account-menu";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { isStaffRole } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Sport", href: "/sports" },
  { label: "Live Sports", href: "/live-sports" },
  { label: "Casino", href: "/casino" },
  { label: "Live Casino", href: "/live-casino", live: true },
  { label: "Instant", href: "/instant" },
  { label: "Promotions", href: "/promotions" },
];

// Active when the pathname matches the link (or a sub-route of it).
function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Header() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-gradient-to-r from-[var(--color-bg-elevated)] via-[var(--color-surface)] to-[var(--color-bg-elevated)] backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
        {/* Logo (mobile menu lives in the bottom nav, not here) */}
        <Logo size={80} className="h-16 sm:h-20 w-auto py-1" />

        {/* Primary nav (centered, kingsbet-style) */}
        <nav className="mx-auto hidden items-center gap-1.5 lg:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-bold transition-colors xl:px-4",
                  active
                    ? "bg-gold-gradient text-brand-foreground gold-glow"
                    : "text-fg/80 hover:text-fg",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {item.label}
                  {item.live && !active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-danger live-pulse" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Search (URL-backed) */}
        <div className="hidden w-48 md:block xl:w-56">
          <SearchBox />
        </div>

        {/* Auth / balance */}
        {user ? (
          <div className="ml-auto flex items-center gap-2">
            {/* Username + ID chip → profile (players) or panel (staff). */}
            <Link
              href={isStaffRole(user.role) ? "/panel" : "/profile"}
              className="hidden h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 transition-colors hover:border-gold/40 sm:flex"
            >
              <div className="flex flex-col justify-center leading-none">
                <div className="text-sm font-bold text-gold">{user.username}</div>
                <div className="mt-0.5 whitespace-nowrap text-[9px] text-muted capitalize">
                  {(user.role ?? "player").replace("_", " ")} · ID {user.id}
                </div>
              </div>
            </Link>

            {/* Balance + account dropdown (incl. logout) */}
            <AccountMenu user={user} />
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {/* No public registration — accounts are created by an agent. */}
            <Button
              variant="brand"
              size="sm"
              className="gap-1.5"
              onClick={() => useUiStore.getState().openLoginModal()}
            >
              <LogIn className="size-4" /> Login
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
