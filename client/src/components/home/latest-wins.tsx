"use client";

import { History } from "lucide-react";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface WinRecord {
  id: number;
  game: string;
  multiplier: number;
  gain: number;
  image: string;
}

const FALLBACK_WINS: WinRecord[] = [
  { id: -1, game: "Parthenon: Quest for Immortality", multiplier: 668.7, gain: 267.48, image: "/images/NE-parthenonquestforimmortality.png" },
  { id: -2, game: "MONOPOLY Live", multiplier: 36.6, gain: 366.0, image: "/images/EVO-monopoly.png" },
  { id: -3, game: "Lightning Storm", multiplier: 71.77, gain: 300.0, image: "/images/EVO-lightningstorm.png" },
  { id: -4, game: "Mega Ball", multiplier: 5.17, gain: 206.8, image: "/images/EVO-crazytime.png" },
];

export function LatestWins() {
  const [wins, setWins] = useState<WinRecord[]>(FALLBACK_WINS);

  useEffect(() => {
    const fetchWins = async () => {
      try {
        const { data } = await api.get<WinRecord[]>("/casino/latest-wins");
        if (data && data.length > 0) {
          setWins(data);
        }
      } catch (err) {
        // ignore and keep fallbacks
      }
    };

    fetchWins();
    const interval = setInterval(fetchWins, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full border border-gold text-gold">
          <History className="size-3.5" />
        </div>
        <h2 className="text-xl font-bold">Derniers gains</h2>
      </div>

      <div className="flex flex-col gap-2">
        {wins.map((win) => (
          <div 
            key={win.id}
            className="flex items-center justify-between rounded-xl bg-surface-2/60 px-4 py-3 hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={win.image}
                  alt={win.game}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
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
