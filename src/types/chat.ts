// ─── Channel Types ────────────────────────────────────────────────────────────

export type ChannelId = 'general' | 'creative' | 'random';

export interface Channel {
  id: ChannelId;
  name: string;
  description: string;
  icon: string;
  readOnly: boolean;
}

// ─── Message Types ────────────────────────────────────────────────────────────

export interface ChatReaction {
  emoji: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  channel: ChannelId;
  authorId: string;
  text: string;
  timestamp: number;
  reactions: ChatReaction[];
  isRead: boolean;
}

// ─── Morale ───────────────────────────────────────────────────────────────────

export type MoraleLevel = 'high' | 'medium' | 'low';

// ─── Campaign Event Types ─────────────────────────────────────────────────────

export type ChatCampaignEvent =
  | 'BRIEF_ACCEPTED'
  | 'CONCEPTING'
  | 'CONCEPT_CHOSEN'
  | 'DELIVERABLES_GENERATING'
  | 'CAMPAIGN_SCORED_WELL'
  | 'CAMPAIGN_SCORED_POORLY'
  | 'NEW_BRIEF_ARRIVED'
  | 'AWARD_WON'
  | 'HR_WARNING'
  | 'TEAM_COMPLAINT'
  | 'CONDUCT_POSITIVE'
  | 'LEVEL_UP';

export interface ChatEventContext {
  campaignName?: string;
  clientName: string;
  score?: number;
  awardName?: string;
  assignedTeamIds?: string[];
  conceptName?: string;
  conceptTagline?: string;
  deliverableTypes?: string[];
  deliverableDescriptions?: string[];
  tierName?: string;
  tierDescription?: string;
}

// ─── Message Template (used by chatMessages.ts) ──────────────────────────────

export interface MessageTemplate {
  channel: ChannelId;
  authorId: string;
  text: string;
  reactions?: ChatReaction[];
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface ChatState {
  channels: Channel[];
  messages: ChatMessage[];
  activeChannel: ChannelId;
  morale: MoraleLevel;
  lastReadTimestamps: Record<ChannelId, number>;
}
