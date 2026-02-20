import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ─── Definitions ──────────────────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS: Achievement[] = [
  // ── Cheat achievements ────────────────────────────────────────────────────
  { id: 'cheater-admitted',     name: 'Admitted Cheater',        icon: '🙈', description: 'You asked for the cheat list. No shame.' },
  { id: 'serial-cheater',       name: 'Serial Cheater',          icon: '🎮', description: 'Used 5 different cheat codes.' },
  { id: 'cheat-encyclopedia',   name: 'Cheat Code Encyclopedia', icon: '📚', description: 'Found 10 different cheat codes.' },
  { id: 'hot-coffee',           name: 'HR Nightmare',            icon: '☕', description: 'Accessed the forbidden footage. HR has been notified.' },
  { id: 'grove-street',         name: 'Grove Street',            icon: '🏠', description: 'Home. At least it was before I messed everything up.' },
  { id: 'big-head',             name: 'DK Mode',                 icon: '🎈', description: 'Goldeneye called. They want their cheat back.' },
  { id: 'glutton',              name: 'Glutton for Punishment',  icon: '😈', description: 'You asked for a nightmare client. Why?' },
  { id: 'credits',              name: 'Credit Where Due',        icon: '✨', description: 'Found the creator.' },
  { id: 'ai-humor',             name: 'Artificial Comedy',       icon: '🤖', description: 'You made the AI tell a joke.' },
  { id: 'impulse',              name: 'Armed and Ready',         icon: '🔫', description: 'Full arsenal loaded.' },

  // ── Campaign milestones ───────────────────────────────────────────────────
  { id: 'first-campaign',       name: 'First Pitch',             icon: '🎯', description: 'Completed your first campaign.' },
  { id: 'five-campaigns',       name: 'On a Roll',               icon: '🎲', description: 'Completed 5 campaigns.' },

  // ── Score achievements ────────────────────────────────────────────────────
  { id: 'five-star',            name: 'Five Star General',       icon: '⭐', description: 'Got a 5-star rating on a campaign.' },
  { id: 'perfect-score',        name: 'Perfectionist',           icon: '💯', description: 'Scored a perfect 100 on a campaign.' },
  { id: 'barely-passed',        name: 'Squeaked By',             icon: '😅', description: 'Completed a campaign with exactly 70.' },
  { id: 'disaster',             name: 'Dumpster Fire',           icon: '🗑️', description: 'Scored below 50 on a campaign.' },

  // ── Award achievements ────────────────────────────────────────────────────
  { id: 'award-winner',         name: 'Award Winner',            icon: '🏆', description: 'Won your first industry award.' },
  { id: 'cannes-shortlist',     name: 'Golden Lion',             icon: '🦁', description: 'Got work shortlisted at Cannes Lions.' },

  // ── Team & morale ─────────────────────────────────────────────────────────
  { id: 'morale-max',           name: 'Team Player',             icon: '💪', description: 'Team morale reached HIGH.' },
  { id: 'thanked-team',         name: 'Gratitude',               icon: '🙏', description: 'Said "thank you" in chat.' },
  { id: 'apologized',           name: 'Canadian',                icon: '🍁', description: 'Said "sorry" in chat.' },
  { id: 'cursed',               name: 'Potty Mouth',             icon: '🤬', description: 'Used profanity in chat. HR is watching.' },
  { id: 'all-caps-chat',        name: 'WHY ARE YOU YELLING',     icon: '📢', description: 'Sent 3 ALL CAPS messages in a row.' },
  { id: 'supportive-boss',      name: 'Supportive Boss',         icon: '💬', description: 'Sent 10 encouraging messages in chat.' },

  // ── Terminal & tools ──────────────────────────────────────────────────────
  { id: 'built-tool',           name: 'Tool Time',               icon: '🔧', description: 'Built your first custom tool in Terminal.' },
  { id: 'five-tools',           name: 'Handy',                   icon: '🧰', description: 'Built 5 custom tools.' },
  { id: 'ten-tools',            name: 'Workshop',                icon: '🏭', description: 'Built 10 custom tools.' },
  { id: 'used-tool-on-campaign',name: 'Practical Application',   icon: '⚙️', description: 'Used a terminal tool during an active campaign.' },
  { id: 'terminal-explorer',    name: 'Command Line Warrior',    icon: '⌨️', description: 'Entered 50 commands in Terminal.' },

  // ── New Game+ ─────────────────────────────────────────────────────────────
  { id: 'new-game-plus',        name: 'Back for More',           icon: '🔄', description: 'Started a New Game+.' },
  { id: 'legacy-player',        name: 'Industry Veteran',        icon: '👴', description: 'Completed 3 full playthroughs.' },

  // ── Endings ───────────────────────────────────────────────────────────────
  { id: 'rejected-acquisition', name: 'Independent Spirit',      icon: '✊', description: 'Rejected the acquisition offer.' },
  { id: 'sold-out',             name: 'Sold Out',                icon: '💼', description: 'Accepted the acquisition offer.' },
  { id: 'hostile-takeover',     name: 'Resistance Was Futile',   icon: '🏢', description: 'Got acquired anyway after rejecting.' },
  { id: 'saw-credits',          name: 'Finished the Story',      icon: '🎬', description: 'Watched the credits.' },

  // ── Exploration ───────────────────────────────────────────────────────────
  { id: 'opened-every-app',     name: 'Explorer',                icon: '🗺️', description: 'Opened every app on the desktop.' },
  { id: 'checked-portfolio-empty', name: 'Ambitious',            icon: '👀', description: 'Checked portfolio before completing any campaigns.' },
  { id: 'settings-changed',     name: 'Customizer',              icon: '🎛️', description: 'Changed any setting.' },
  { id: 'accessibility-enabled',name: 'Inclusive Design',        icon: '♿', description: 'Enabled an accessibility feature.' },
  { id: 'founded-agency',       name: 'Open for Business',       icon: '📝', description: 'Founded your agency.' },
  { id: 'shared-campaign',      name: 'Show and Tell',           icon: '🌐', description: 'Shared a campaign to The Shortlist.' },
  { id: 'recruiter',            name: 'Recruiter Mode',          icon: '💼', description: 'Found the job posting.' },
  { id: 'found-jason',          name: 'Face Behind the Code',    icon: '🧔', description: 'Found the creator.' },

  // ── Time-based ────────────────────────────────────────────────────────────
  { id: 'night-owl',            name: 'Night Owl',               icon: '🦉', description: 'Played between midnight and 4am.' },
  { id: 'early-bird',           name: 'Early Bird',              icon: '🐦', description: 'Played between 5am and 7am.' },

  // ── Meta ──────────────────────────────────────────────────────────────────
  { id: 'achievement-hunter',   name: 'Achievement Hunter',      icon: '🔍', description: 'Checked the achievements tab 10 times.' },
  { id: 'half-achievements',    name: 'Halfway There',           icon: '📈', description: 'Unlocked half of all achievements.' },
  { id: 'all-achievements',     name: 'Completionist Supreme',   icon: '👑', description: 'Unlocked every achievement. Touch grass.' },
];

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ACHIEVEMENTS_KEY = 'agencyrpg-achievements';
const COUNTERS_KEY     = 'agencyrpg-counters';
const APPS_OPENED_KEY  = 'agencyrpg-apps-opened';

