import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { Email } from '../types/email';
import { useEmailContext } from './EmailContext';
import { useChatContext } from './ChatContext';
import { useAchievementContext } from './AchievementContext';
import { useWindowContext } from './WindowContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AcquisitionState =
  | 'none'               // Nothing has happened
  | 'email_sent'         // First offer email in inbox, awaiting player action
  | 'rejected'           // Player rejected the offer
  | 'hostile_pending'    // Hostile takeover will fire after next campaign
  | 'hostile_email_sent' // Hostile takeover email is in inbox
  | 'ending';            // Ending sequence is active

export type EndingType = 'voluntary' | 'hostile' | 'credits_only' | 'forced_resignation';

export type EndingPhase =
  | 'hostile_chat'
  | 'team_reactions'
  | 'fade'
  | 'where_are_they'
  | 'portfolio'
  | 'credits'
  | 'post_credits';

const PHASE_SEQUENCES: Record<EndingType, EndingPhase[]> = {
  voluntary:    ['team_reactions', 'fade', 'where_are_they', 'portfolio', 'credits', 'post_credits'],
  hostile:      ['hostile_chat', 'where_are_they', 'portfolio', 'credits', 'post_credits'],
  credits_only: ['credits', 'post_credits'],
  forced_resignation: ['team_reactions', 'fade', 'where_are_they', 'credits', 'post_credits'],
};

