"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SpriteIcon } from "@/components/icon-sprite";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { drawerOpen, toggleDrawer, closeDrawer } = useUiStore();

  // Which tab is active (Menu wins while the drawer is open).
  const active = drawerOpen
    ? "menu"
    : pathname === "/"
      ? "home"
      : pathname.startsWith("/sports")
        ? "sport"
        : pathname.startsWith("/live-casino") || pathname.startsWith("/live-sports")
          ? "live"
          : pathname.startsWith("/casino")
            ? "casino"
            : "";

  const Tab = ({
    id,
    icon,
    label,
    href,
    center,
    onClick,
  }: {
    id: string;
    icon: string;
    label: string;
    href?: string;
    center?: boolean;
    onClick?: () => void;
  }) => {
    const isActive = active === id;
    const content = center ? (
      <>
        <span
          className={cn(
            "grid size-12 place-items-center rounded-full border-4 border-bg transition-colors",
            isActive ? "bg-gold-gradient text-brand-foreground gold-glow" : "bg-surface-2 text-gold",
          )}
        >
          <SpriteIcon id={icon} size={22} />
        </span>
        <span className={cn("text-[10px] font-medium", isActive ? "text-gold" : "text-muted")}>
          {label}
        </span>
      </>
    ) : (
      <>
        <SpriteIcon id={icon} size={22} className={isActive ? "text-gold" : "text-muted"} />
        <span className={cn("text-[10px] font-medium", isActive ? "text-gold" : "text-muted")}>
          {label}
        </span>
      </>
    );

    const cls = cn(
      "flex flex-1 flex-col items-center gap-1",
      center ? "-mt-5" : "py-1.5",
    );

    if (href) {
      return (
        <Link href={href} onClick={closeDrawer} className={cls}>
          {content}
        </Link>
      );
    }
    return (
      <button onClick={onClick} className={cls} aria-label={label}>
        {content}
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[55] border-t border-gold/20 bg-surface shadow-[0_-6px_24px_rgba(0,0,0,0.8)] lg:hidden">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-[max(24px,env(safe-area-inset-bottom))] pt-2">
        <Tab id="sport" icon="icon-sports" label="Sport" href="/casino/play/8a704858d5deb4af1ddc722092ac7614?account=gambly" />
        <Tab id="live" icon="icon-live-sport" label="Live Casino" href="/casino?tab=live-casino" />
        <Tab id="home" icon="icon-home" label="Home" href="/" center />
        <Tab id="casino" icon="icon-casino" label="Casino" href="/casino" />
        <Tab id="menu" icon="icon-menu" label="Menu" onClick={toggleDrawer} />
      </div>
    </nav>
  );
}
