"use client";

import Link from "next/link";
import { Drawer } from "vaul";
import {
  Crown,
  ChevronRight,
  ChevronDown,
  LogIn,
  UserPlus,
  X,
  Gift,
  Home,
  Dices,
  Disc3,
  Gem,
  Trophy,
  Rocket,
} from "lucide-react";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Casino", href: "/casino", icon: Dices },
  { label: "Live Casino", href: "/live-casino", icon: Disc3 },
  { label: "Slots", href: "/casino?cat=slots", icon: Gem },
  { label: "Jackpots", href: "/casino?cat=jackpot", icon: Trophy },
  { label: "Instant", href: "/instant", icon: Rocket },
];

const COMMUNITY = ["Security", "Cookies", "About Us", "Affiliate"];

// Bottom sheet (slides up) opened from the mobile bottom-nav "Menu" tab.
export function MobileDrawer() {
  const { drawerOpen, closeDrawer, openLoginModal } = useUiStore();
  const user = useAuthStore((s) => s.user);

  return (
    <Drawer.Root direction="left" open={drawerOpen} onOpenChange={(o) => !o && closeDrawer()} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm lg:hidden" />
        <Drawer.Content className="fixed inset-y-0 left-0 z-[90] flex h-full w-[85vw] max-w-[320px] flex-col border-r border-line bg-bg-elevated pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] lg:hidden">
          <Drawer.Title className="sr-only">Menu</Drawer.Title>
          <Drawer.Description className="sr-only">Navigation menu</Drawer.Description>

          <div className="overflow-y-auto px-4 pt-4">
            {/* Logo + language + close */}
            <div className="flex items-center justify-between pb-5">
              <Logo size={48} className="h-12 w-auto" href="/" />
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2">
                  🇫🇷 FR <ChevronDown className="size-3 text-muted" />
                </button>
                <button onClick={closeDrawer} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-fg">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Auth — login and register side-by-side */}
            {!user && (
              <div className="mb-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-line bg-surface hover:bg-surface-2"
                  onClick={() => {
                    closeDrawer();
                    openLoginModal();
                  }}
                >
                  <LogIn className="size-4" /> Connexion
                </Button>
                <Button
                  variant="brand"
                  className="flex-1 gap-2"
                  onClick={() => {
                    closeDrawer();
                    // Optional: open register modal if one exists
                    openLoginModal();
                  }}
                >
                  <UserPlus className="size-4" /> S'inscrire
                </Button>
              </div>
            )}

            {/* Promotions card */}
            <Link
              href="/promotions"
              onClick={closeDrawer}
              className="flex items-center gap-3 rounded-xl border border-gold/40 bg-surface p-3"
            >
              <Gift className="size-7 text-gold" />
              <div className="flex-1">
                <div className="text-sm font-bold">Promotions</div>
                <div className="text-xs text-muted">5 promotions available</div>
              </div>
              <ChevronRight className="size-5 text-muted" />
            </Link>

            {/* Nav */}
            <nav className="mt-2 flex flex-col">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-semibold hover:bg-surface"
                  >
                    <Icon className="size-5 text-gold" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Community */}
            <div className="mt-3 border-t border-line pb-6 pt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Community
              </div>
              <div className="flex flex-col gap-1">
                {COMMUNITY.map((c) => (
                  <Link
                    key={c}
                    href="#"
                    onClick={closeDrawer}
                    className="py-2 text-sm font-medium hover:text-gold"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
