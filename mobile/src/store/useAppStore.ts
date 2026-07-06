import { create } from 'zustand';
import { apiGetMe, apiLogin, getToken, setToken, MobileUser } from '../lib/api';
import { logger } from '../lib/logger';

type AppState = {
  hydrated: boolean;
  isAuthed: boolean;
  isPro: boolean;
  isAdmin: boolean;
  reducedMotion: boolean;
  userName: string;
  userEmail: string;
  freeDocsLimit: number;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerLogin: (user: MobileUser, token: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  setReducedMotion: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  isAuthed: false,
  isPro: false,
  isAdmin: false,
  reducedMotion: false,
  userName: '',
  userEmail: '',
  freeDocsLimit: 10,

  hydrate: async () => {
    const token = await getToken();
    if (!token) {
      set({ hydrated: true });
      return;
    }
    try {
      const me = await apiGetMe();
      set({
        hydrated: true,
        isAuthed: true,
        isPro: me.isPro,
        isAdmin: me.isAdmin,
        userName: me.name || '',
        userEmail: me.email,
        freeDocsLimit: me.freeDocsLimit,
      });
    } catch (e) {
      // Stored token is invalid/expired — drop it and fall back to the login screen.
      logger.warn('[store] session restore failed, clearing token', e);
      await setToken(null);
      set({ hydrated: true, isAuthed: false });
    }
  },

  login: async (email, password) => {
    const { token, user } = await apiLogin(email, password);
    await setToken(token);
    await get().refreshMe();
    set({ isAuthed: true, userEmail: user.email, userName: user.name || '' });
  },

  registerLogin: async (user, token) => {
    await setToken(token);
    await get().refreshMe();
    set({ isAuthed: true, userEmail: user.email, userName: user.name || '' });
  },

  refreshMe: async () => {
    const me = await apiGetMe();
    set({
      isPro: me.isPro,
      isAdmin: me.isAdmin,
      userName: me.name || '',
      userEmail: me.email,
      freeDocsLimit: me.freeDocsLimit,
    });
  },

  logout: async () => {
    await setToken(null);
    set({ isAuthed: false, isPro: false, isAdmin: false, userName: '', userEmail: '' });
  },

  setReducedMotion: (v) => set({ reducedMotion: v }),
}));
