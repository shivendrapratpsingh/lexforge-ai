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
      s