import { create } from 'zustand';

/**
 * Minimal global app state (Zustand). Replace with your existing auth/session
 * store if you already have one — screens in this handoff read `isPro`,
 * `isAdmin`, and `reducedMotion` from here.
 */
type AppState = {
  isAuthed: boolean;
  isPro: boolean;
  isAdmin: boolean;
  reducedMotion: boolean;
  userName: string;
  userEmail: string;
  login: (email: string) => void;
  logout: () => void;
  setPro: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isAuthed: false,
  isPro: false,
  isAdmin: false,
  reducedMotion: false,
  userName: '',
  userEmail: '',
  login: (email) => set({ isAuthed: true, userEmail: email, userName: email.split('@')[0] }),
  logout: () => set({ isAuthed: false }),
  setPro: (v) => set({ isPro: v }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
}));
