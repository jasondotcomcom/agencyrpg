import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useEmailContext } from './EmailContext';
import { useChatContext } from './ChatContext';
import { useWindowContext } from './WindowContext';
import { useAchievementContext } from './AchievementContext';
import { useAgencyFunds } from './AgencyFundsContext';
import { useEndingContext } from './EndingContext';
import { usePlayerContext } from './PlayerContext';
import type { ConductFlag } from '../data/conductEvents';
import {
  HR_WARNING_MESSAGES,
  TEAM_COMPLAINT_MESSAGES,
  getNewsArticleEmail,
  getClientPullEmail,
  getMomsEmail,
  getLegalNoticeEmail,
  POSITIVE_CHAT_MESSAGES,
} from '../data/conductEvents';
import { emitSave } from '../utils/saveSignal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConductIncident {
  type: ConductFlag;
  severity: number;
  timestamp: number;
  description: string;
}

interface ConductState {
  conductScore: number;           // -100 to 100
  incidentLog: ConductIncident[];
  warningLevel: number;           // 0-7
  positiveStreak: number;
  lastIncidentTime: number;
  teamUnavailable: string[];
  lawsuitPlayed: number;
  lawsuitResult: 'won' | 'lost' | 'settled' | null;
  trainingCompleted: boolean;
  forcedResignation: boolean;
  hadTeamDeparture: boolean;
  positiveThresholdsHit: number[];  // track which thresholds already fired
}

type ConductAction =
  | { type: 'RECORD_INCIDENT'; payload: ConductIncident }
  | { type: 'ADJUST_SCORE'; payload: number }
  | { type: 'SET_WARNING_LEVEL'; payload: number }
  | { type: 'INCREMENT_POSITIVE_STREAK' }
  | { type: 'RESET_POSITIVE_STREAK' }
  | { type: 'SET_TEAM_UNAVAILABLE'; payload: string[] }
  | { type: 'CLEAR_TEAM_UNAVAILABLE' }
  | { type: 'SET_LAWSUIT_RESULT'; payload: 'won' | 'lost' | 'settled' }
  | { type: 'INCREMENT_LAWSUIT_PLAYED' }
  | { type: 'SET_TRAINING_COMPLETED' }
  | { type: 'SET_FORCED_RESIGNATION' }
  | { type: 'SET_HAD_DEPARTURE' }
  | { type: 'MARK_POSITIVE_THRESHOLD'; payload: number }
  | { type: 'LOAD_STATE'; payload: Partial<ConductState> };

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg_conduct';

function loadState(): Partial<ConductState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch { return null; }
}

