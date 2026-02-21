import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type {
  BonusEvent,
  BonusEventType,
  CampaignScore,
  ReputationTier,
} from '../types/reputation';
import {
  getReputationTier,
  getNextTier,
  getScoreRating,
  getScoreTier,
  getBaseReputationGain,
  getRandomClientFeedback,
  getEventDelay,
  BONUS_EVENT_CONFIG,
  MILESTONES,
  REPUTATION_TIERS,
} from '../types/reputation';
import { emitSave } from '../utils/saveSignal';

// State interface
interface ReputationState {
  currentReputation: number;
  currentTier: ReputationTier;
  pendingBonusEvents: BonusEvent[];
  deliveredBonusEvents: BonusEvent[];
  completedCampaigns: CompletedCampaign[];
  achievedMilestones: string[];
  showLevelUp: boolean;
  levelUpTier: ReputationTier | null;
  recentReputationChange: { amount: number; timestamp: number } | null;
}

interface CompletedCampaign {
  id: string;
  name: string;
  clientName: string;
  industry: string;
  score: number;
  wasUnderBudget: boolean;
  completedAt: number;
}

// Actions
type ReputationAction =
  | { type: 'ADD_REPUTATION'; amount: number }
  | { type: 'SUBTRACT_REPUTATION'; amount: number }
  | { type: 'SET_REPUTATION'; amount: number }
  | { type: 'SCHEDULE_BONUS_EVENT'; event: BonusEvent }
  | { type: 'DELIVER_BONUS_EVENT'; eventId: string }
  | { type: 'COMPLETE_CAMPAIGN'; campaign: CompletedCampaign }
  | { type: 'ACHIEVE_MILESTONE'; milestoneId: string }
  | { type: 'SHOW_LEVEL_UP'; tier: ReputationTier }
  | { type: 'HIDE_LEVEL_UP' }
  | { type: 'CLEAR_REPUTATION_CHANGE' };

