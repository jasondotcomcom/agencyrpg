import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg-player-name';

export interface PlayerContextValue {
  playerName: string | null;
  setPlayerName: (name: string) => void;
  clearPlayerName: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerNameState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const setPlayerName = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setPlayerNameState(name);
  }, []);

  const clearPlayerName = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPlayerNameState(null);
  }, []);

  return (
    <PlayerContext.Provider value={{ playerName, setPlayerName, clearPlayerName }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerProvider');
  return ctx;
}