const saved = loadState();
const initialState: ConductState = {
  conductScore: saved?.conductScore ?? 0,
  incidentLog: saved?.incidentLog ?? [],
  warningLevel: saved?.warningLevel ?? 0,
  positiveStreak: saved?.positiveStreak ?? 0,
  lastIncidentTime: saved?.lastIncidentTime ?? 0,
  teamUnavailable: saved?.teamUnavailable ?? [],
  lawsuitPlayed: saved?.lawsuitPlayed ?? 0,
  lawsuitResult: saved?.lawsuitResult ?? null,
  trainingCompleted: saved?.trainingCompleted ?? false,
  forcedResignation: saved?.forcedResignation ?? false,
  hadTeamDeparture: saved?.hadTeamDeparture ?? false,
  positiveThresholdsHit: saved?.positiveThresholdsHit ?? [],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function conductReducer(state: ConductState, action: ConductAction): ConductState {
  switch (action.type) {
    case 'RECORD_INCIDENT':
      return {
        ...state,
        incidentLog: [...state.incidentLog, action.payload],
        lastIncidentTime: action.payload.timestamp,
      };
    case 'ADJUST_SCORE':
      return {
        ...state,
        conductScore: Math.max(-100, Math.min(100, state.conductScore + action.payload)),
      };
    case 'SET_WARNING_LEVEL':
      return { ...state, warningLevel: action.payload };
    case 'INCREMENT_POSITIVE_STREAK':
      return { ...state, positiveStreak: state.positiveStreak + 1 };
    case 'RESET_POSITIVE_STREAK':
      return { ...state, positiveStreak: 0 };
    case 'SET_TEAM_UNAVAILABLE':
      return { ...state, teamUnavailable: action.payload };
    case 'CLEAR_TEAM_UNAVAILABLE':
      return { ...state, teamUnavailable: [] };
    case 'SET_LAWSUIT_RESULT':
      return { ...state, lawsuitResult: action.payload };
    case 'INCREMENT_LAWSUIT_PLAYED':
      return { ...state, lawsuitPlayed: state.lawsuitPlayed + 1 };
    case 'SET_TRAINING_COMPLETED':
      return { ...state, trainingCompleted: true };
    case 'SET_FORCED_RESIGNATION':
      return { ...state, forcedResignation: true };
    case 'SET_HAD_DEPARTURE':
      return { ...state, hadTeamDeparture: true };
    case 'MARK_POSITIVE_THRESHOLD':
      if (state.positiveThresholdsHit.includes(action.payload)) return state;
      return { ...state, positiveThresholdsHit: [...state.positiveThresholdsHit, action.payload] };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context Interface ────────────────────────────────────────────────────────

interface ConductContextValue {
  conductScore: number;
  warningLevel: number;
  incidentLog: ConductIncident[];
  teamUnavailable: string[];
  positiveStreak: number;
  lawsuitResult: 'won' | 'lost' | 'settled' | null;
  forcedResignation: boolean;
  hadTeamDeparture: boolean;
  reportIncident: (flag: ConductFlag, description: string) => void;
  reportPositive: () => void;
  completeLawsuit: (result: 'won' | 'lost' | 'settled') => void;
  completeTraining: () => void;
  isTeamMemberAvailable: (id: string) => boolean;
  setTeamUnavailable: (ids: string[]) => void;
  clearTeamUnavailable: () => void;
}

const ConductContext = createContext<ConductContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConductProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conductReducer, initialState);
  const { addEmail } = useEmailContext();
  const { addMessage, setMorale } = useChatContext();
  const { addNotification, focusOrOpenWindow } = useWindowContext();
  const { unlockAchievement, incrementCounter } = useAchievementContext();
  const { deductFunds } = useAgencyFunds();
  const { triggerEndingSequence } = useEndingContext();
  const { playerName } = usePlayerContext();
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        conductScore: state.conductScore,
        incidentLog: state.incidentLog,
        warningLevel: state.warningLevel,
        positiveStreak: state.positiveStreak,
        lastIncidentTime: state.lastIncidentTime,
        teamUnavailable: state.teamUnavailable,
        lawsuitPlayed: state.lawsuitPlayed,
        lawsuitResult: state.lawsuitResult,
        trainingCompleted: state.trainingCompleted,
        forcedResignation: state.forcedResignation,
        hadTeamDeparture: state.hadTeamDeparture,
        positiveThresholdsHit: state.positiveThresholdsHit,
      }));
      emitSave();
    } catch { /* non-fatal */ }
  }, [state]);

  // Cleanup timers
  useEffect(() => {
    const timers = timersRef.current;
    return () => { timers.forEach(t => clearTimeout(t)); timers.clear(); };
  }, []);

  const addChatMsg = useCallback((authorId: string, text: string, delay = 0) => {
    if (delay === 0) {
      addMessage({
        id: `conduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        channel: 'general',
        authorId,
        text,
        timestamp: Date.now(),
        reactions: [],
        isRead: false,
      });
    } else {
      const timer = setTimeout(() => {
        addMessage({
          id: `conduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          channel: 'general',
          authorId,
          text,
          timestamp: Date.now(),
          reactions: [],
          isRead: false,
        });
        timersRef.current.delete(timer);
      }, delay);
      timersRef.current.add(timer);
    }
  }, [addMessage]);

  // ── Escalation Handler ─────────────────────────────────────────────────────

  const triggerEscalation = useCallback((level: number, flag: ConductFlag) => {
    const warningSet = HR_WARNING_MESSAGES.find(w => w.level === level);

    switch (level) {
      case 1: {
        // HR Warning
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        setMorale('low');
        addNotification('⚠️ HR Warning', 'Pat from HR has issued a formal warning. Check #general.');
        break;
      }

      case 2: {
        // Mandatory Training
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        const timer = setTimeout(() => {
          focusOrOpenWindow('hrtraining', 'Workplace Conduct Training');
          timersRef.current.delete(timer);
        }, 8000);
        timersRef.current.add(timer);
        addNotification('📋 Mandatory Training', 'HR has scheduled mandatory Workplace Conduct Training.');
        break;
      }

      case 3: {
        // Team Complaints
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        // Pick 2-3 random team members to go unavailable
        const allTeam = ['copywriter', 'art-director', 'strategist', 'technologist', 'suit', 'media', 'pm'];
        const shuffled = allTeam.sort(() => Math.random() - 0.5);
        const unavailable = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
        dispatch({ type: 'SET_TEAM_UNAVAILABLE', payload: unavailable });
        dispatch({ type: 'SET_HAD_DEPARTURE' });
        // Team members post leaving messages
        unavailable.forEach((id, i) => {
          const complaint = TEAM_COMPLAINT_MESSAGES.find(m => m.authorId === id);
          if (complaint) addChatMsg(complaint.authorId, complaint.text, 9000 + i * 2000);
        });
        // Clear after 60 seconds
        const clearTimer = setTimeout(() => {
          dispatch({ type: 'CLEAR_TEAM_UNAVAILABLE' });
          addChatMsg('hr', 'The meeting has concluded. Team members may return to their duties.', 0);
          timersRef.current.delete(clearTimer);
        }, 60000);
        timersRef.current.add(clearTimer);
        addNotification('👥 Team Complaints Filed', 'Multiple team members are meeting with HR.');
        break;
      }

      case 4: {
        // Media Exposure
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        const agencyName = playerName ? `${playerName}'s Agency` : 'The Agency';
        const newsTimer = setTimeout(() => {
          addEmail(getNewsArticleEmail(flag, agencyName));
          addNotification('📰 Breaking News', 'An article about your agency has been published. Check inbox.');
          timersRef.current.delete(newsTimer);
        }, 6000);
        timersRef.current.add(newsTimer);
        // Client pulls brief
        const pullTimer = setTimeout(() => {
          addEmail(getClientPullEmail('Major Client'));
          addNotification('🏢 Client Pausing', 'A client has paused their engagement.');
          timersRef.current.delete(pullTimer);
        }, 12000);
        timersRef.current.add(pullTimer);
        break;
      }

      case 5: {
        // Mom's Email
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        const momTimer = setTimeout(() => {
          addEmail(getMomsEmail());
          addNotification('👩 Mom', 'You have a new email from Mom.');
          timersRef.current.delete(momTimer);
        }, 8000);
        timersRef.current.add(momTimer);
        break;
      }

      case 6: {
        // Lawsuit — consequences hit fast
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 500 + i * 1200));
        const legalTimer = setTimeout(() => {
          addEmail(getLegalNoticeEmail());
          deductFunds(50000, 'Legal retainer fees');
          addNotification('⚖️ Legal Notice', 'A lawsuit has been filed. Check inbox immediately.');
          timersRef.current.delete(legalTimer);
        }, 3000);
        timersRef.current.add(legalTimer);
        // Open lawsuit mini-game shortly after
        const gameTimer = setTimeout(() => {
          dispatch({ type: 'INCREMENT_LAWSUIT_PLAYED' });
          focusOrOpenWindow('lawsuit', 'Lawsuit Defense');
          timersRef.current.delete(gameTimer);
        }, 5000);
        timersRef.current.add(gameTimer);
        break;
      }

      case 7: {
        // Forced Resignation
        addChatMsg('hr', 'I\'ve spoken with the board. They\'ve made their decision.', 1000);
        addChatMsg('hr', 'You are being asked to resign, effective immediately.', 4000);
        addChatMsg('hr', 'Please gather your things. I\'ll walk you out.', 7000);
        dispatch({ type: 'SET_FORCED_RESIGNATION' });
        unlockAchievement('cancelled');
        const endTimer = setTimeout(() => {
          triggerEndingSequence('forced_resignation');
          timersRef.current.delete(endTimer);
        }, 10000);
        timersRef.current.add(endTimer);
        addNotification('🚫 Forced Resignation', 'The board has asked you to resign.');
        break;
      }
    }
  }, [addChatMsg, setMorale, addNotification, focusOrOpenWindow,
      addEmail, deductFunds, unlockAchievement, triggerEndingSequence, playerName]);

  // ── Report Incident ────────────────────────────────────────────────────────

  const reportIncident = useCallback((flag: ConductFlag, description: string) => {
    const incident: ConductIncident = {
      type: flag,
      severity: flag === 'sexual' || flag === 'discriminatory' ? 4 : 3,
      timestamp: Date.now(),
      description,
    };
    dispatch({ type: 'RECORD_INCIDENT', payload: incident });
    dispatch({ type: 'ADJUST_SCORE', payload: -20 });
    dispatch({ type: 'RESET_POSITIVE_STREAK' });

    const newLevel = Math.min(7, state.warningLevel + 1);
    dispatch({ type: 'SET_WARNING_LEVEL', payload: newLevel });
    triggerEscalation(newLevel, flag);
  }, [state.warningLevel, triggerEscalation]);

  // ── Report Positive ────────────────────────────────────────────────────────

  const reportPositive = useCallback(() => {
    dispatch({ type: 'ADJUST_SCORE', payload: 5 });
    dispatch({ type: 'INCREMENT_POSITIVE_STREAK' });

    const newScore = Math.min(100, state.conductScore + 5);

    // Check thresholds
    const thresholds = [20, 40, 60, 80];
    for (const threshold of thresholds) {
      if (newScore >= threshold && !state.positiveThresholdsHit.includes(threshold)) {
        dispatch({ type: 'MARK_POSITIVE_THRESHOLD', payload: threshold });

        const messages = POSITIVE_CHAT_MESSAGES[threshold];
        if (messages) {
          messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 3000 + i * 3000));
        }

        if (threshold === 40) {
          addNotification('🏆 Manager of the Quarter', 'Your leadership has been recognized! +$5,000 bonus.');
          // Use addProfit-style boost — we add as profit since it's a bonus
          deductFunds(-5000, 'Manager of the Quarter bonus');
        }
        if (threshold === 60) {
          unlockAchievement('culture-creator');
          addNotification('🌱 Culture Creator', 'Your agency is featured in "Best Places to Work"!');
        }
      }
    }

    // Positive streak loyalty bonus
    if (state.positiveStreak + 1 >= 5 && (state.positiveStreak + 1) % 5 === 0) {
      addNotification('💪 Team Loyalty', 'Your team is going the extra mile for you.');
    }

    // Servant Leader: track team thank-yous (positive streaks as proxy)
    const thankCount = incrementCounter('team-thanks');
    if (thankCount >= 5) unlockAchievement('servant-leader');
  }, [state.conductScore, state.positiveStreak, state.positiveThresholdsHit,
      addChatMsg, addNotification, deductFunds, unlockAchievement, incrementCounter]);

  // ── Lawsuit Completion ─────────────────────────────────────────────────────

  const completeLawsuit = useCallback((result: 'won' | 'lost' | 'settled') => {
    dispatch({ type: 'SET_LAWSUIT_RESULT', payload: result });

    if (result === 'won') {
      deductFunds(25000, 'Legal fees - lawsuit dismissed');
      unlockAchievement('objection');
      addNotification('⚖️ Lawsuit Dismissed', 'You won, but legal fees cost $25,000.');
      addChatMsg('hr', 'The lawsuit has been dismissed. But this isn\'t over. Behavior matters.', 2000);
    } else if (result === 'lost') {
      deductFunds(75000, 'Legal fees and damages - lawsuit lost');
      addNotification('⚖️ Lawsuit Lost', 'You lost. $75,000 in damages and fees.');
      addChatMsg('hr', 'The verdict is in. It\'s not good.', 2000);
      // If already at max warning, trigger resignation
      if (state.warningLevel >= 6) {
        const newLevel = 7;
        dispatch({ type: 'SET_WARNING_LEVEL', payload: newLevel });
        triggerEscalation(newLevel, 'hostile');
      }
    } else if (result === 'settled') {
      deductFunds(50000, 'Settlement payment');
      unlockAchievement('settled-out-of-court');
      addNotification('💰 Settled', 'Settlement paid: $50,000. Moving on.');
      addChatMsg('hr', 'A settlement has been reached. Let\'s hope we never go through this again.', 2000);
    }

    // Track lawsuit plays for achievement
    if (state.lawsuitPlayed >= 2) unlockAchievement('litigation-hell');
  }, [deductFunds, unlockAchievement, addNotification, addChatMsg, state.warningLevel, state.lawsuitPlayed, triggerEscalation]);

  // ── Training Completion ────────────────────────────────────────────────────

  const completeTraining = useCallback(() => {
    dispatch({ type: 'SET_TRAINING_COMPLETED' });
    addNotification('✅ Training Complete', 'HR training has been completed. Pat is watching.');
    addChatMsg('hr', 'Training acknowledged. I\'ll be keeping a close eye on things.', 1000);
  }, [addNotification, addChatMsg]);

  // ── Team Availability ──────────────────────────────────────────────────────

  const isTeamMemberAvailable = useCallback((id: string) => {
    return !state.teamUnavailable.includes(id);
  }, [state.teamUnavailable]);

  const setTeamUnavailable = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_TEAM_UNAVAILABLE', payload: ids });
  }, []);

  const clearTeamUnavailable = useCallback(() => {
    dispatch({ type: 'CLEAR_TEAM_UNAVAILABLE' });
  }, []);

  return (
    <ConductContext.Provider value={{
      conductScore: state.conductScore,
      warningLevel: state.warningLevel,
      incidentLog: state.incidentLog,
      teamUnavailable: state.teamUnavailable,
      positiveStreak: state.positiveStreak,
      lawsuitResult: state.lawsuitResult,
      forcedResignation: state.forcedResignation,
      hadTeamDeparture: state.hadTeamDeparture,
      reportIncident,
      reportPositive,
      completeLawsuit,
      completeTraining,
      isTeamMemberAvailable,
      setTeamUnavailable,
      clearTeamUnavailable,
    }}>
      {children}
    </ConductContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConductContext(): ConductContextValue {
  const context = useContext(ConductContext);
  if (!context) throw new Error('useConductContext must be used within ConductProvider');
  return context;
}
