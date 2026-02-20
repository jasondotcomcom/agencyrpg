// Reputation System Types

export interface ReputationTier {
  id: string;
  name: string;
  minReputation: number;
  description: string;
  unlocks: string[];
}

export const REPUTATION_TIERS: ReputationTier[] = [
  {
    id: 'startup',
    name: 'Scrappy Startup',
    minReputation: 0,
    description: 'Just getting started. Everything to prove.',
    unlocks: ['Local brand briefs', 'Basic team'],
  },
  {
    id: 'emerging',
    name: 'Emerging Agency',
    minReputation: 15,
    description: 'People are starting to notice.',
    unlocks: ['Regional brand briefs', 'Slightly bigger budgets'],
  },
  {
    id: 'established',
    name: 'Established Agency',
    minReputation: 30,
    description: 'You have a real reputation now.',
    unlocks: ['National brand briefs', 'Premium clients'],
  },
  {
    id: 'respected',
    name: 'Respected Agency',
    minReputation: 50,
    description: 'Industry peers know your name.',
    unlocks: ['Fortune 500 briefs', 'Award show invites'],
  },
  {
    id: 'acclaimed',
    name: 'Acclaimed Agency',
    minReputation: 75,
    description: 'Award-winning work. Clients come to you.',
    unlocks: ['Dream clients', 'Speaking opportunities'],
  },
  {
    id: 'legendary',
    name: 'Legendary Agency',
    minReputation: 100,
    description: 'You made it. The industry watches everything you do.',
    unlocks: ['Any client you want', 'Industry legend status'],
  },
];

// Campaign Score Breakdown
export interface CampaignScoreBreakdown {
  strategicFit: number;      // How well concept matches brief (0-100)
  executionQuality: number;  // Quality of deliverables (0-100)
  budgetEfficiency: number;  // Budget management bonus (0-100)
  audienceResonance: number; // How well it connects with target (0-100)
}

export interface CampaignScore {
  total: number;             // Weighted average (0-100)
  breakdown: CampaignScoreBreakdown;
  reputationGain: number;    // Base reputation from this score
  rating: 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5; // Star rating (half-stars supported)
  feedback: string;          // Client quote
  tier: 'exceptional' | 'great' | 'solid' | 'needs_improvement';
}

// Bonus Event Types
export type BonusEventType =
  | 'award_local'
  | 'award_national'
  | 'award_cannes'
  | 'viral_social'
  | 'viral_press'
  | 'viral_meme'
  | 'viral_industry'
  | 'client_return'
  | 'client_referral'
  | 'client_word_of_mouth'
  | 'milestone_campaigns'
  | 'milestone_quality'
  | 'milestone_diversity'
  | 'milestone_efficiency'
  | 'team_featured'
  | 'team_speaking'
  | 'negative_backlash'
  | 'negative_client_unhappy'
  | 'negative_burnout';

export interface BonusEvent {
  id: string;
  type: BonusEventType;
  campaignId?: string;       // Related campaign if applicable
  reputationChange: number;  // + or -
  title: string;             // For email subject
  description: string;       // What happened
  scheduledFor: number;      // Timestamp when email should arrive
  delivered: boolean;        // Has the email been sent
}

