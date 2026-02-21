import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { emitSave } from '../utils/saveSignal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioDeliverable {
  type: string;
  platform: string;
  description: string;
}

export interface PortfolioEntry {
  id: string;
  campaignName: string;
  clientName: string;
  score: number;
  rating: number;
  tier: 'exceptional' | 'great' | 'solid' | 'needs_improvement';
  feedback: string;
  completedAt: number;
  conceptName?: string;
  bigIdea?: string;              // concept's big idea
  conceptDescription?: string;   // concept's whyItWorks rationale
  deliverables?: PortfolioDeliverable[];
  teamFee: number;
  wasUnderBudget: boolean;
  award?: string;      // e.g. "🏆 Client's Choice"
  shared?: boolean;    // true after sharing to The Shortlist
}

interface PortfolioContextValue {
  entries: PortfolioEntry[];
  addEntry: (entry: PortfolioEntry) => void;
  attachAward: (campaignId: string, award: string) => void;
  markShared: (id: string) => void;
  enrichEntry: (id: string, updates: Partial<PortfolioEntry>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg-portfolio';

function loadEntries(): PortfolioEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<PortfolioEntry[]>(loadEntries);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    emitSave();
  }, [entries]);

  const addEntry = useCallback((entry: PortfolioEntry) => {
    setEntries(prev => {
      // Don't add duplicates
      if (prev.some(e => e.id === entry.id)) return prev;
      return [entry, ...prev];
    });
  }, []);

  const attachAward = useCallback((campaignId: string, award: string) => {
    setEntries(prev =>
      prev.map(e => e.id === campaignId ? { ...e, award } : e)
    );
  }, []);

  const markShared = useCallback((id: string) => {
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, shared: true } : e)
    );
  }, []);

  const enrichEntry = useCallback((id: string, updates: Partial<PortfolioEntry>) => {
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }, []);

  return (
    <PortfolioContext.Provider value={{ entries, addEntry, attachAward, markShared, enrichEntry }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolioContext must be used within PortfolioProvider');
  return ctx;
}
