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

  const active = drawerOpen
    ? "menu"
    : pathname === "/"
      ? "home"
      : pathname.startsWith("/casino/play/8a704858") || pathname.startsWith("/casino/play/swa")
        ? "sport"
        : pathname.startsWith("/casino")
          ? "casino"
          : "";

  const Tab = ({
    id, icon, label, href, center, onClick,
  }: {
    id: string; icon: string; label: string;
    href?: string; center?: boolean; onClick?: () => void;
  }) => {
    const isActive = active === id;
    const content = center ? (
      <>
        <span className={cn(
          "grid size-12 place-items-center rounded-full border-4 border-bg transition-colors",
          isActive ? "bg-gold-gradient text-brand-foreground gold-glow" : "bg-surface-2 text-gold",
        )}>
          <SpriteIcon id={icon} size={22} />
        </span>
        <span className={cn("text-[10px] font-medium", isActive ? "text-gold" : "text-muted")}>{label}</span>
      </>
    ) : (
      <>
        <SpriteIcon id={icon} size={22} className={isActive ? "text-gold" : "text-muted"} />
        <span className={cn("text-[10px] font-medium", isActive ? "text-gold" : "text-muted")}>{label}</span>
      </>
    );

    const cls = cn("flex flex-1 flex-col items-center gap-1", center ? "-mt-5" : "py-1.5");

    if (href) return <Link href={href} onClick={closeDrawer} className={cls}>{content}</Link>;
    return <button onClick={onClick} className={cls} aria-label={label}>{content}</button>;
  };

  return (
    <>
      {/* Sport picker popup */}
      {sportOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setSportOpen(false)}>
          <div
            className="absolute bottom-[72px] left-2 w-52 overflow-hidden rounded-2xl border border-gold/20 bg-[#1a1a1a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gold/60">
              Choisir le sport
            </div>
            <Link
              href={SPORT1_HREF}
              onClick={() => { setSportOpen(false); closeDrawer(); }}
              className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-gold/10">
                <SpriteIcon id="icon-sports" size={18} className="text-gold" />
              </span>
              <div>
                <div className="text-white">Sport 1</div>
                <div className="text-[10px] text-white/40">Gambly Sportsbook</div>
              </div>
            </Link>
            <div className="mx-3 h-px bg-white/5" />
            <Link
              href={SPORT2_HREF}
              onClick={() => { setSportOpen(false); closeDrawer(); }}
              className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-gold/10">
                <SpriteIcon id="icon-live-in-play" size={18} className="text-gold" />
              </span>
              <div>
                <div className="text-white">Sport 2</div>
                <div className="text-[10px] text-white/40">Altenar · Tous les matchs</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-[55] border-t border-gold/20 bg-surface shadow-[0_-6px_24px_rgba(0,0,0,0.8)] lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-[max(24px,env(safe-area-inset-bottom))] pt-2">
          {/* Sport tab — tapping opens picker */}
          <button
            onClick={() => setSportOpen((o) => !o)}
            className="flex flex-1 flex-col items-center gap-1 py-1.5"
            aria-label="Sport"
          >
            <SpriteIcon id="icon-sports" size={22} className={active === "sport" ? "text-gold" : "text-muted"} />
            <span className={cn("text-[10px] font-medium", active === "sport" ? "text-gold" : "text-muted")}>
              Sport
            </span>
          </button>

          <Tab id="live" icon="icon-live-casino-nav" label="Live" href="/casino?tab=live-casino" />
          <Tab id="home" icon="icon-home" label="Home" href="/" center />
          <Tab id="casino" icon="icon-casino" label="Casino" href="/casino" />
          <Tab id="menu" icon="icon-menu" label="Menu" onClick={toggleDrawer} />
        </div>
      </nav>
    </>
  );
}
