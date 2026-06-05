import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

// Two promo cards (local art). Square-ish source images shown side by side.
const PROMOS = [
  { src: "/images/image_1.jpeg", alt: "Promotion", href: "/promotions", w: 1310, h: 1201 },
  { src: "/images/image_2.jpeg", alt: "Promotion", href: "/promotions", w: 1277, h: 1232 },
];

export function Promotions() {
  return (
    <Section>
      <SectionHeader
        icon={<Crown className="size-5 text-gold" />}
        title="Promotions"
        actionLabel="View all"
        actionHref="/promotions"
      />
      {/* Two equal cards, side by side on every viewport. */}
      <div className="grid grid-cols-2 gap-3">
        {PROMOS.map((p) => (
          <Link
            key={p.src}
            href={p.href}
            className="group relative block overflow-hidden rounded-2xl border border-line"
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={p.w}
              height={p.h}
              sizes="(max-width: 768px) 50vw, 40vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}
