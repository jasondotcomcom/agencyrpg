// ─── Layoffs store ────────────────────────────────────────────────────────────
// Tiny external store (not a React context) so ChatContext, CampaignContext,
// data/team.ts and the API layer can all read it regardless of provider order.
//
// Covers: AI3.0 vendor pitch, all-hands vote, Headcount Slots, who's been cut,
// the "neglect" plotline (people replacing themselves with AI), OmniPubDent
// interest emails, the Solo Shop ending and the Webby voting emails.

import { useSyncExternalStore } from 'react';
import { emitSave } from './saveSignal';

const STORAGE_KEY = 'agencyrpg_layoffs';

/** Roles that can be cut or neglected. HR (Pat) is not on the reels. */
export const CORE_ROLES = ['copywriter', 'art-director', 'strategist', 'technologist', 'suit', 'media', 'pm'] as const;
export type CoreRole = typeof CORE_ROLES[number];

export interface LayoffsState {
  // AI3.0 vendor
  ai3EmailsSent: number;
  ai3LastEmailAtCount: number;   // completed-campaign count when the last pitch went out
  trialStarted: boolean;
  voteHeld: boolean;
  overridden: boolean;
  // Headcount Slots
  cut: string[];                 // in the order they were cut
  spins: number;
  totalPayout: number;
  efficiencyPoints: number;
  streak: number;                // consecutive accepted cuts
  // Neglect plotline
  neglect: Record<string, number>;      // consecutive completed campaigns left off the team
  neglectStage: Record<string, number>; // highest stage already announced
  processedCampaigns: string[];
  neglectInit: boolean;
  // Consequences
  omniOffersSent: number;
  soloShopTriggered: boolean;
  bigBriefsHeld: string[];
  // Webby
  webbySent: string[];
  webbyFirstAt: number;          // ms timestamp of the first voting email this year
}

const DEFAULT_STATE: LayoffsState = {
  ai3EmailsSent: 0,
  ai3LastEmailAtCount: 0,
  trialStarted: false,
  voteHeld: false,
  overridden: false,
  cut: [],
  spins: 0,
  totalPayout: 0,
  efficiencyPoints: 0,
  streak: 0,
  neglect: {},
  neglectStage: {},
  processedCampaigns: [],
  neglectInit: false,
  omniOffersSent: 0,
  soloShopTriggered: false,
  bigBriefsHeld: [],
  webbySent: [],
  webbyFirstAt: 0,
};

function load(): LayoffsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
}

let state: LayoffsState = load();
const listeners = new Set<() => void>();

export function getLayoffsState(): LayoffsState {
  return state;
}

export function updateLayoffs(patch: Partial<LayoffsState> | ((s: LayoffsState) => Partial<LayoffsState>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    emitSave();
  } catch { /* ignore */ }
  listeners.forEach(l => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLayoffs(): LayoffsState {
  return useSyncExternalStore(subscribe, getLayoffsState, getLayoffsState);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isCut(id: string): boolean {
  return state.cut.includes(id);
}

export function cutCount(): number {
  return state.cut.length;
}

export function humansLeft(): string[] {
  return CORE_ROLES.filter(id => !state.cut.includes(id));
}

export function everyoneCut(): boolean {
  return humansLeft().length === 0;
}

/** Neglect stage for a person: 0 normal, 1 "upskilling", 2 "Great question!", 3 fully flattened. */
export function getNeglectStage(id: string): number {
  if (isCut(id)) return 0;
  const n = state.neglect[id] ?? 0;
  if (n >= 5) return 3;
  if (n >= 4) return 2;
  if (n >= 3) return 1;
  return 0;
}

/** The margin the player sees in vendor and OmniPubDent emails, by number of cuts. */
const MARGINS = [31, 38, 46, 55, 64, 73, 84, 94];
export function currentMargin(cuts = state.cut.length): number {
  return MARGINS[Math.min(cuts, MARGINS.length - 1)];
}
