import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CasinoHero } from "@/components/casino/casino-hero";
import { CasinoBrowser } from "@/components/casino/casino-browser";
import { GameGridSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Casino — Machines à Sous, Casino Live & Jeux Instantanés",
  description:
    "Jouez à des milliers de jeux de casino sur AfroBet216 — machines à sous, tables de casino live (Evolution), Megaways, bonus-buy et jeux crash des meilleurs fournisseurs.",
  alternates: { canonical: "/casino" },
  openGraph: {
    title: "Casino — Machines à Sous, Casino Live & Jeux Instantanés · AfroBet216",
    description:
      "Des milliers de jeux de casino : machines à sous, casino live, Megaways, bonus-buy et crash.",
    url: "/casino",
  },
};

export default function CasinoPage() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-4 sm:px-6">
        <CasinoHero />
        <Suspense fallback={<GameGridSkeleton count={10} />}>
          <CasinoBrowser />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
