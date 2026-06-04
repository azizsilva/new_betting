import Link from "next/link";
import { SpriteIcon } from "@/components/icon-sprite";

const CATS = [
  { label: "Sport", href: "/sports", icon: "icon-sports" },
  { label: "Live Sports", href: "/sports?live=1", icon: "icon-live-sport" },
  { label: "Casino", href: "/casino", icon: "icon-casino" },
  { label: "Live Casino", href: "/live-casino", icon: "icon-live-casino-nav" },
  { label: "Instant", href: "/instant", icon: "icon-instant" },
  { label: "Promotions", href: "/promotions", icon: "icon-promotions" },
];

export function CategoryTiles() {
  return (
    <section className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {CATS.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="group relative flex aspect-square flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-gold/40"
        >
          {/* gold glow rising from the bottom on hover */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 translate-y-full bg-gradient-to-t from-gold/25 to-transparent transition-transform duration-300 group-hover:translate-y-0" />
          {/* diamond marker at the bottom edge */}
          <span className="pointer-events-none absolute bottom-1.5 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <SpriteIcon
            id={c.icon}
            size={40}
            className="relative z-10 text-gold transition-transform duration-300 group-hover:-translate-y-0.5"
          />
          <span className="relative z-10 px-1 text-center text-xs font-semibold sm:text-sm">
            {c.label}
          </span>
        </Link>
      ))}
    </section>
  );
}