function loadReputation(): Partial<ReputationState> | null {
  try {
    const saved = localStorage.getItem('agencyrpg_reputation');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// Initial state — hydrate from localStorage if available
const savedRep = loadReputation();
const initialState: ReputationState = {
  currentReputation: savedRep?.currentReputation ?? 0,
  currentTier: getReputationTier(savedRep?.currentReputation ?? 0),
  pendingBonusEvents: savedRep?.pendingBonusEvents ?? [],
  deliveredBonusEvents: savedRep?.deliveredBonusEvents ?? [],
  completedCampaigns: savedRep?.completedCampaigns ?? [],
  achievedMilestones: savedRep?.achievedMilestones ?? [],
  showLevelUp: false,
  levelUpTier: null,
  recentReputationChange: null,
};

// Reducer
function reputationReducer(state: ReputationState, action: ReputationAction): ReputationState {
  switch (action.type) {
    case 'ADD_REPUTATION': {
      const newReputation = Math.max(0, state.currentReputation + action.amount);
      const newTier = getReputationTier(newReputation);
      const oldTier = state.currentTier;

      // Check for level up
      const leveledUp = newTier.minReputation > oldTier.minReputation;

      return {
        ...state,
        currentReputation: newReputation,
        currentTier: newTier,
        showLevelUp: leveledUp ? true : state.showLevelUp,
        levelUpTier: leveledUp ? newTier : state.levelUpTier,
        recentReputationChange: { amount: action.amount, timestamp: Date.now() },
      };
    }

    case 'SUBTRACT_REPUTATION': {
      const newReputation = Math.max(0, state.currentReputation - action.amount);
      const newTier = getReputationTier(newReputation);
      return {
        ...state,
        currentReputation: newReputation,
        currentTier: newTier,
        recentReputationChange: { amount: -action.amount, timestamp: Date.now() },
      };
    }

    case 'SET_REPUTATION': {
      const newTier = getReputationTier(action.amount);
      return {
        ...state,
        currentReputation: action.amount,
        currentTier: newTier,
      };
    }

    case 'SCHEDULE_BONUS_EVENT': {
      return {
        ...state,
        pendingBonusEvents: [...state.pendingBonusEvents, action.event],
      };
    }

    case 'DELIVER_BONUS_EVENT': {
      const event = state.pendingBonusEvents.find(e => e.id === action.eventId);
      if (!event) return state;

      return {
        ...state,
        pendingBonusEvents: state.pendingBonusEvents.filter(e => e.id !== action.eventId),
        deliveredBonusEvents: [...state.deliveredBonusEvents, { ...event, delivered: true }],
      };
    }

    case 'COMPLETE_CAMPAIGN': {
      return {
        ...state,
        completedCampaigns: [...state.completedCampaigns, action.campaign],
      };
    }

    case 'ACHIEVE_MILESTONE': {
      if (state.achievedMilestones.includes(action.milestoneId)) {
        return state;
      }
      return {
        ...state,
        achievedMilestones: [...state.achievedMilestones, action.milestoneId],
      };
    }

    case 'SHOW_LEVEL_UP': {
      return {
        ...state,
        showLevelUp: true,
        levelUpTier: action.tier,
      };
    }

    case 'HIDE_LEVEL_UP': {
      return {
        ...state,
        showLevelUp: false,
        levelUpTier: null,
      };
    }

    case 'CLEAR_REPUTATION_CHANGE': {
      return {
        ...state,
        recentReputationChange: null,
      };
    }

    default:
      return state;
  }
}

// Context interface
interface ReputationContextType {
  state: ReputationState;
  addReputation: (amount: number) => void;
  subtractReputation: (amount: number) => void;
  submitCampaign: (campaign: {
    id: string;
    name: string;
    clientName: string;
    industry: string;
    wasUnderBudget: boolean;
    conceptBoldness?: number; // 0-1 scale, affects viral/backlash chance
  }) => CampaignScore;
  hideLevelUp: () => void;
  clearReputationChange: () => void;
  getNextTier: () => ReputationTier | null;
  processPendingEvents: () => BonusEvent[];
}

const ReputationContext = createContext<ReputationContextType | null>(null);

// Local storage key
const STORAGE_KEY = 'agencyrpg_reputation';

// Provider component
export function ReputationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reputationReducer, initialState);
  const eventTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      const toSave = {
        currentReputation: state.currentReputation,
        completedCampaigns: state.completedCampaigns,
        achievedMilestones: state.achievedMilestones,
        pendingBonusEvents: state.pendingBonusEvents,
        deliveredBonusEvents: state.deliveredBonusEvents,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      emitSave();
    } catch (e) {
      console.error('Failed to save reputation state:', e);
    }
  }, [state.currentReputation, state.completedCampaigns, state.achievedMilestones, state.pendingBonusEvents, state.deliveredBonusEvents]);

  // Process pending events
  const processPendingEvents = useCallback((): BonusEvent[] => {
    const now = Date.now();
    const readyEvents = state.pendingBonusEvents.filter(
      event => event.scheduledFor <= now && !event.delivered
    );

    readyEvents.forEach(event => {
      dispatch({ type: 'DELIVER_BONUS_EVENT', eventId: event.id });
    });

    return readyEvents;
  }, [state.pendingBonusEvents]);

  // Schedule event timer
  const scheduleEventTimer = useCallback((event: BonusEvent) => {
    const delay = event.scheduledFor - Date.now();
    if (delay <= 0) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'DELIVER_BONUS_EVENT', eventId: event.id });
      eventTimersRef.current.delete(event.id);
    }, delay);

    eventTimersRef.current.set(event.id, timer);
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      eventTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Check milestones after campaign completion
  const checkMilestones = useCallback((campaigns: CompletedCampaign[]): BonusEvent[] => {
    const events: BonusEvent[] = [];
    const now = Date.now();

    // Campaign count milestones
    const totalCampaigns = campaigns.length;
    if (totalCampaigns >= 10 && !state.achievedMilestones.includes('campaigns_10')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'campaigns_10' });
      events.push(createMilestoneEvent('milestone_campaigns', 'campaigns_10', MILESTONES.campaigns_10.title, now));
    }
    if (totalCampaigns >= 25 && !state.achievedMilestones.includes('campaigns_25')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'campaigns_25' });
      events.push(createMilestoneEvent('milestone_campaigns', 'campaigns_25', MILESTONES.campaigns_25.title, now));
    }

    // High quality milestones
    const highQualityCampaigns = campaigns.filter(c => c.score >= 85).length;
    if (highQualityCampaigns >= 5 && !state.achievedMilestones.includes('quality_5')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'quality_5' });
      events.push(createMilestoneEvent('milestone_quality', 'quality_5', MILESTONES.quality_5.title, now));
    }
    if (highQualityCampaigns >= 10 && !state.achievedMilestones.includes('quality_10')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'quality_10' });
      events.push(createMilestoneEvent('milestone_quality', 'quality_10', MILESTONES.quality_10.title, now));
    }

    // Industry diversity
    const uniqueIndustries = new Set(campaigns.map(c => c.industry)).size;
    if (uniqueIndustries >= 3 && !state.achievedMilestones.includes('industries_3')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'industries_3' });
      events.push(createMilestoneEvent('milestone_diversity', 'industries_3', MILESTONES.industries_3.title, now));
    }
    if (uniqueIndustries >= 5 && !state.achievedMilestones.includes('industries_5')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'industries_5' });
      events.push(createMilestoneEvent('milestone_diversity', 'industries_5', MILESTONES.industries_5.title, now));
    }

    // Under budget streak
    const underBudgetCount = campaigns.filter(c => c.wasUnderBudget).length;
    if (underBudgetCount >= 5 && !state.achievedMilestones.includes('efficiency_5')) {
      dispatch({ type: 'ACHIEVE_MILESTONE', milestoneId: 'efficiency_5' });
      events.push(createMilestoneEvent('milestone_efficiency', 'efficiency_5', MILESTONES.efficiency_5.title, now));
    }

    return events;
  }, [state.achievedMilestones]);

  // Create milestone event
  function createMilestoneEvent(type: BonusEventType, milestoneId: string, title: string, now: number): BonusEvent {
    const config = BONUS_EVENT_CONFIG[type];
    return {
      id: `${type}_${milestoneId}_${now}`,
      type,
      reputationChange: config.reputationChange,
      title,
      description: `You've achieved: ${title}`,
      scheduledFor: now, // Milestones are immediate
      delivered: false,
    };
  }

  // Generate potential bonus events based on campaign score
  const generateBonusEvents = useCallback((
    campaignId: string,
    campaignName: string,
    score: number,
    conceptBoldness: number = 0.5
  ): BonusEvent[] => {
    const events: BonusEvent[] = [];
    const now = Date.now();

    // Check each bonus event type
    const eventTypes: BonusEventType[] = [
      'award_local', 'award_national', 'award_cannes',
      'viral_social', 'viral_press', 'viral_meme', 'viral_industry',
      'client_return', 'client_referral', 'client_word_of_mouth',
      'team_featured', 'team_speaking',
    ];

    for (const eventType of eventTypes) {
      const config = BONUS_EVENT_CONFIG[eventType];
      if (!config.minScore || !config.probability) continue;

      // Check if score meets minimum
      if (score < config.minScore) continue;

      // Bold concepts have higher viral chance but also backlash risk
      let adjustedProbability = config.probability;
      if (eventType.startsWith('viral_')) {
        adjustedProbability *= (0.5 + conceptBoldness);
      }

      // Roll for probability
      if (Math.random() > adjustedProbability) continue;

      // Create the event
      const delay = getEventDelay(config);
      events.push({
        id: `${eventType}_${campaignId}_${now}`,
        type: eventType,
        campaignId,
        reputationChange: config.reputationChange,
        title: getEventTitle(eventType, campaignName),
        description: getEventDescription(eventType, campaignName),
        scheduledFor: now + delay,
        delivered: false,
      });
    }

    // Check for negative events on bold + lower score
    if (conceptBoldness > 0.7 && score < 70) {
      const backlashChance = (conceptBoldness - 0.5) * 0.5;
      if (Math.random() < backlashChance) {
        const config = BONUS_EVENT_CONFIG['negative_backlash'];
        events.push({
          id: `negative_backlash_${campaignId}_${now}`,
          type: 'negative_backlash',
          campaignId,
          reputationChange: config.reputationChange,
          title: 'Campaign Backlash',
          description: `The bold approach for "${campaignName}" didn't land well.`,
          scheduledFor: now + getEventDelay(config),
          delivered: false,
        });
      }
    }

    return events;
  }, []);

  // Submit campaign and calculate score
  const submitCampaign = useCallback((campaign: {
    id: string;
    name: string;
    clientName: string;
    industry: string;
    wasUnderBudget: boolean;
    conceptBoldness?: number;
  }): CampaignScore => {
    // Calculate score components (would be more sophisticated in real implementation)
    // For now, generate realistic-feeling random scores
    const baseScore = 65 + Math.random() * 30; // 65-95 base range

    const breakdown = {
      strategicFit: Math.round(baseScore + (Math.random() - 0.5) * 15),
      executionQuality: Math.round(baseScore + (Math.random() - 0.5) * 15),
      budgetEfficiency: campaign.wasUnderBudget ? Math.round(85 + Math.random() * 15) : Math.round(70 + Math.random() * 20),
      audienceResonance: Math.round(baseScore + (Math.random() - 0.5) * 15),
    };

    // Clamp values to 0-100
    Object.keys(breakdown).forEach(key => {
      const k = key as keyof typeof breakdown;
      breakdown[k] = Math.min(100, Math.max(0, breakdown[k]));
    });

    // Calculate weighted total
    const total = Math.round(
      breakdown.strategicFit * 0.3 +
      breakdown.executionQuality * 0.3 +
      breakdown.budgetEfficiency * 0.2 +
      breakdown.audienceResonance * 0.2
    );

    const tier = getScoreTier(total);
    const rating = getScoreRating(total);
    const reputationGain = getBaseReputationGain(total);
    const feedback = getRandomClientFeedback(tier);

    // Add base reputation
    if (reputationGain > 0) {
      dispatch({ type: 'ADD_REPUTATION', amount: reputationGain });
    }

    // Record completed campaign
    const completedCampaign: CompletedCampaign = {
      id: campaign.id,
      name: campaign.name,
      clientName: campaign.clientName,
      industry: campaign.industry,
      score: total,
      wasUnderBudget: campaign.wasUnderBudget,
      completedAt: Date.now(),
    };
    dispatch({ type: 'COMPLETE_CAMPAIGN', campaign: completedCampaign });

    // Check milestones
    const milestoneEvents = checkMilestones([...state.completedCampaigns, completedCampaign]);
    milestoneEvents.forEach(event => {
      dispatch({ type: 'SCHEDULE_BONUS_EVENT', event });
      // Apply milestone reputation immediately
      dispatch({ type: 'ADD_REPUTATION', amount: event.reputationChange });
    });

    // Generate and schedule bonus events
    const bonusEvents = generateBonusEvents(
      campaign.id,
      campaign.name,
      total,
      campaign.conceptBoldness ?? 0.5
    );
    bonusEvents.forEach(event => {
      dispatch({ type: 'SCHEDULE_BONUS_EVENT', event });
      scheduleEventTimer(event);
    });

    return {
      total,
      breakdown,
      reputationGain,
      rating,
      feedback,
      tier,
    };
  }, [checkMilestones, generateBonusEvents, scheduleEventTimer, state.completedCampaigns]);

  const addReputation = useCallback((amount: number) => {
    dispatch({ type: 'ADD_REPUTATION', amount });
  }, []);

  const subtractReputation = useCallback((amount: number) => {
    dispatch({ type: 'SUBTRACT_REPUTATION', amount });
  }, []);

  const hideLevelUp = useCallback(() => {
    dispatch({ type: 'HIDE_LEVEL_UP' });
  }, []);

  const clearReputationChange = useCallback(() => {
    dispatch({ type: 'CLEAR_REPUTATION_CHANGE' });
  }, []);

  const getNextTierFn = useCallback(() => {
    return getNextTier(state.currentReputation);
  }, [state.currentReputation]);

  return (
    <ReputationContext.Provider
      value={{
        state,
        addReputation,
        subtractReputation,
        submitCampaign,
        hideLevelUp,
        clearReputationChange,
        getNextTier: getNextTierFn,
        processPendingEvents,
      }}
    >
      {children}
    </ReputationContext.Provider>
  );
}

