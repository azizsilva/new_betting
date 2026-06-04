import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CasinoHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line">
      <div className="relative aspect-[1920/448] min-h-[150px] w-full">
        <Image
          src="/images/banner_casino.png"
          alt="Live games"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center px-5 sm:px-12">
          <Link
            href="/live-casino"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-gold transition-colors hover:bg-gold/10 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Play Live Games <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
