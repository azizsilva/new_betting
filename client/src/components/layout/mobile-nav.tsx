"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SpriteIcon } from "@/components/icon-sprite";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

const SPORT1_HREF = "/casino/play/8a704858d5deb4af1ddc722092ac7614?account=gambly";
const SPORT2_HREF = `/casino/play/${encodeURIComponent("swa:0:0")}?account=slots`;

export function MobileNav() {
  const pathname = usePathname();
  const { drawerOpen, toggleDrawer, closeDrawer } = useUiStore();
  const [sportOpen, setSportOpen] = useState(false);

  const isHome   = !drawerOpen && pathname === "/";
  const isSport  = !drawerOpen && (pathname.startsWith("/casino/play/8a704858") || pathname.startsWith("/casino/play/swa"));
  const isCasino = !drawerOpen && !isSport && pathname.startsWith("/casino");
  const isMenu   = drawerOpen;

  const boxCls  = (on: boolean) => cn(
    "grid size-11 place-items-center rounded-xl transition-colors",
    on ? "bg-gold-gradient shadow-[0_2px_12px_rgba(212,175,55,0.4)]" : "bg-transparent",
  );
  const iconCls = (on: boolean) => on ? "text-black" : "text-white/60";
  const txtCls  = (on: boolean) => cn("text-[10px] font-semibold", on ? "text-gold" : "text-white/40");

  return (
    <>
      {/* Sport picker popup */}
      {sportOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setSportOpen(false)}>
          <div
            className="absolute bottom-[80px] left-2 w-56 overflow-hidden rounded-2xl border border-gold/30 bg-[#1c1c1c] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gold/50 border-b border-white/5">
              Choisir le sport
            </div>
            <Link
              href={SPORT1_HREF}
              onClick={() => { setSportOpen(false); closeDrawer(); }}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/5 active:bg-white/10"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15">
                <SpriteIcon id="icon-sports" size={20} className="text-gold" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">Sport 1</div>
                <div className="text-[10px] text-white/40">Gambly Sportsbook</div>
              </div>
            </Link>
            <div className="mx-4 h-px bg-white/5" />
            <Link
              href={SPORT2_HREF}
              onClick={() => { setSportOpen(false); closeDrawer(); }}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/5 active:bg-white/10"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15">
                <SpriteIcon id="icon-live-in-play" size={20} className="text-gold" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">Sport 2</div>
                <div className="text-[10px] text-white/40">Altenar · Tous les matchs</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-[55] border-t border-white/5 bg-[#111111] shadow-[0_-4px_20px_rgba(0,0,0,0.9)] lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-around px-1 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">

          {/* Sport */}
          <button
            onClick={() => setSportOpen((o) => !o)}
            className="flex flex-1 flex-col items-center gap-1 py-1"
            aria-label="Sport"
          >
            <span className={boxCls(isSport || sportOpen)}>
              <SpriteIcon id="icon-sports" size={22} className={iconCls(isSport || sportOpen)} />
            </span>
            <span className={txtCls(isSport || sportOpen)}>Sport</span>
          </button>

          {/* Live Casino */}
          <Link href="/casino?tab=live-casino" onClick={closeDrawer} className="flex flex-1 flex-col items-center gap-1 py-1">
            <span className={boxCls(false)}>
              <SpriteIcon id="icon-live-casino-nav" size={22} className="text-white/60" />
            </span>
            <span className={txtCls(false)}>Live</span>
          </Link>

          {/* Home — raised circle */}
          <Link href="/" onClick={closeDrawer} className="flex flex-1 flex-col items-center gap-1 -mt-4">
            <span className={cn(
              "grid size-14 place-items-center rounded-full border-4 border-[#111111] shadow-lg transition-colors",
              isHome ? "bg-gold-gradient shadow-[0_2px_16px_rgba(212,175,55,0.5)]" : "bg-[#2a2a2a]",
            )}>
              <SpriteIcon id="icon-home" size={24} className={isHome ? "text-black" : "text-gold"} />
            </span>
            <span className={txtCls(isHome)}>Home</span>
          </Link>

          {/* Casino */}
          <Link href="/casino" onClick={closeDrawer} className="flex flex-1 flex-col items-center gap-1 py-1">
            <span className={boxCls(isCasino)}>
              <SpriteIcon id="icon-casino" size={22} className={iconCls(isCasino)} />
            </span>
            <span className={txtCls(isCasino)}>Casino</span>
          </Link>

          {/* Menu */}
          <button onClick={toggleDrawer} className="flex flex-1 flex-col items-center gap-1 py-1" aria-label="Menu">
            <span className={boxCls(isMenu)}>
              <SpriteIcon id="icon-menu" size={22} className={iconCls(isMenu)} />
            </span>
            <span className={txtCls(isMenu)}>Menu</span>
          </button>

        </div>
      </nav>
    </>
  );
}
