import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheatState {
  /** Added to every campaign's final score (permanent until reset). */
  scoreBonus: number;
  /** Minimum floor for every campaign's final score (permanent). */
  minScore: number;
  /** One-time minimum floor — consumed after the next campaign is scored. */
  oneTimeMinScore: number;
  /** Replaces client feedback with vague, impossible-to-satisfy commentary. */
  nightmareMode: boolean;
  /** Makes team chat avatars enormous. */
  bigHeadMode: boolean;
  /** Shows Pat from HR following your cursor. */
  hrWatcherActive: boolean;
  /** Unlocks a special kid-themed campaign brief. */
  kidMode: boolean;
  /** Tracks which unique cheat codes have been used (for achievements). */
  usedCheats: string[];
}

interface CheatContextValue {
  cheat: CheatState;
  applyScoreBonus: (bonus: number) => void;
  applyMinScore: (min: number) => void;
  setOneTimeMinScore: (min: number) => void;
  consumeOneTimeBonus: () => void;
  toggleNightmareMode: () => void;
  toggleBigHeadMode: () => void;
  setHRWatcherActive: (active: boolean) => void;
  setKidMode: (active: boolean) => void;
  /** Records a cheat code use. Returns the NEW total count of unique cheats used. */
  recordCheatUsed: (code: string) => number;
  resetCheats: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultCheat: CheatState = {
  scoreBonus: 0,
  minScore: 0,
  oneTimeMinScore: 0,
  nightmareMode: false,
  bigHeadMode: false,
  hrWatcherActive: false,
  kidMode: false,
  usedCheats: [],
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CheatContext = createContext<CheatContextValue | null>(null);

export function CheatProvider({ children }: { children: React.ReactNode }) {
  const [cheat, setCheat] = useState<CheatState>(defaultCheat);

  // Keep body class in sync with bigHeadMode
  useEffect(() => {
    if (cheat.bigHeadMode) {
      document.body.classList.add('big-head-mode');
    } else {
      document.body.classList.remove('big-head-mode');
    }
  }, [cheat.bigHeadMode]);

  const applyScoreBonus = useCallback((bonus: number) => {
    setCheat(prev => ({ ...prev, scoreBonus: bonus }));
  }, []);

  const applyMinScore = useCallback((min: number) => {
    setCheat(prev => ({ ...prev, minScore: min }));
  }, []);

  const setOneTimeMinScore = useCallback((min: number) => {
    setCheat(prev => ({ ...prev, oneTimeMinScore: min }));
  }, []);

  const consumeOneTimeBonus = useCallback(() => {
    setCheat(prev => ({ ...prev, oneTimeMinScore: 0 }));
  }, []);

  const toggleNightmareMode = useCallback(() => {
    setCheat(prev => ({ ...prev, nightmareMode: !prev.nightmareMode }));
  }, []);

  const toggleBigHeadMode = useCallback(() => {
    setCheat(prev => ({ ...prev, bigHeadMode: !prev.bigHeadMode }));
  }, []);

  const setHRWatcherActive = useCallback((active: boolean) => {
    setCheat(prev => ({ ...prev, hrWatcherActive: active }));
  }, []);

  const setKidMode = useCallback((active: boolean) => {
    setCheat(prev => ({ ...prev, kidMode: active }));
  }, []);

  const recordCheatUsed = useCallback((code: string): number => {
    let newCount = 0;
    setCheat(prev => {
      if (prev.usedCheats.includes(code)) {
        newCount = prev.usedCheats.length;
        return prev;
      }
      const updated = [...prev.usedCheats, code];
      newCount = updated.length;
      return { ...prev, usedCheats: updated };
    });
    return newCount;
  }, []);

  const resetCheats = useCallback(() => {
    setCheat(defaultCheat);
  }, []);

  return (
    <CheatContext.Provider value={{
      cheat,
      applyScoreBonus,
      applyMinScore,
      setOneTimeMinScore,
      consumeOneTimeBonus,
      toggleNightmareMode,
      toggleBigHeadMode,
      setHRWatcherActive,
      setKidMode,
      recordCheatUsed,
      resetCheats,
    }}>
      {children}
    </CheatContext.Provider>
  );
}

export function useCheatContext() {
  const ctx = useContext(CheatContext);
  if (!ctx) throw new Error('useCheatContext must be used within CheatProvider');
  return ctx;
}
