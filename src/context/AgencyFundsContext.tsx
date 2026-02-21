import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { formatBudget } from '../types/campaign';
import { emitSave } from '../utils/saveSignal';

interface CampaignProfit {
  campaignId: string;
  campaignName: string;
  teamFee: number;
  completedAt: number;
}

interface AgencyFundsState {
  totalFunds: number;
  campaignProfits: CampaignProfit[];
  recentChange: { amount: number; timestamp: number } | null;
}

type AgencyFundsAction =
  | { type: 'ADD_PROFIT'; payload: CampaignProfit }
  | { type: 'CLEAR_CHANGE' };

const STORAGE_KEY = 'agencyrpg_funds';
const STARTING_FUNDS = 100000;

function loadFunds(): Partial<AgencyFundsState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

const savedFunds = loadFunds();
const initialState: AgencyFundsState = {
  totalFunds: savedFunds?.totalFunds ?? STARTING_FUNDS,
  campaignProfits: savedFunds?.campaignProfits ?? [],
  recentChange: null,
};

function fundsReducer(state: AgencyFundsState, action: AgencyFundsAction): AgencyFundsState {
  switch (action.type) {
    case 'ADD_PROFIT': {
      const newFunds = state.totalFunds + action.payload.teamFee;
      return {
        ...state,
        totalFunds: newFunds,
        campaignProfits: [...state.campaignProfits, action.payload],
        recentChange: { amount: action.payload.teamFee, timestamp: Date.now() },
      };
    }
    case 'CLEAR_CHANGE':
      return { ...state, recentChange: null };
    default:
      return state;
  }
}

interface AgencyFundsContextType {
  state: AgencyFundsState;
  addProfit: (campaignId: string, campaignName: string, teamFee: number) => void;
  clearChange: () => void;
  formatFunds: () => string;
}

const AgencyFundsContext = createContext<AgencyFundsContextType | null>(null);

export function AgencyFundsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(fundsReducer, initialState);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        totalFunds: state.totalFunds,
        campaignProfits: state.campaignProfits,
      }));
      emitSave();
    } catch (e) {
      console.error('Failed to save agency funds:', e);
    }
  }, [state.totalFunds, state.campaignProfits]);

  const addProfit = useCallback((campaignId: string, campaignName: string, teamFee: number) => {
    dispatch({
      type: 'ADD_PROFIT',
      payload: { campaignId, campaignName, teamFee, completedAt: Date.now() },
    });
  }, []);

  const clearChange = useCallback(() => {
    dispatch({ type: 'CLEAR_CHANGE' });
  }, []);

  const formatFundsValue = useCallback(() => {
    return formatBudget(state.totalFunds);
  }, [state.totalFunds]);

  return (
    <AgencyFundsContext.Provider value={{ state, addProfit, clearChange, formatFunds: formatFundsValue }}>
      {children}
    </AgencyFundsContext.Provider>
  );
}

export function useAgencyFunds() {
  const context = useContext(AgencyFundsContext);
  if (!context) {
    throw new Error('useAgencyFunds must be used within an AgencyFundsProvider');
  }
  return context;
}