export const BONUS_EVENT_CONFIG: Record<BonusEventType, {
  reputationChange: number;
  minScore?: number;
  probability?: number;      // 0-1 chance if eligible
  delayDaysMin: number;
  delayDaysMax: number;
  emailFrom: string;         // Team member id
}> = {
  // Awards
  award_local: {
    reputationChange: 2,
    minScore: 85,
    probability: 0.4,
    delayDaysMin: 3,
    delayDaysMax: 7,
    emailFrom: 'suit',
  },
  award_national: {
    reputationChange: 5,
    minScore: 90,
    probability: 0.3,
    delayDaysMin: 4,
    delayDaysMax: 7,
    emailFrom: 'suit',
  },
  award_cannes: {
    reputationChange: 10,
    minScore: 95,
    probability: 0.15,
    delayDaysMin: 5,
    delayDaysMax: 7,
    emailFrom: 'suit',
  },

  // Viral/Cultural
  viral_social: {
    reputationChange: 2,
    minScore: 80,
    probability: 0.35,
    delayDaysMin: 1,
    delayDaysMax: 3,
    emailFrom: 'suit',
  },
  viral_press: {
    reputationChange: 3,
    minScore: 85,
    probability: 0.25,
    delayDaysMin: 2,
    delayDaysMax: 4,
    emailFrom: 'suit',
  },
  viral_meme: {
    reputationChange: 5,
    minScore: 88,
    probability: 0.15,
    delayDaysMin: 1,
    delayDaysMax: 2,
    emailFrom: 'suit',
  },
  viral_industry: {
    reputationChange: 2,
    minScore: 82,
    probability: 0.3,
    delayDaysMin: 2,
    delayDaysMax: 4,
    emailFrom: 'strategist',
  },

  // Client Relationships
  client_return: {
    reputationChange: 1,
    minScore: 80,
    probability: 0.5,
    delayDaysMin: 5,
    delayDaysMax: 10,
    emailFrom: 'suit',
  },
  client_referral: {
    reputationChange: 2,
    minScore: 85,
    probability: 0.3,
    delayDaysMin: 7,
    delayDaysMax: 14,
    emailFrom: 'suit',
  },
  client_word_of_mouth: {
    reputationChange: 1,
    minScore: 78,
    probability: 0.4,
    delayDaysMin: 3,
    delayDaysMax: 7,
    emailFrom: 'suit',
  },

  // Milestones (automatic, no probability)
  milestone_campaigns: {
    reputationChange: 3,
    delayDaysMin: 0,
    delayDaysMax: 0,
    emailFrom: 'pm',
  },
  milestone_quality: {
    reputationChange: 5,
    delayDaysMin: 0,
    delayDaysMax: 0,
    emailFrom: 'pm',
  },
  milestone_diversity: {
    reputationChange: 2,
    delayDaysMin: 0,
    delayDaysMax: 0,
    emailFrom: 'pm',
  },
  milestone_efficiency: {
    reputationChange: 3,
    delayDaysMin: 0,
    delayDaysMax: 0,
    emailFrom: 'pm',
  },

  // Team Recognition
  team_featured: {
    reputationChange: 2,
    minScore: 88,
    probability: 0.15,
    delayDaysMin: 7,
    delayDaysMax: 14,
    emailFrom: 'art-director',
  },
  team_speaking: {
    reputationChange: 3,
    minScore: 90,
    probability: 0.1,
    delayDaysMin: 10,
    delayDaysMax: 20,
    emailFrom: 'strategist',
  },

  // Negative Events
  negative_backlash: {
    reputationChange: -5,
    delayDaysMin: 1,
    delayDaysMax: 2,
    emailFrom: 'suit',
  },
  negative_client_unhappy: {
    reputationChange: -3,
    delayDaysMin: 1,
    delayDaysMax: 3,
    emailFrom: 'suit',
  },
  negative_burnout: {
    reputationChange: -2,
    delayDaysMin: 2,
    delayDaysMax: 5,
    emailFrom: 'pm',
  },
};

// Score thresholds for base reputation
export const SCORE_REPUTATION_REWARDS = {
  exceptional: { minScore: 90, reputation: 5, tier: 'exceptional' as const },
  great: { minScore: 80, reputation: 3, tier: 'great' as const },
  solid: { minScore: 70, reputation: 1, tier: 'solid' as const },
  needs_improvement: { minScore: 0, reputation: 0, tier: 'needs_improvement' as const },
};

