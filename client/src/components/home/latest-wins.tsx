import { History } from "lucide-react";
import Image from "next/image";
import { formatMoney } from "@/lib/utils";

const LATEST_WINS = [
  {
    id: 1,
    game: "Parthenon: Quest for Immortality",
    multiplier: 668.70,
    gain: 267.48,
    image: "https://www.kingsbet.cz/build/images/sport-headers/cs-live.jpg" // Placeholder for game image
  },
  {
    id: 2,
    game: "MONOPOLY Live",
    multiplier: 36.60,
    gain: 366.00,
    image: "https://www.kingsbet.cz/build/images/sport-headers/cs-live.jpg"
  },
  {
    id: 3,
    game: "MONOPOLY Live",
    multiplier: 5.50,
    gain: 220.00,
    image: "https://www.kingsbet.cz/build/images/sport-headers/cs-live.jpg"
  },
  {
    id: 4,
    game: "Lightning Storm",
    multiplier: 71.77,
    gain: 300.00,
    image: "https://www.kingsbet.cz/build/images/sport-headers/cs-live.jpg"
  },
  {
    id: 5,
    game: "Mega Ball",
    multiplier: 5.17,
    gain: 206.80,
    image: "https://www.kingsbet.cz/build/images/sport-headers/cs-live.jpg"
  }
];

export function LatestWins() {
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full border border-gold text-gold">
          <History className="size-3.5" />
        </div>
        <h2 className="text-xl font-bold">Derniers gains</h2>
      </div>

      <div className="flex flex-col gap-2">
        {LATEST_WINS.map((win) => (
          <div 
            key={win.id}
            className="flex items-center justify-between rounded-xl bg-surface-2/60 px-4 py-3 hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-lg">
                <Image
                  src={win.image}
                  alt={win.game}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted">Jeu</span>
                <span className="text-sm font-bold text-fg">{win.game}</span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center">
              <span className="text-xs text-muted">Multiplicateur</span>
              <span className="text-sm font-semibold text-fg/80">{win.multiplier.toFixed(2)}x</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted">Gains</span>
                <span className="text-sm font-bold">{win.gain.toFixed(2)}</span>
              </div>
              <div className="flex size-6 items-center justify-center rounded-md bg-[#d2b37d] text-xs font-bold text-black">
                د.ت
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
