import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg-player-name';
const AGENCY_NAME_KEY = 'agencyrpg-agency-name';

export interface PlayerContextValue {
  playerName: string | null;
  setPlayerName: (name: string) => void;
  clearPlayerName: () => void;
  /** The agency name — custom or derived from playerName. */
  agencyName: string;
  /** Set a custom agency name (persists to localStorage). */
  setAgencyName: (name: string) => void;
  /** True if the player hasn't chosen a custom name yet. */
  isAgencyNameDefault: boolean;
  /** True while the screensaver overlay should be shown (between log-off and sign-in). */
  showScreensaver: boolean;
  /** Log off: save → clear name → show screensaver. */
  logOff: () => void;
  /** Dismiss screensaver → reveal onboarding. */
  dismissScreensaver: () => void;
  /** The player name at the time of log-off (for screensaver display). */
  screensaverName: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerNameState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );
  const [customAgencyName, setCustomAgencyName] = useState<string | null>(
    () => localStorage.getItem(AGENCY_NAME_KEY),
  );
  const [showScreensaver, setShowScreensaver] = useState(false);
  const screensaverNameRef = useRef('Agency');

  const agencyName = customAgencyName || (playerName ? `${playerName}'s Agency` : 'Agency');
  const isAgencyNameDefault = !customAgencyName;

  const setPlayerName = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setPlayerNameState(name);
  }, []);

  const setAgencyName = useCallback((name: string) => {
    try { localStorage.setItem(AGENCY_NAME_KEY, name); } catch { /* non-fatal */ }
    setCustomAgencyName(name);
  }, []);

  const clearPlayerName = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AGENCY_NAME_KEY);
    setPlayerNameState(null);
    setCustomAgencyName(null);
  }, []);

  const logOff = useCallback(() => {
    if (playerName) screensaverNameRef.current = playerName;
    // Don't remove from localStorage — just hide the UI behind the screensaver
    setPlayerNameState(null);
    setShowScreensaver(true);
  }, [playerName]);

  const dismissScreensaver = useCallback(() => {
    // Restore the player name so the desktop reappears (not onboarding)
    const savedName = localStorage.getItem(STORAGE_KEY) || screensaverNameRef.current;
    if (savedName) {
      localStorage.setItem(STORAGE_KEY, savedName);
      setPlayerNameState(savedName);
    }
    setShowScreensaver(false);
  }, []);

  return (
    <PlayerContext.Provider value={{
      playerName,
      setPlayerName,
      clearPlayerName,
      agencyName,
      setAgencyName,
      isAgencyNameDefault,
      showScreensaver,
      logOff,
      dismissScreensaver,
      screensaverName: screensaverNameRef.current,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerProvider');
  return ctx;
}
