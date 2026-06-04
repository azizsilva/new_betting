import { create } from "zustand";

interface UiState {
  drawerOpen: boolean;
  loginModalOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  drawerOpen: false,
  loginModalOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),
}));
  