// App IDs that count toward "opened every app"
const ALL_APP_IDS = ['inbox', 'projects', 'portfolio', 'chat', 'terminal', 'notes', 'settings'];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AchievementContextValue {
  unlockedAchievements: string[];
  /** Unlock an achievement. Returns true if newly unlocked, false if already had it. */
  unlockAchievement: (id: string) => boolean;
  hasAchievement: (id: string) => boolean;
  /** Increment a named counter, persisted to localStorage. Returns the new value. */
  incrementCounter: (key: string) => number;
  /** Reset a named counter to 0. */
  resetCounter: (key: string) => void;
  /** Get the current value of a named counter (0 if never set). */
  getCounter: (key: string) => number;
  /** Record that an app was opened (for the Explorer achievement). */
  recordAppOpened: (appId: string) => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) ?? '[]'); } catch { return []; }
}

function loadCounters(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(COUNTERS_KEY) ?? '{}'); } catch { return {}; }
}

function loadAppsOpened(): string[] {
  try { return JSON.parse(localStorage.getItem(APPS_OPENED_KEY) ?? '[]'); } catch { return []; }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(loadUnlocked);
  const [counters, setCounters] = useState<Record<string, number>>(loadCounters);
  const [, setAppsOpened] = useState<string[]>(loadAppsOpened);

  const unlockAchievement = useCallback((id: string): boolean => {
    let isNew = false;
    setUnlockedAchievements(prev => {
      if (prev.includes(id)) return prev;
      isNew = true;
      const updated = [...prev, id];
      try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }
      return updated;
    });
    return isNew;
  }, []);

  const hasAchievement = useCallback((id: string) => {
    return unlockedAchievements.includes(id);
  }, [unlockedAchievements]);

  const incrementCounter = useCallback((key: string): number => {
    let newVal = 0;
    setCounters(prev => {
      newVal = (prev[key] ?? 0) + 1;
      const updated = { ...prev, [key]: newVal };
      try { localStorage.setItem(COUNTERS_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }
      return updated;
    });
    return newVal;
  }, []);

  const resetCounter = useCallback((key: string): void => {
    setCounters(prev => {
      const updated = { ...prev, [key]: 0 };
      try { localStorage.setItem(COUNTERS_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }
      return updated;
    });
  }, []);

  const getCounter = useCallback((key: string): number => {
    return counters[key] ?? 0;
  }, [counters]);

  const value: AchievementContextValue = {
    unlockedAchievements,
    unlockAchievement,
    hasAchievement,
    incrementCounter,
    resetCounter,
    getCounter,
    recordAppOpened: useCallback((appId: string) => {
      setAppsOpened(prev => {
        if (prev.includes(appId)) return prev;
        const updated = [...prev, appId];
        try { localStorage.setItem(APPS_OPENED_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }

        // Check if all core apps have been opened now
        const allOpened = ALL_APP_IDS.every(id => updated.includes(id));
        if (allOpened) {
          // Unlock inline — can't call unlockAchievement here (stale closure), so write directly
          setUnlockedAchievements(ua => {
            if (ua.includes('opened-every-app')) return ua;
            const newUa = [...ua, 'opened-every-app'];
            try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newUa)); } catch { /* non-fatal */ }
            return newUa;
          });
        }
        return updated;
      });
    }, []),  // eslint-disable-line react-hooks/exhaustive-deps
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAchievementContext(): AchievementContextValue {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievementContext must be used within AchievementProvider');
  return ctx;
}