// Hook
export function useReputationContext() {
  const context = useContext(ReputationContext);
  if (!context) {
    throw new Error('useReputationContext must be used within a ReputationProvider');
  }
  return context;
}

// Helper functions for event content
function getEventTitle(type: BonusEventType, campaignName: string): string {
  switch (type) {
    case 'award_local': return `Local Award for "${campaignName}"!`;
    case 'award_national': return `NATIONAL AWARD for "${campaignName}"!`;
    case 'award_cannes': return `CANNES LION for "${campaignName}"!!!`;
    case 'viral_social': return `"${campaignName}" is going VIRAL`;
    case 'viral_press': return `Press is covering "${campaignName}"`;
    case 'viral_meme': return `"${campaignName}" became a MEME`;
    case 'viral_industry': return `Industry is buzzing about "${campaignName}"`;
    case 'client_return': return 'Client wants to work again!';
    case 'client_referral': return 'New client referral!';
    case 'client_word_of_mouth': return 'Word is spreading...';
    case 'team_featured': return 'Team member featured!';
    case 'team_speaking': return 'Speaking opportunity!';
    case 'negative_backlash': return 'Campaign backlash...';
    case 'negative_client_unhappy': return 'Client concerns...';
    case 'negative_burnout': return 'Team morale check...';
    default: return 'Agency news';
  }
}

