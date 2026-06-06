"use client";

import { useEffect, useState } from "react";

const INITIAL_JACKPOTS = [
  {
    tier: "Gold Jackpot",
    bg: "linear-gradient(135deg,#f6dd86,#d9af49 55%,#a9802f)",
    text: "#3a2a06",
    winner: "Mahden28",
    speed: 0.15, // increments per second (very slow)
  },
  {
    tier: "Silver Jackpot",
    bg: "linear-gradient(135deg,#e6e8ec,#c2c5cc 55%,#9a9da6)",
    text: "#2c2e33",
    winner: "zooba55",
    speed: 0.08,
  },
  {
    tier: "Bronze Jackpot",
    bg: "linear-gradient(135deg,#e7b591,#c9885a 55%,#9c6238)",
    text: "#3a1f0c",
    winner: "2955xx",
    speed: 0.04,
  },
];

export function Jackpots() {
  const [amounts, setAmounts] = useState([0, 0, 0]);

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    // Read saved values or start from zero
    const savedStr = localStorage.getItem("afrobet_jackpot_values");
    let currentValues = savedStr ? JSON.parse(savedStr) : [0, 0, 0];

    const tick = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Pure incremental counter, not a clock
      currentValues = currentValues.map((val: number, i: number) => {
        let next = val + INITIAL_JACKPOTS[i].speed * delta;
        if (next >= 1000000) {
          next = 0; // reset to 000000.00 when reaching 1,000,000
        }
        return next;
      });

      setAmounts([...currentValues]);
      
      // Save state so it continues exactly where it left off on refresh
      localStorage.setItem("afrobet_jackpot_values", JSON.stringify(currentValues));

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const formatAmount = (val: number) => {
    // Format without leading zeros so it doesn't look like a time
    const s = val.toFixed(2);
    const parts = s.split(".");
    return {
      amount: parts[0],
      cents: parts[1],
    };
  };

  return (
    <section className="grid grid-cols-3 gap-2 sm:gap-3">
      {INITIAL_JACKPOTS.map((j, i) => {
        const { amount, cents } = formatAmount(amounts[i] ?? 0);
        return (
          <div
            key={j.tier}
            className="relative overflow-hidden rounded-2xl p-3 sm:p-4"
            style={{ background: j.bg, color: j.text }}
          >
            {/* dotted inner border like the reference */}
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-black/25" />
            <div className="relative">
              <div className="text-lg font-black leading-none sm:text-2xl tabular-nums">
                {amount}
                <span className="align-top text-xs font-bold sm:text-sm">.{cents}</span>
              </div>
              <div className="mt-1 text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-sm">
                {j.tier}
              </div>
              <div className="mt-0.5 text-[9px] font-medium opacity-70 sm:text-[11px]">
                Last winner: {j.winner}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
