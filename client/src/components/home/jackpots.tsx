const JACKPOTS = [
  {
    tier: "Gold Jackpot",
    amount: "150",
    cents: "00",
    bg: "linear-gradient(135deg,#f6dd86,#d9af49 55%,#a9802f)",
    text: "#3a2a06",
  },
  {
    tier: "Silver Jackpot",
    amount: "100",
    cents: "00",
    bg: "linear-gradient(135deg,#e6e8ec,#c2c5cc 55%,#9a9da6)",
    text: "#2c2e33",
  },
  {
    tier: "Bronze Jackpot",
    amount: "50",
    cents: "00",
    bg: "linear-gradient(135deg,#e7b591,#c9885a 55%,#9c6238)",
    text: "#3a1f0c",
  },
];

export function Jackpots() {
  return (
    <section className="grid grid-cols-3 gap-2 sm:gap-3">
      {JACKPOTS.map((j) => (
        <div
          key={j.tier}
          className="relative overflow-hidden rounded-2xl p-3 sm:p-4"
          style={{ background: j.bg, color: j.text }}
        >
          {/* dotted inner border like the reference */}
          <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-black/25" />
          <div className="relative">
            <div className="text-lg font-black leading-none sm:text-2xl">
              {j.amount}
              <span className="align-top text-xs font-bold sm:text-sm">.{j.cents}</span>
            </div>
            <div className="mt-1 text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-sm">
              {j.tier}
            </div>
            <div className="mt-0.5 text-[9px] font-medium opacity-70 sm:text-[11px]">
              Last winner: ••••••••
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
