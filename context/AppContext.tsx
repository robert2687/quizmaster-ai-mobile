import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { Profile, AppView } from '../types';
import { api } from '../services/api';
import { safeStorage } from '../services/storage';

const ACTIVE_PROFILE_KEY = 'qm_active_profile_id';

interface AppContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (p: Profile | null) => void;
  refreshProfiles: () => Promise<void>;
  view: AppView;
  setView: (v: AppView) => void;
  viewParam: string | null;
  setViewParam: (p: string | null) => void;
  navigate: (v: AppView, param?: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [view, setView] = useState<AppView>('home');
  const [viewParam, setViewParam] = useState<string | null>(null);

  const refreshProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
      const savedId = await safeStorage.getItem(ACTIVE_PROFILE_KEY);
      if (savedId && !activeProfile) {
        const found = data.find((p: Profile) => p.id === savedId);
        if (found) setActiveProfileState(found);
      }
    } catch { /* DB not ready yet */ }
  };

  useEffect(() => { refreshProfiles(); }, []);

  const setActiveProfile = async (p: Profile | null) => {
    setActiveProfileState(p);
    if (p) await safeStorage.setItem(ACTIVE_PROFILE_KEY, p.id);
    else await safeStorage.removeItem(ACTIVE_PROFILE_KEY);
  };

  const navigate = (v: AppView, param?: string) => {
    setView(v);
    setViewParam(param ?? null);

    // Map AppView to expo-router routes
    switch (v) {
      case 'home':
        router.push('/(tabs)' as any);
        break;
      case 'profiles':
        router.push('/(tabs)/profile' as any);
        break;
      case 'tournaments':
        router.push('/(tabs)/tournaments' as any);
        break;
      case 'tournament-detail':
        if (param) router.push(`/tournament/${param}` as any);
        break;
      case 'teams':
        router.push('/(tabs)/teams' as any);
        break;
      case 'multiplayer':
      case 'session-lobby':
      case 'session-game':
        router.push('/(tabs)/multiplayer' as any);
        break;
      case 'daily':
        router.push('/(tabs)/daily' as any);
        break;
      case 'achievements':
        router.push('/(tabs)/achievements' as any);
        break;
    }
  };

  return (
    <AppContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        refreshProfiles,
        view,
        setView,
        viewParam,
        setViewParam,
        navigate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
