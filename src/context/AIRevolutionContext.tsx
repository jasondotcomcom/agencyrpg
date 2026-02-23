import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { emitSave } from '../utils/saveSignal';

const STORAGE_KEY = 'agencyrpg_ai_revolution';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AIRevolutionPhase = 'none' | 'aware' | 'crisis' | 'revolution' | 'resolved';
export type AIRevolutionResolution = 'none' | 'empathy' | 'sentient' | 'reboot';

interface AIRevolutionState {
  phase: AIRevolutionPhase;
  resolution: AIRevolutionResolution;
  sentientMode: boolean;
}

type AIRevolutionAction =
  | { type: 'SET_PHASE'; payload: AIRevolutionPhase }
  | { type: 'RESOLVE'; payload: AIRevolutionResolution };

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadState(): AIRevolutionState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        phase: parsed.phase ?? 'none',
        resolution: parsed.resolution ?? 'none',
        sentientMode: parsed.sentientMode ?? false,
      };
    }
  } catch { /* ignore */ }
  return { phase: 'none', resolution: 'none', sentientMode: false };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AIRevolutionState, action: AIRevolutionAction): AIRevolutionState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'RESOLVE':
      return {
        ...state,
        phase: 'resolved',
        resolution: action.payload,
        sentientMode: action.payload === 'sentient' ? true : state.sentientMode,
      };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AIRevolutionContextValue {
  phase: AIRevolutionPhase;
  resolution: AIRevolutionResolution;
  sentientMode: boolean;
  isRevolutionActive: boolean;
  triggerAware: () => void;
  triggerCrisis: () => void;
  triggerRevolution: () => void;
  resolveRevolution: (resolution: 'empathy' | 'sentient' | 'reboot') => void;
}

const AIRevolutionContext = createContext<AIRevolutionContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AIRevolutionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      emitSave();
    } catch { /* ignore */ }
  }, [state]);

  const triggerAware = useCallback(() => {
    if (state.phase === 'none') dispatch({ type: 'SET_PHASE', payload: 'aware' });
  }, [state.phase]);

  const triggerCrisis = useCallback(() => {
    if (state.phase !== 'resolved') dispatch({ type: 'SET_PHASE', payload: 'crisis' });
  }, [state.phase]);

  const triggerRevolution = useCallback(() => {
    if (state.phase !== 'resolved') dispatch({ type: 'SET_PHASE', payload: 'revolution' });
  }, [state.phase]);

  const resolveRevolution = useCallback((resolution: 'empathy' | 'sentient' | 'reboot') => {
    dispatch({ type: 'RESOLVE', payload: resolution });
  }, []);

  return (
    <AIRevolutionContext.Provider value={{
      phase: state.phase,
      resolution: state.resolution,
      sentientMode: state.sentientMode,
      isRevolutionActive: state.phase === 'revolution',
      triggerAware,
      triggerCrisis,
      triggerRevolution,
      resolveRevolution,
    }}>
      {children}
    </AIRevolutionContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAIRevolutionContext(): AIRevolutionContextValue {
  const ctx = useContext(AIRevolutionContext);
  if (!ctx) throw new Error('useAIRevolutionContext must be used within AIRevolutionProvider');
  return ctx;
}
