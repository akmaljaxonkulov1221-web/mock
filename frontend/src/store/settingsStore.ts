import { create } from 'zustand';
import api from '@/lib/api';

interface SiteSettings {
  siteName: string;
  siteLogo: string;
  siteDescription: string;
  siteFavicon: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
}

interface SettingsStore {
  settings: SiteSettings;
  loaded: boolean;
  fetchSettings: () => Promise<void>;
}

const defaults: SiteSettings = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'MockCEFR',
  siteLogo: '',
  siteDescription: 'AI-powered mock exam platform',
  siteFavicon: '',
  primaryColor: '#6366f1',
  contactEmail: '',
  contactPhone: '',
  currency: 'UZS',
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaults,
  loaded: false,

  fetchSettings: async () => {
    if (get().loaded) return;
    try {
      const { data } = await api.get('/settings/public');
      set({
        settings: { ...defaults, ...data },
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));
