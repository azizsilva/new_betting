"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { X, LogIn, ChevronDown } from "lucide-react";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SpriteIcon } from "@/components/icon-sprite";
import { cn } from "@/lib/utils";

const SPORT1_HREF = "/casino/play/8a704858d5deb4af1ddc722092ac7614?account=gambly";
const SPORT2_HREF = `/casino/play/${encodeURIComponent("swa:0:0")}?account=slots`;

const SPORT_ITEMS = [
  { label: "Sport 1",      href: SPORT1_HREF,               icon: "icon-sports",         sub: "Gambly Sportsbook" },
  { label: "Sport 2",      href: SPORT2_HREF,               icon: "icon-live-in-play",   sub: "Altenar · Tous les matchs" },
];

const CASINO_ITEMS = [
  { label: "Casino",       href: "/casino?tab=casino",      icon: "icon-games" },
  { label: "Live Casino",  href: "/casino?tab=live-casino", icon: "icon-live-casino-nav", live: true },
  { label: "Instant",      href: "/casino?tab=instant",     icon: "icon-crash-rocket" },
];

const COMMUNITY = [
  { label: "Sécurité",    href: "#" },
  { label: "Cookies",     href: "#" },
  { label: "À propos",    href: "#" },
  { label: "Affiliation", href: "#" },
];

export function MobileDrawer() {
  const { drawerOpen, closeDrawer, openLoginModal } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const [sportExpanded, setSportExpanded] = useState(true);

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

          <div className="flex-1 overflow-y-auto px-3 pt-4">
            {/* Logo + close */}
            <div className="flex items-center justify-between px-1 pb-5">
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
              <div className="mb-5 flex gap-2 px-1">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm"
                  onClick={() => { closeDrawer(); openLoginModal(); }}
                >
                  <LogIn className="size-4" /> Connexion
                </Button>
                <Button
                  variant="brand"
                  className="flex-1 gap-2 text-sm"
                  onClick={() => { closeDrawer(); openLoginModal(); }}
                >
                  Inscription
                </Button>
              </div>
            )}

            {/* ── SPORT section (collapsible like X10BET) ── */}
            <div className="mb-1">
              <button
                onClick={() => setSportExpanded((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-widest text-white/40 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SpriteIcon id="icon-sports" size={16} className="text-gold/60" />
                  Sport
                </div>
                <ChevronDown className={cn("size-4 text-white/30 transition-transform", sportExpanded && "rotate-180")} />
              </button>

              {sportExpanded && (
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {SPORT_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeDrawer}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold/10 transition-colors group-hover:bg-gold/20">
                        <SpriteIcon id={item.icon} size={20} className="text-gold" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        {"sub" in item && (
                          <div className="truncate text-[10px] text-white/35">{item.sub}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-3 my-2 h-px bg-white/5" />

            {/* ── CASINO section ── */}
            <div className="mb-1">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/40">
                Casino
              </div>
              <div className="flex flex-col gap-0.5">
                {CASINO_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeDrawer}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 transition-colors group-hover:bg-white/10">
                      <SpriteIcon id={item.icon} size={20} className="text-white/70 group-hover:text-white" />
                    </span>
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-semibold text-white/90">{item.label}</span>
                      {"live" in item && item.live && (
                        <span className="flex items-center gap-1 rounded-full bg-danger/20 px-2 py-0.5 text-[9px] font-bold text-danger">
                          <span className="size-1.5 rounded-full bg-danger live-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-3 my-2 h-px bg-white/5" />

            {/* ── Community ── */}
            <div className="pb-6">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/40">
                Communauté
              </div>
              <div className="flex flex-col">
                {COMMUNITY.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    onClick={closeDrawer}
                    className="px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
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
