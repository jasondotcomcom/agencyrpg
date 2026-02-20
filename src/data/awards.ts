// ─── Award Definitions ────────────────────────────────────────────────────────

export interface AwardDef {
  id: string;
  name: string;       // Display name, e.g. "🌟 Cannes Shortlist"
  description: string;
  repBonus: number;
  minScore: number;
  requiresUnderBudget?: boolean;
}

export const AWARD_DEFS: AwardDef[] = [
  {
    id: 'cannes',
    name: '🌟 Cannes Shortlist',
    description: 'Work shortlisted for the Cannes Lions. The industry is watching.',
    repBonus: 8,
    minScore: 95,
  },
  {
    id: 'clients_choice',
    name: '🏆 Client\'s Choice',
    description: 'Exceptional client satisfaction. They told everyone about it.',
    repBonus: 5,
    minScore: 90,
  },
  {
    id: 'above_beyond',
    name: '📈 Above & Beyond',
    description: 'Delivered outstanding work under budget. A rare combination.',
    repBonus: 3,
    minScore: 85,
    requiresUnderBudget: true,
  },
];

/**
 * Returns all awards earned for a given score + budget outcome.
 * Most prestigious awards first.
 */
export function checkForAwards(score: number, wasUnderBudget: boolean): AwardDef[] {
  return AWARD_DEFS.filter(award => {
    if (score < award.minScore) return false;
    if (award.requiresUnderBudget && !wasUnderBudget) return false;
    return true;
  });
}
