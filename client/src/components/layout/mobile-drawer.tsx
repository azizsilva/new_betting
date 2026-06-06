"use client";

import Link from "next/link";
import { Drawer } from "vaul";
import { X, LogIn, UserPlus } from "lucide-react";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SpriteIcon } from "@/components/icon-sprite";

const SPORT_HREF = "/casino/play/8a704858d5deb4af1ddc722092ac7614?account=gambly";

const NAV = [
  { label: "Home",        href: "/",                        icon: "icon-home" },
  { label: "Sport",       href: SPORT_HREF,                 icon: "icon-sport" },
  { label: "Live Sports", href: SPORT_HREF,                 icon: "icon-live-in-play" },
  { label: "Casino",      href: "/casino?tab=casino",       icon: "icon-games" },
  { label: "Live Casino", href: "/casino?tab=live-casino",  icon: "icon-live-casino-nav" },
  { label: "Instant",     href: "/casino?tab=instant",      icon: "icon-crash-rocket" },
];

const COMMUNITY = [
  { label: "Security",  href: "#" },
  { label: "Cookies",   href: "#" },
  { label: "About Us",  href: "#" },
  { label: "Affiliate", href: "#" },
];

export function MobileDrawer() {
  const { drawerOpen, closeDrawer, openLoginModal } = useUiStore();
  const user = useAuthStore((s) => s.user);

  return (
    <Drawer.Root
      direction="left"
      open={drawerOpen}
      onOpenChange={(o) => !o && closeDrawer()}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm lg:hidden" />
        <Drawer.Content className="fixed inset-y-0 left-0 z-[90] flex h-full w-[85vw] max-w-[320px] flex-col border-r border-white/5 bg-[#141414] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] lg:hidden">
          <Drawer.Title className="sr-only">Menu</Drawer.Title>
          <Drawer.Description className="sr-only">Navigation menu</Drawer.Description>

          <div className="overflow-y-auto px-4 pt-4">
            {/* Logo + close */}
            <div className="flex items-center justify-between pb-5">
              <Logo size={48} className="h-12 w-auto" href="/" />
              <button
                onClick={closeDrawer}
                className="grid size-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Auth */}
            {!user && (
              <div className="mb-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
                  onClick={() => { closeDrawer(); openLoginModal(); }}
                >
                  <LogIn className="size-4" /> Connexion
                </Button>
                <Button
                  variant="brand"
                  className="flex-1 gap-2"
                  onClick={() => { closeDrawer(); openLoginModal(); }}
                >
                  <UserPlus className="size-4" /> S&apos;inscrire
                </Button>
              </div>
            )}

            {/* Main nav — KingsBet365 style */}
            <nav className="mt-1 flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="group flex items-center gap-3.5 rounded-lg px-2 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <SpriteIcon
                    id={item.icon}
                    size={22}
                    className="text-[#c9a84c] transition-colors group-hover:text-[#e2c06a]"
                  />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Community */}
            <div className="mt-3 border-t border-white/5 pb-6 pt-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/30">
                Community
              </div>
              <div className="flex flex-col">
                {COMMUNITY.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    onClick={closeDrawer}
                    className="py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                    {c.label}
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
