import type { ReactElement } from 'react';
import type { TeamMember } from '../../types/campaign';

export type GamePhase = 'ready' | 'playing' | 'result' | 'complete';
export type WaitPhase = 'concepting' | 'generating';

export type MechanicCategory =
  | 'click' | 'drag' | 'flick' | 'avoid'
  | 'draw' | 'timing' | 'physical' | 'puzzle' | 'hold';

export interface GameResultMeta {
  hits?: number;         // Times hit in avoiding game
  wrongPicks?: number;   // Wrong answers in matching/puzzle game
  exactCenter?: boolean; // Hit dead center in timing game
  missMargin?: number;   // How close a timing fail was (0-1)
  elapsedMs?: number;    // Time to complete (word/matching games)
  customFlags?: string[]; // Game-specific achievement flags
}

export interface GameDef {
  id: string;
  instruction: string;
  duration: number;
  category: MechanicCategory;
  waitPhase: WaitPhase | 'both';
  /** If true, surviving the full timer = win (dodge/avoid games) */
  survivorGame?: boolean;
  render: (onWin: (meta?: GameResultMeta) => void, onFail: (meta?: GameResultMeta) => void, member: TeamMember) => ReactElement;
  winMsg: (m: TeamMember) => string;
  failMsg: (m: TeamMember) => string;
}
