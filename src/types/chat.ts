// ─── Channel Types ────────────────────────────────────────────────────────────

export type ChannelId = 'general' | 'creative' | 'random' | 'food' | 'memes' | 'haiku';

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

export interface ChatTableData {
  headers: string[];
  rows: string[][];
}

export type MemeTemplate = 'drake' | 'expanding-brain' | 'two-buttons' | 'this-is-fine' | 'quote';

export interface MemeData {
  template: MemeTemplate;
  items: string[];
}

export interface ChatMessage {
  id: string;
  channel: ChannelId;
  authorId: string;
  text: string;
  timestamp: number;
  reactions: ChatReaction[];
  isRead: boolean;
  imageUrl?: string;
  tableData?: ChatTableData;
  memeData?: MemeData;
  generatedImageUrl?: string;
}

// ─── Morale ───────────────────────────────────────────────────────────────────

export type MoraleLevel = 'high' | 'medium' | 'low' | 'toxic' | 'mutiny';

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
  | 'LEVEL_UP'
  | 'SKETCHY_BRIEF_ACCEPTED'
  | 'BRIEF_DECLINED';

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
  isSketchyClient?: boolean;
  isSeasonal?: boolean;
  isKidMode?: boolean;
}

// ─── Message Template (used by chatMessages.ts) ──────────────────────────────

export interface MessageTemplate {
  channel: ChannelId;
  authorId: string;
  text: string;
  reactions?: ChatReaction[];
  imageUrl?: string;
  tableData?: ChatTableData;
  memeData?: MemeData;
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface ChatState {
  channels: Channel[];
  messages: ChatMessage[];
  activeChannel: ChannelId;
  morale: MoraleLevel;
  lastReadTimestamps: Record<ChannelId, number>;
}