// Portfolio milestones
export const MILESTONES = {
  campaigns_10: { count: 10, type: 'milestone_campaigns' as const, title: '10 Campaigns Completed' },
  campaigns_25: { count: 25, type: 'milestone_campaigns' as const, title: '25 Campaigns Completed' },
  campaigns_50: { count: 50, type: 'milestone_campaigns' as const, title: '50 Campaigns Completed' },
  quality_5: { count: 5, minScore: 85, type: 'milestone_quality' as const, title: '5 High-Quality Campaigns' },
  quality_10: { count: 10, minScore: 85, type: 'milestone_quality' as const, title: '10 High-Quality Campaigns' },
  industries_3: { count: 3, type: 'milestone_diversity' as const, title: '3 Different Industries' },
  industries_5: { count: 5, type: 'milestone_diversity' as const, title: '5 Different Industries' },
  efficiency_5: { count: 5, type: 'milestone_efficiency' as const, title: '5 Under-Budget Campaigns' },
};

// Client feedback quotes based on score tier
export const CLIENT_FEEDBACK: Record<string, string[]> = {
  exceptional: [
    "This is exactly what we needed. Honestly, better than we imagined.",
    "The board is thrilled. You've exceeded every expectation.",
    "I've been doing this for 20 years. This is special.",
    "We're already talking about what's next. You're our agency now.",
    "This is the kind of work that changes brands. Thank you.",
  ],
  great: [
    "Really solid work. The team here is impressed.",
    "You nailed the brief. Looking forward to the next one.",
    "Great execution all around. Happy to recommend you.",
    "This hit all our objectives. Well done.",
    "The work speaks for itself. Thank you for this.",
  ],
  solid: [
    "Good work overall. A few things we'd tweak but solid foundation.",
    "This meets our needs. Thanks for the effort.",
    "Decent execution. Let's discuss learnings for next time.",
    "The basics are there. Room to grow together.",
    "Acceptable work. We'll keep you in mind.",
  ],
  needs_improvement: [
    "This didn't quite land how we hoped. Let's debrief.",
    "I think there's a disconnect between brief and execution.",
    "We expected more given the budget. Disappointing.",
    "The strategy felt off. Let's talk about what happened.",
    "Not our best collaboration. Hope we can do better next time.",
  ],
};

// Helper functions
export function getReputationTier(reputation: number): ReputationTier {
  const sorted = [...REPUTATION_TIERS].sort((a, b) => b.minReputation - a.minReputation);
  return sorted.find(tier => reputation >= tier.minReputation) || REPUTATION_TIERS[0];
}

export function getNextTier(reputation: number): ReputationTier | null {
  const currentTier = getReputationTier(reputation);
  const currentIndex = REPUTATION_TIERS.findIndex(t => t.id === currentTier.id);
  if (currentIndex < REPUTATION_TIERS.length - 1) {
    return REPUTATION_TIERS[currentIndex + 1];
  }
  return null;
}

export function getScoreRating(score: number): 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 {
  if (score >= 90) return 5;
  if (score >= 80) return 4.5;
  if (score >= 75) return 4;
  if (score >= 70) return 3.5;
  if (score >= 65) return 3;
  if (score >= 60) return 2.5;
  if (score >= 50) return 2;
  if (score >= 40) return 1.5;
  return 1;
}

export function getScoreTier(score: number): CampaignScore['tier'] {
  if (score >= 90) return 'exceptional';
  if (score >= 80) return 'great';
  if (score >= 70) return 'solid';
  return 'needs_improvement';
}

export function getBaseReputationGain(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 3;
  if (score >= 70) return 1;
  return 0;
}

export function getRandomClientFeedback(tier: CampaignScore['tier']): string {
  const quotes = CLIENT_FEEDBACK[tier];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Generate random delay in milliseconds based on config
export function getEventDelay(config: { delayDaysMin: number; delayDaysMax: number }): number {
  // For demo purposes, use much shorter delays (seconds instead of days)
  // In production, use: config.delayDaysMin * 24 * 60 * 60 * 1000
  const demoMinMs = config.delayDaysMin * 5000; // 5 seconds per "day"
  const demoMaxMs = config.delayDaysMax * 5000;
  return demoMinMs + Math.random() * (demoMaxMs - demoMinMs);
}