interface EndingState {
  acquisitionState: AcquisitionState;
  campaignsAtRejection: number;
  isEnding: boolean;
  endingType: EndingType | null;
  currentPhaseIndex: number;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type EndingAction =
  | { type: 'SET_ACQUISITION_STATE'; payload: AcquisitionState }
  | { type: 'SET_CAMPAIGNS_AT_REJECTION'; payload: number }
  | { type: 'START_ENDING'; payload: { endingType: EndingType } }
  | { type: 'ADVANCE_PHASE' };

const initialState: EndingState = {
  acquisitionState: 'none',
  campaignsAtRejection: 0,
  isEnding: false,
  endingType: null,
  currentPhaseIndex: 0,
};

function endingReducer(state: EndingState, action: EndingAction): EndingState {
  switch (action.type) {
    case 'SET_ACQUISITION_STATE':
      return { ...state, acquisitionState: action.payload };

    case 'SET_CAMPAIGNS_AT_REJECTION':
      return { ...state, campaignsAtRejection: action.payload };

    case 'START_ENDING':
      return {
        ...state,
        isEnding: true,
        endingType: action.payload.endingType,
        currentPhaseIndex: 0,
        acquisitionState: 'ending',
      };

    case 'ADVANCE_PHASE':
      return { ...state, currentPhaseIndex: state.currentPhaseIndex + 1 };

    default:
      return state;
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function createAcquisitionEmail(): Email {
  return {
    id: `acquisition-offer-${Date.now()}`,
    type: 'acquisition_offer',
    from: { name: 'Theodore Pemberton IV', email: 'tpemberton@omnipubdent.groupe', avatar: '🏢' },
    subject: '🎉 Exciting Opportunity: Acquisition Offer',
    isUrgent: false,
    body: `Dear Founder,

Congratulations on your incredible success at Cannes! Your work has not gone unnoticed.

We at OmniPubDent Holdings Groupe would like to formally extend an acquisition offer for your agency.

This is an exciting opportunity! You'll have access to:
- **Global Resource Optimization Pools™**
- **Cross-Network Synergy Initiatives™**
- **Quarterly Alignment Summits™**
- **Comprehensive Integration Support**

Your agency would join our "Boutique Heritage Brands" division, where your unique culture will be carefully preserved* (*subject to global brand guidelines).

We believe this partnership could unlock tremendous value for all stakeholders.

Please let us know your decision.

**Warm regards,**

THEODORE MAXIMILIAN PEMBERTON IV
Chief Integration Architect
OmniPubDent Holdings Groupe
*"Synergizing Tomorrow's Solutions Today"*`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
  };
}

function createRejectionResponseEmail(): Email {
  return {
    id: `acquisition-rejected-${Date.now()}`,
    type: 'acquisition_offer',
    from: { name: 'Theodore Pemberton IV', email: 'tpemberton@omnipubdent.groupe', avatar: '🏢' },
    subject: 'RE: Exciting Opportunity: Acquisition Offer',
    body: `Thank you for your response.

We respect your decision to remain independent at this time.

Should circumstances change, our door remains open.

**Best,**
Theodore`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
  };
}

function createHostileTakeoverEmail(): Email {
  return {
    id: `hostile-takeover-${Date.now()}`,
    type: 'hostile_takeover',
    from: { name: 'Legal Department', email: 'legal@weltgeist-capital.com', avatar: '⚖️' },
    subject: '⚠️ NOTICE OF ACQUISITION — ACTION REQUIRED',
    isUrgent: true,
    body: `CONFIDENTIAL — LEGAL NOTICE

Dear Founder,

This letter serves as formal notification that Weltgeist Capital Partners, in coordination with OmniPubDent Holdings Groupe, has completed a majority stake acquisition of your agency.

This transaction was executed through secondary market share purchases and convertible note agreements with your early investors.

Effective immediately, your agency is now a wholly-owned subsidiary of OmniPubDent Holdings Groupe.

**Key changes:**
- All creative decisions now require Global Approval Board sign-off
- Mandatory attendance at Quarterly Synergy Summits
- Your title has been updated to "Legacy Brand Steward"
- Terminal access has been revoked

We appreciate your understanding during this transition.

**This decision is final and not subject to appeal.**

Regards,

WELTGEIST CAPITAL PARTNERS
*"Unlocking Shareholder Value Since 1987"*

---
*If you believe you received this in error, you didn't.*`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
  };
}

function createDisclosureEmail(): Email {
  return {
    id: 'email-014',
    type: 'campaign_brief',
    from: {
      name: 'Classified',
      email: 'do-not-reply@public-trust.gov',
      avatar: '🔒',
    },
    subject: 'Public Trust Initiative — Consultation Request (NDA Required)',
    body: `This message has been cleared for transmission.

We represent an interagency working group preparing for a significant public disclosure. The nature of the disclosure is sensitive and will be shared upon execution of a non-disclosure agreement.

What we can share now:

The disclosure concerns information that has been classified for several decades. A decision has been made — at levels above our authority — to begin a phased release to the general public. Our challenge is not the information itself. It is the public reaction.

We need a communications strategy that eases anxiety, builds trust, and prevents panic. The audience is everyone. The timeline is firm. The stakes are as high as they sound.

Your agency was flagged after you rejected a recent acquisition offer. Independence and discretion are requirements for this engagement. Firms embedded in holding company structures were disqualified.

Budget: $75,000 (disbursed via interagency transfer, non-attributable).
Timeline: 40 days to initial framework delivery.

This is not a test. This is not a drill.

If you are interested, accept the brief. Further details will follow.

— REDACTED
Public Trust Initiative
[Classification level withheld]`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'Classified',
      challenge: `A government-adjacent organization is preparing a phased public disclosure of information that has been classified for decades. The nature of the information cannot be revealed until NDA execution. The challenge: design a communications framework that eases public anxiety, builds institutional trust, and prevents panic — without knowing exactly what you're communicating about. The audience is literally everyone.`,
      audience: `The general public — all demographics, all trust levels, all media consumption habits. Includes conspiracy theorists who will say "I told you so," skeptics who will say "this is fake," and the vast middle who will feel confused and anxious. Must reach people through trusted channels before misinformation fills the void.`,
      message: `The truth is being shared because you deserve to know. There is a plan. You are safe. More information will follow on a predictable schedule.`,
      successMetrics: [
        'Public anxiety index remains below critical threshold in first 72 hours',
        'Framework adopted by at least 3 participating agencies',
        'Information vacuum does not get filled by misinformation before official channels',
        'Public trust polling shows net positive movement within 30 days',
        'No civil unrest attributable to communications failure',
      ],
      budget: 75000,
      timeline: '40 days to initial framework delivery. Phased rollout begins immediately after.',
      vibe: `Calm authority. Institutional trust without institutional coldness. Should feel like a steady hand on the wheel — not corporate, not military, not political. Human. Think: the person you'd want explaining something important to you at 2am.`,
      openEndedAsk: `How do you prepare the public for something they can't be told about yet? What does a trust-building communications framework look like when the subject is unknown and the stakes are existential? How do you get ahead of panic?`,
      constraints: [
        'Subject of disclosure cannot be named in any materials (NDA enforced)',
        'Cannot use fear-based messaging or imply threat',
        'Framework must be adaptable to multiple disclosure scenarios',
        'All materials subject to interagency review — no unilateral publication',
        'Must work across all major media channels simultaneously',
      ],
      clientPersonality: 'Measured, deliberate, reveals information in layers, will not answer direct questions about the disclosure subject, evaluates trust before sharing details',
    },
  };
}

// ─── Chat message helpers ─────────────────────────────────────────────────────

type ChatMsg = { authorId: string; text: string; delay: number };

const REJECTION_CELEBRATION: ChatMsg[] = [
  { authorId: 'pm',           text: 'Wait... you turned them down?',                                                   delay: 0 },
  { authorId: 'strategist',   text: 'NO WAY',                                                                          delay: 1500 },
  { authorId: 'art-director', text: 'YOU SAID NO TO OMNIPUBDENT???',                                                   delay: 3000 },
  { authorId: 'copywriter',   text: '🔥🔥🔥',                                                                            delay: 4000 },
  { authorId: 'suit',         text: 'Holy shit. HOLY SHIT.',                                                           delay: 5000 },
  { authorId: 'media',        text: "I've been waiting 15 years to see someone do that.",                              delay: 7000 },
  { authorId: 'technologist', text: 'Do you know how much money you just turned down?',                                delay: 9000 },
  { authorId: 'pm',           text: '...Jordan.',                                                                      delay: 10500 },
  { authorId: 'technologist', text: '...',                                                                             delay: 11500 },
  { authorId: 'technologist', text: 'Yeah okay that was pretty badass.',                                               delay: 12500 },
  { authorId: 'strategist',   text: 'WE STAY INDEPENDENT',                                                            delay: 14000 },
  { authorId: 'art-director', text: 'WE STAY INDEPENDENT',                                                            delay: 14500 },
  { authorId: 'copywriter',   text: 'WE STAY INDEPENDENT',                                                            delay: 15000 },
  { authorId: 'media',        text: 'WE STAY INDEPENDENT',                                                            delay: 15500 },
  { authorId: 'pm',           text: 'WE STAY INDEPENDENT',                                                            delay: 16000 },
  { authorId: 'technologist', text: 'WE STAY INDEPENDENT',                                                            delay: 16500 },
  { authorId: 'suit',         text: 'WE STAY INDEPENDENT',                                                            delay: 17000 },
  { authorId: 'strategist',   text: 'This is why I came to work here.',                                               delay: 19000 },
  { authorId: 'pm',           text: 'This is why we ALL came to work here.',                                          delay: 21000 },
  { authorId: 'art-director', text: "Let's go win another fucking Lion.",                                             delay: 23000 },
  { authorId: 'copywriter',   text: '🦁🦁🦁',                                                                          delay: 24500 },
  { authorId: 'media',        text: "Drinks are on me tonight. All of you.",                                          delay: 26000 },
  { authorId: 'suit',         text: 'I love this team so much right now',                                             delay: 28000 },
  { authorId: 'strategist',   text: "Alright alright. Back to work. We've got a reputation to live up to now. 💪",   delay: 30000 },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface EndingContextValue {
  acquisitionState: AcquisitionState;
  campaignsAtRejection: number;
  isEnding: boolean;
  endingType: EndingType | null;
  currentPhase: EndingPhase | null;
  checkForEnding: (awardId: string, completedCount: number, reputation: number) => void;
  checkForHostileTakeover: (completedCount: number) => void;
  triggerEndingSequence: (type: EndingType) => void;
  sendAcquisitionOffer: () => void;
  handleAcquisitionAccept: () => void;
  handleAcquisitionReject: (completedCount: number) => void;
  handleHostileTakeoverAccept: () => void;
  advancePhase: () => void;
}

const EndingContext = createContext<EndingContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function EndingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(endingReducer, initialState);
  const { addEmail } = useEmailContext();
  const { addMessage, setMorale } = useChatContext();
  const { unlockAchievement } = useAchievementContext();
  const { addNotification } = useWindowContext();
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const addChatMessage = useCallback((authorId: string, text: string) => {
    addMessage({
      id: `ending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'general',
      authorId,
      text,
      timestamp: Date.now(),
      reactions: [],
      isRead: false,
    });
  }, [addMessage]);

  const sendDelayedMessages = useCallback((messages: ChatMsg[]) => {
    messages.forEach(({ authorId, text, delay }) => {
      const timer = setTimeout(() => {
        addChatMessage(authorId, text);
        timersRef.current.delete(timer);
      }, delay);
      timersRef.current.add(timer);
    });
  }, [addChatMessage]);

  const checkForEnding = useCallback((awardId: string, completedCount: number, reputation: number) => {
    if (state.acquisitionState !== 'none') return;

    const isCannesLion = awardId === 'cannes';
    if (isCannesLion && completedCount >= 5 && reputation >= 80) {
      const timer = setTimeout(() => {
        addEmail(createAcquisitionEmail());
        dispatch({ type: 'SET_ACQUISITION_STATE', payload: 'email_sent' });
        timersRef.current.delete(timer);
      }, 10000);
      timersRef.current.add(timer);
    }
  }, [state.acquisitionState, addEmail]);

  const checkForHostileTakeover = useCallback((completedCount: number) => {
    if (state.acquisitionState !== 'hostile_pending') return;
    if (completedCount > state.campaignsAtRejection) {
      // Hostile takeover fires after 5 seconds (let campaign celebration finish)
      const timer = setTimeout(() => {
        addEmail(createHostileTakeoverEmail());
        dispatch({ type: 'SET_ACQUISITION_STATE', payload: 'hostile_email_sent' });
        timersRef.current.delete(timer);
      }, 5000);
      timersRef.current.add(timer);
    }
  }, [state.acquisitionState, state.campaignsAtRejection, addEmail]);

  const handleAcquisitionAccept = useCallback(() => {
    unlockAchievement('sold-out');
    dispatch({ type: 'START_ENDING', payload: { endingType: 'voluntary' } });
  }, [unlockAchievement]);

  const handleAcquisitionReject = useCallback((completedCount: number) => {
    unlockAchievement('rejected-acquisition');
    // Send polite rejection response
    const timer = setTimeout(() => {
      addEmail(createRejectionResponseEmail());
      timersRef.current.delete(timer);
    }, 3000);
    timersRef.current.add(timer);

    // Send team celebration messages to real chat
    sendDelayedMessages(REJECTION_CELEBRATION);

    // Max morale after celebration
    const moraleTimer = setTimeout(() => {
      setMorale('high');
      timersRef.current.delete(moraleTimer);
    }, 33000);
    timersRef.current.add(moraleTimer);

    // Deliver mysterious disclosure brief after celebration winds down (~35-40s)
    const disclosureDelay = 35000 + Math.random() * 5000;
    const disclosureTimer = setTimeout(() => {
      addEmail(createDisclosureEmail());
      addNotification(
        '📞 Strange Call',
        'Word got out that you stayed independent. You got a strange call. Check your inbox.'
      );
      timersRef.current.delete(disclosureTimer);
    }, disclosureDelay);
    timersRef.current.add(disclosureTimer);

    dispatch({ type: 'SET_CAMPAIGNS_AT_REJECTION', payload: completedCount });
    dispatch({ type: 'SET_ACQUISITION_STATE', payload: 'hostile_pending' });
  }, [addEmail, sendDelayedMessages, setMorale, unlockAchievement, addNotification]);

  const handleHostileTakeoverAccept = useCallback(() => {
    unlockAchievement('hostile-takeover');
    dispatch({ type: 'START_ENDING', payload: { endingType: 'hostile' } });
  }, [unlockAchievement]);

  const triggerEndingSequence = useCallback((type: EndingType) => {
    dispatch({ type: 'START_ENDING', payload: { endingType: type } });
  }, []);

  // Bypass the normal conditions — sends acquisition email immediately (used by cheats)
  const sendAcquisitionOffer = useCallback(() => {
    if (state.acquisitionState !== 'none') return;
    addEmail(createAcquisitionEmail());
    dispatch({ type: 'SET_ACQUISITION_STATE', payload: 'email_sent' });
  }, [state.acquisitionState, addEmail]);

  const advancePhase = useCallback(() => {
    dispatch({ type: 'ADVANCE_PHASE' });
  }, []);

  // Compute current phase
  const phases = state.endingType ? PHASE_SEQUENCES[state.endingType] : [];
  const currentPhase: EndingPhase | null =
    state.isEnding && state.currentPhaseIndex < phases.length
      ? phases[state.currentPhaseIndex]
      : null;

  return (
    <EndingContext.Provider value={{
      acquisitionState: state.acquisitionState,
      campaignsAtRejection: state.campaignsAtRejection,
      isEnding: state.isEnding,
      endingType: state.endingType,
      currentPhase,
      checkForEnding,
      checkForHostileTakeover,
      triggerEndingSequence,
      sendAcquisitionOffer,
      handleAcquisitionAccept,
      handleAcquisitionReject,
      handleHostileTakeoverAccept,
      advancePhase,
    }}>
      {children}
    </EndingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEndingContext(): EndingContextValue {
  const context = useContext(EndingContext);
  if (!context) throw new Error('useEndingContext must be used within EndingProvider');
  return context;
}
