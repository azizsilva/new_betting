"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Wallet, X, Home } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { PanelSidebar } from "./panel-sidebar";
import { Logo } from "@/components/logo";
import { ROLE_LABEL } from "@/lib/panel-api";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Staff-only shell. Players are bounced to their /profile; guests to home.
export function PanelShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/");
    } else if (user && user.role === "player") {
      router.replace("/profile");
    }
  }, [accessToken, user, router]);

  if (!accessToken || !user || user.role === "player") return null;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Panel header */}
      <header className="sticky top-0 z-40 border-b border-line bg-gradient-to-r from-bg-elevated via-surface to-bg-elevated">
        <div className="mx-auto flex h-20 w-full items-center gap-3 px-4 sm:px-6">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid size-10 place-items-center rounded-lg border border-line text-fg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <Logo size={80} href="/panel/users" className="h-16 sm:h-20 w-auto py-1" />

          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 px-2 sm:px-3 border-line bg-surface hover:bg-surface-2 text-fg">
                <Home className="size-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
              <Wallet className="size-4 text-gold" />
              <span className="text-sm font-semibold tabular-nums">
                {user.role === "admin_provider" ? "∞" : formatMoney(user.balance, "")}
              </span>
            </div>
            <span className="hidden rounded-lg bg-gold-gradient px-3 py-2 text-xs font-bold uppercase text-brand-foreground sm:inline">
              {ROLE_LABEL[user.role ?? ""] ?? user.role}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row">
        {/* Desktop sidebar (static) */}
        <div className="hidden lg:block">
          <PanelSidebar />
        </div>

        {/* Mobile sidebar (slide-in sheet) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85%] overflow-y-auto bg-bg-elevated p-3 lg:hidden"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <Logo size={40} href={null} className="h-10 w-auto" />
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-muted hover:text-fg"
                    aria-label="Close menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <PanelSidebar onNavigate={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Panel footer */}
      <footer className="mt-auto border-t border-line bg-bg-elevated">
        <div className="mx-auto flex w-full flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Logo size={28} href={null} className="h-7 w-auto" />
            <span>© {new Date().getFullYear()} BetSlate — Control Panel</span>
          </div>
          <span>Logged in as {user.username} · {ROLE_LABEL[user.role ?? ""] ?? user.role}</span>
        </div>
      </footer>
    </div>
  );
}