function getEventDescription(type: BonusEventType, campaignName: string): string {
  switch (type) {
    case 'award_local': return `"${campaignName}" won a regional creative award!`;
    case 'award_national': return `"${campaignName}" won at the national advertising awards!`;
    case 'award_cannes': return `"${campaignName}" won a CANNES LION. This is the big one.`;
    case 'viral_social': return `The content from "${campaignName}" is blowing up on social media.`;
    case 'viral_press': return `Ad Age and The Drum are writing about "${campaignName}".`;
    case 'viral_meme': return `People are making memes of "${campaignName}". It's a cultural moment.`;
    case 'viral_industry': return `LinkedIn and Twitter won't shut up about "${campaignName}".`;
    case 'client_return': return 'The client loved working with us and wants another project.';
    case 'client_referral': return 'Happy client referred us to another brand.';
    case 'client_word_of_mouth': return 'Good things being said about the agency...';
    case 'team_featured': return 'One of our team members was featured in industry press.';
    case 'team_speaking': return 'Conference wants our team to present our approach.';
    case 'negative_backlash': return `The bold concept for "${campaignName}" is getting pushback.`;
    case 'negative_client_unhappy': return 'Client expressed concerns about the direction.';
    case 'negative_burnout': return 'Team is showing signs of burnout from recent workload.';
    default: return 'Something happened at the agency.';
  }
}
