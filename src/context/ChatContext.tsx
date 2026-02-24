import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatState,
  ChatMessage,
  ChannelId,
  MoraleLevel,
  Channel,
  ChatCampaignEvent,
  ChatEventContext,
} from '../types/chat';
import { getInitialMessages, getCampaignEventMessages } from '../data/chatMessages';
import { getAmbientPool } from '../data/ambientMessages';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  { id: 'general', name: 'general', description: 'Main team channel', icon: '#', readOnly: false },
  { id: 'creative', name: 'creative', description: 'Creative team discussions', icon: '\uD83C\uDFA8', readOnly: true },
  { id: 'random', name: 'random', description: 'Off-topic & fun', icon: '\uD83C\uDFB2', readOnly: false },
  { id: 'food', name: 'food', description: 'Lunch debates & diet wars', icon: '\uD83C\uDF55', readOnly: false },
  { id: 'memes', name: 'memes', description: 'Agency memes & reactions', icon: '\uD83D\uDDBC\uFE0F', readOnly: false },
  { id: 'haiku', name: 'haiku', description: 'Bad poetry about advertising', icon: '\uD83C\uDF8B', readOnly: false },
];

const initialState: ChatState = {
  channels: CHANNELS,
  messages: [],
  activeChannel: 'general',
  morale: 'medium',
  lastReadTimestamps: {
    general: 0,
    creative: 0,
    random: 0,
    food: 0,
    memes: 0,
    haiku: 0,
  },
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_ACTIVE_CHANNEL'; payload: ChannelId }
  | { type: 'MARK_CHANNEL_READ'; payload: ChannelId }
  | { type: 'SET_MORALE'; payload: MoraleLevel }
  | { type: 'ADD_REACTION'; payload: { messageId: string; emoji: string } }
  | { type: 'SEED_MESSAGES'; payload: ChatMessage[] };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_ACTIVE_CHANNEL': {
      const now = Date.now();
      return {
        ...state,
        activeChannel: action.payload,
        lastReadTimestamps: {
          ...state.lastReadTimestamps,
          [action.payload]: now,
        },
        messages: state.messages.map((m) =>
          m.channel === action.payload && !m.isRead
            ? { ...m, isRead: true }
            : m,
        ),
      };
    }

    case 'MARK_CHANNEL_READ': {
      const now = Date.now();
      return {
        ...state,
        lastReadTimestamps: {
          ...state.lastReadTimestamps,
          [action.payload]: now,
        },
        messages: state.messages.map((m) =>
          m.channel === action.payload && !m.isRead
            ? { ...m, isRead: true }
            : m,
        ),
      };
    }

    case 'SET_MORALE':
      return { ...state, morale: action.payload };

    case 'ADD_REACTION':
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.id !== action.payload.messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === action.payload.emoji);
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === action.payload.emoji
                  ? { ...r, count: r.count + 1 }
                  : r,
              ),
            };
          }
          return {
            ...m,
            reactions: [...m.reactions, { emoji: action.payload.emoji, count: 1 }],
          };
        }),
      };

    case 'SEED_MESSAGES':
      return { ...state, messages: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ChatContextValue extends ChatState {
  setActiveChannel: (channel: ChannelId) => void;
  markChannelRead: (channel: ChannelId) => void;
  setMorale: (level: MoraleLevel) => void;
  addReaction: (messageId: string, emoji: string) => void;
  addMessage: (msg: ChatMessage) => void;
  triggerCampaignEvent: (event: ChatCampaignEvent, context: ChatEventContext) => void;
  getUnreadCount: () => number;
  getUnreadCountForChannel: (channel: ChannelId) => number;
  getMessagesForChannel: (channel: ChannelId) => ChatMessage[];
  typingAuthorId: string | null;
  setTypingAuthorId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [typingAuthorId, setTypingAuthorId] = useState<string | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Seed messages on mount
  useEffect(() => {
    dispatch({ type: 'SEED_MESSAGES', payload: getInitialMessages() });
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Ambient casual channel messages — periodic banter in #food, #memes, #haiku, #random
  useEffect(() => {
    const casualChannels: ChannelId[] = ['food', 'memes', 'haiku', 'random'];
    const usedChains = new Map<string, Set<number>>();

    function pickChannel(): ChannelId {
      return casualChannels[Math.floor(Math.random() * casualChannels.length)];
    }

    function scheduleNext() {
      const delay = 45000 + Math.random() * 45000; // 45-90 seconds
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        const channel = pickChannel();
        const pool = getAmbientPool(channel);
        if (pool.length === 0) { scheduleNext(); return; }

        // Track used chains per channel
        if (!usedChains.has(channel)) usedChains.set(channel, new Set());
        const used = usedChains.get(channel)!;

        // Find unused chain
        const availableIndices = pool.map((_, i) => i).filter(i => !used.has(i));
        if (availableIndices.length === 0) {
          used.clear(); // Reset when all used
          scheduleNext();
          return;
        }

        const chainIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        used.add(chainIdx);

        const chain = pool[chainIdx];
        chain.messages.forEach((msg, msgIdx) => {
          const msgDelay = msg.delayMs ?? (msgIdx === 0 ? 0 : 2000 + Math.random() * 2000);
          const msgTimer = setTimeout(() => {
            timersRef.current.delete(msgTimer);
            dispatch({
              type: 'ADD_MESSAGE',
              payload: {
                id: `ambient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                channel,
                authorId: msg.authorId,
                text: msg.text,
                timestamp: Date.now(),
                reactions: msg.reactions ?? [],
                isRead: false,
                ...(msg.imageUrl ? { imageUrl: msg.imageUrl } : {}),
                ...(msg.tableData ? { tableData: msg.tableData } : {}),
              },
            });
          }, msgDelay);
          timersRef.current.add(msgTimer);
        });

        scheduleNext();
      }, delay);
      timersRef.current.add(timer);
    }

    // Start after a short initial delay
    const startTimer = setTimeout(scheduleNext, 15000);
    timersRef.current.add(startTimer);

    return () => {
      // Cleanup handled by the main timer cleanup effect
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveChannel = useCallback((channel: ChannelId) => {
    dispatch({ type: 'SET_ACTIVE_CHANNEL', payload: channel });
  }, []);

  const markChannelRead = useCallback((channel: ChannelId) => {
    dispatch({ type: 'MARK_CHANNEL_READ', payload: channel });
  }, []);

  const setMorale = useCallback((level: MoraleLevel) => {
    dispatch({ type: 'SET_MORALE', payload: level });
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    dispatch({ type: 'ADD_REACTION', payload: { messageId, emoji } });
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: msg });
  }, []);

  const triggerCampaignEvent = useCallback(
    (event: ChatCampaignEvent, context: ChatEventContext) => {
      const templates = getCampaignEventMessages(event, context, state.morale);

      templates.forEach((template, index) => {
        const delay = 1000 + index * (2000 + Math.random() * 2000);
        const timer = setTimeout(() => {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              channel: template.channel,
              authorId: template.authorId,
              text: template.text,
              timestamp: Date.now(),
              reactions: template.reactions || [],
              isRead: false,
              ...(template.imageUrl ? { imageUrl: template.imageUrl } : {}),
              ...(template.tableData ? { tableData: template.tableData } : {}),
            },
          });
          timersRef.current.delete(timer);
        }, delay);
        timersRef.current.add(timer);
      });

      // Morale adjustments from scoring events
      if (event === 'CAMPAIGN_SCORED_WELL') {
        const moraleTimer = setTimeout(() => {
          dispatch({ type: 'SET_MORALE', payload: 'high' });
          timersRef.current.delete(moraleTimer);
        }, 6000);
        timersRef.current.add(moraleTimer);
      }
      if (event === 'CAMPAIGN_SCORED_POORLY') {
        const moraleTimer = setTimeout(() => {
          dispatch({ type: 'SET_MORALE', payload: 'low' });
          timersRef.current.delete(moraleTimer);
        }, 6000);
        timersRef.current.add(moraleTimer);
      }
    },
    [state.morale],
  );

  const getUnreadCount = useCallback(() => {
    return state.messages.filter((m) => !m.isRead).length;
  }, [state.messages]);

  const getUnreadCountForChannel = useCallback(
    (channel: ChannelId) => {
      return state.messages.filter((m) => m.channel === channel && !m.isRead).length;
    },
    [state.messages],
  );

  const getMessagesForChannel = useCallback(
    (channel: ChannelId) => {
      return state.messages
        .filter((m) => m.channel === channel)
        .sort((a, b) => a.timestamp - b.timestamp);
    },
    [state.messages],
  );

  const value: ChatContextValue = {
    ...state,
    setActiveChannel,
    markChannelRead,
    setMorale,
    addReaction,
    addMessage,
    triggerCampaignEvent,
    getUnreadCount,
    getUnreadCountForChannel,
    getMessagesForChannel,
    typingAuthorId,
    setTypingAuthorId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
