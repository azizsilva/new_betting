"use client";

import Link from "next/link";
import { Drawer } from "vaul";
import {
  LogIn,
  UserPlus,
  X,
  Home,
  Trophy,
  Radio,
  Dices,
  Disc3,
  Rocket,
  Gift,
} from "lucide-react";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Gamblly sportsbook game_uid ("SPORT 2" / BetBy) — launched in the iframe.
const SPORT_HREF = "/casino/play/8a704858d5deb4af1ddc722092ac7614?account=gambly";

// Same nav as the desktop header (kingsbet365 order). Sport / Live Sports launch
// the Gamblly sportsbook; the casino entries use the ?tab= deep links.
const NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Sport", href: SPORT_HREF, icon: Trophy },
  { label: "Live Sports", href: SPORT_HREF, icon: Radio },
  { label: "Casino", href: "/casino?tab=casino", icon: Dices },
  { label: "Live Casino", href: "/casino?tab=live-casino", icon: Disc3 },
  { label: "Instant", href: "/casino?tab=instant", icon: Rocket },
  { label: "Promotions", href: "/promotions", icon: Gift },
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
            {/* Logo + close */}
            <div className="flex items-center justify-between pb-5">
              <Logo size={48} className="h-12 w-auto" href="/" />
              <button onClick={closeDrawer} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-fg">
                <X className="size-5" />
              </button>
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

            {/* Nav — mirrors the desktop header */}
            <nav className="mt-1 flex flex-col">
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
