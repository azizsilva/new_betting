import { create } from "zustand";

export interface BetSelection {
  id: string; // selectionId
  matchId: string;
  matchName: string;
  marketName: string;
  selectionName: string;
  odds: number;
}

interface BetSlipState {
  selections: BetSelection[];
  stake: number;
  add: (s: BetSelection) => void;
  remove: (id: string) => void;
  clear: () => void;
  setStake: (n: number) => void;
  totalOdds: () => number;
  potentialWin: () => number;
}

export const useBetSlip = create<BetSlipState>((set, get) => ({
  selections: [],
  stake: 100,
  add: (s) =>
    set((state) =>
      state.selections.some((x) => x.id === s.id)
        ? state
        : { selections: [...state.selections, s] },
    ),
  remove: (id) =>
    set((state) => ({ selections: state.selections.filter((s) => s.id !== id) })),
  clear: () => set({ selections: [] }),
  setStake: (n) => set({ stake: Math.max(0, n) }),
  totalOdds: () => get().selections.reduce((acc, s) => acc * s.odds, 1),
  potentialWin: () => get().stake * get().selections.reduce((acc, s) => acc * s.odds, 1),
}));
