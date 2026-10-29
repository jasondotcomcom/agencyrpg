// ─── LayoffsContext ───────────────────────────────────────────────────────────
// Runs the layoffs storyline: AI3.0 pitches, the all-hands vote, Headcount
// Slots cuts, the neglect plotline, OmniPubDent interest, the Solo Shop ending
// and the Webby voting emails. State lives in utils/layoffsStore so non-React
// code (chat filter, team roster, AI prompts) can read it too.

import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import type { Email } from '../types/email';
import type { ChannelId } from '../types/chat';
import { useEmailContext } from './EmailContext';
import { useChatContext } from './ChatContext';
import { useWindowContext } from './WindowContext';
import { useAgencyFunds } from './AgencyFundsContext';
import { useAchievementContext } from './AchievementContext';
import { usePlayerContext } from './PlayerContext';
import { useCampaignContext } from './CampaignContext';
import { useEndingContext } from './EndingContext';
import {
  CORE_ROLES, currentMargin, everyoneCut, getLayoffsState, getNeglectStage,
  humansLeft, updateLayoffs, useLayoffs, type LayoffsState,
} from '../utils/layoffsStore';
import {
  AFTERMATH_LINES, AI3_BONUSES, AI3_SENDER, FIRST_NAMES, GOODBYES, NEGLECT_STAGE_ANNOUNCE,
  NEW_TAGLINE, NOTICE_LINES, OVERRIDE_REACTIONS, VOTE_INTRO, VOTE_LINES, VOTE_RESULT,
  WEBBY_VOTING_WINDOW, WELCOME_BACK_LINE, buildAI3Pitch, buildOmniInterest, buildWebbyEmail,
} from '../data/layoffsDialogue';

const MAX_PITCHES = 6;
const PITCH_START_AT = 3; // completed campaigns before AI3.0 finds you
const WEBBY_MIN_CAMPAIGNS = 3;
const SOLO_BRIEF_ID = 'lay-brewed-social';

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function baseEmail(partial: Pick<Email, 'id' | 'type' | 'from' | 'subject' | 'body'> & Partial<Email>): Email {
  return {
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    ...partial,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface LayoffsContextValue {
  layoffs: LayoffsState;
  startTrial: () => void;
  overrideVote: () => void;
  /** Cut someone. Returns false if they were already gone. */
  streamline: (id: string, payout: number) => boolean;
  /** Pay out a non-cut spin (consolation chip or an all-AI win). */
  payoutSpin: (amount: number, label: string) => void;
}

const LayoffsContext = createContext<LayoffsContextValue | null>(null);

export function LayoffsProvider({ children }: { children: React.ReactNode }) {
  const layoffs = useLayoffs();
  const { addEmail } = useEmailContext();
  const { addMessage } = useChatContext();
  const { addNotification, focusOrOpenWindow } = useWindowContext();
  const { addProfit } = useAgencyFunds();
  const { unlockAchievement } = useAchievementContext();
  const { playerName, agencyName } = usePlayerContext();
  const { campaigns } = useCampaignContext();
  const { triggerEndingSequence, isEnding } = useEndingContext();
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => { timersRef.current.delete(t); fn(); }, ms);
    timersRef.current.add(t);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  }, []);

  /** Post a chat message. scripted=true bypasses the neglect filter (but cut people still can't post). */
  const post = useCallback((authorId: string, text: string, channel: ChannelId = 'general', scripted = true) => {
    addMessage({
      id: `${scripted ? 'lay-' : 'layn-'}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel,
      authorId,
      text,
      timestamp: Date.now(),
      reactions: [],
      isRead: false,
    });
  }, [addMessage]);

  const completed = campaigns.filter(c => c.phase === 'completed');
  const completedCount = completed.length;
  const name = playerName ?? 'Founder';

  // ─── AI3.0 pitches: one per completed campaign after the 3rd ──────────────
  useEffect(() => {
    const st = getLayoffsState(); // read live, not the render snapshot
    if (!playerName || st.overridden) return;
    if (completedCount < PITCH_START_AT) return;
    if (st.ai3EmailsSent >= MAX_PITCHES) return;
    if (st.ai3EmailsSent > 0 && completedCount <= st.ai3LastEmailAtCount) return;

    const index = st.ai3EmailsSent;
    // Reserve the slot now so a re-render can't double-send
    updateLayoffs({ ai3EmailsSent: index + 1, ai3LastEmailAtCount: completedCount });
    later(() => {
      const { subject, body } = buildAI3Pitch(index, name, agencyName);
      addEmail(baseEmail({
        id: `lay-ai3-pitch-${index}-${Date.now()}`,
        type: 'vendor_pitch',
        from: AI3_SENDER,
        subject,
        body,
      }));
      if (index === 0) addNotification('📧 New Email', 'Someone from AI3.0 wants to chat.');
    }, rand(15000, 30000));
  }, [playerName, completedCount, layoffs.overridden, layoffs.ai3EmailsSent, layoffs.ai3LastEmailAtCount, name, agencyName, addEmail, addNotification, later]);

  // Dev-only playtest shortcut. In the browser console on `npm run dev`:
  //   __layoffsTest()  → AI3.0's first pitch lands in the inbox right now,
  // skipping the 3 completed campaigns. Not included in production builds.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__layoffsTest = () => {
      const st = getLayoffsState();
      const index = Math.min(st.ai3EmailsSent, MAX_PITCHES - 1);
      updateLayoffs({ ai3EmailsSent: index + 1, ai3LastEmailAtCount: completedCount });
      const { subject, body } = buildAI3Pitch(index, name, agencyName);
      addEmail(baseEmail({ id: `lay-ai3-pitch-${index}-${Date.now()}`, type: 'vendor_pitch', from: AI3_SENDER, subject, body }));
      addNotification('📧 New Email', 'Someone from AI3.0 wants to chat.');
      return 'AI3.0 pitch sent';
    };
    return () => { delete w.__layoffsTest; };
  }, [completedCount, name, agencyName, addEmail, addNotification]);

  const finishOverride = useCallback((wasOverride: boolean) => {
    const s = getLayoffsState();
    if (s.overridden) return;
    const bonus = AI3_BONUSES[Math.max(0, Math.min(s.ai3EmailsSent - 1, AI3_BONUSES.length - 1))];
    updateLayoffs({ overridden: true });
    if (bonus > 0) {
      addProfit('ai3-signing-bonus', 'AI3.0 Signing Bonus', bonus);
    }
    addNotification('🎰 AI3.0 Trial Active', `${bonus > 0 ? `$${bonus.toLocaleString()} signing bonus deposited. ` : ''}Headcount Slots is in your Start Menu.`);
    if (wasOverride) {
      unlockAchievement('vote-override');
      OVERRIDE_REACTIONS.forEach(r => later(() => post(r.authorId, r.text), r.delay));
    }
    later(() => focusOrOpenWindow('headcount-slots', 'Headcount Slots'), 3000);
  }, [addProfit, addNotification, unlockAchievement, later, post, focusOrOpenWindow]);

  // ─── All-hands vote ───────────────────────────────────────────────────────
  // The tally is fixed by the roster (absorbed people vote yes), so a vote cut
  // off by a reload can be settled straight away on the next load.
  const resolveVote = useCallback(() => {
    if (getLayoffsState().voteHeld) return;
    const { host, yes, no } = tallyVote();
    if (host) post(host, yes > no ? `That's ${yes} yes. Vote passes. Huh.` : VOTE_RESULT(no));
    updateLayoffs({ voteHeld: true });
    if (yes > no) {
      // Nothing to override. That's worse.
      finishOverride(false);
    } else {
      addNotification('🗳️ Vote failed', `${yes}–${no}. As founder, you can override it. Check the AI3.0 email.`);
    }
  }, [post, finishOverride, addNotification]);

  const startTrial = useCallback(() => {
    const s = getLayoffsState();
    if (s.trialStarted) return;
    updateLayoffs({ trialStarted: true });
    focusOrOpenWindow('chat', 'Chat');

    const { voters, host } = tallyVote();
    let delay = 1500;
    if (host) later(() => post(host, VOTE_INTRO(name)), delay);

    voters.forEach(id => {
      delay += rand(1800, 3200);
      // The people who already replaced themselves vote yes.
      const absorbed = getNeglectStage(id) >= 2;
      const text = absorbed ? '👍 Great question! AI3.0 can help us scale.' : VOTE_LINES[id] ?? '👎';
      later(() => post(id, text), delay);
    });

    later(resolveVote, delay + 2500);
  }, [focusOrOpenWindow, later, post, name, resolveVote]);

  // A vote that was mid-flight when the page reloaded: settle it now.
  useEffect(() => {
    const s = getLayoffsState();
    if (s.trialStarted && !s.voteHeld) later(resolveVote, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const overrideVote = useCallback(() => finishOverride(true), [finishOverride]);

  // ─── Cuts ─────────────────────────────────────────────────────────────────
  const streamline = useCallback((id: string, payout: number) => {
    const s = getLayoffsState();
    if (s.cut.includes(id)) return false;
    const first = FIRST_NAMES[id] ?? 'them';

    // Goodbye posts while they still work here, then they're gone.
    post(id, GOODBYES[id] ?? 'Bye, everyone.');
    const cut = [...s.cut, id];
    updateLayoffs({
      cut,
      streak: s.streak + 1,
      totalPayout: s.totalPayout + payout,
      neglect: { ...s.neglect, [id]: 0 },
    });
    addProfit(`layoff-${id}-${Date.now()}`, `Streamlined: ${first}`, payout);

    if (cut.length === 1) unlockAchievement('tough-decisions');
    if (cut.length === CORE_ROLES.length) unlockAchievement('solo-shop');

    // Someone notices.
    const remaining = humansLeft();
    if (remaining.length > 0) {
      const who = pick(remaining);
      later(() => post(who, pick(AFTERMATH_LINES).replace(/\{name\}/g, first)), rand(8000, 15000));
    }

    // OmniPubDent notices too. They never mention it.
    later(() => {
      const { subject, body } = buildOmniInterest(cut.length, currentMargin(cut.length), agencyName);
      addEmail(baseEmail({
        id: `lay-omni-${cut.length}-${Date.now()}`,
        type: 'acquisition_interest',
        from: { name: 'Theodore Pemberton IV', email: 'tpemberton@omnipubdent.groupe', avatar: '🏢' },
        subject,
        body,
      }));
      updateLayoffs(st => ({ omniOffersSent: st.omniOffersSent + 1 }));
    }, rand(25000, 45000));

    // Last one out: the only work left is small.
    if (cut.length === CORE_ROLES.length) {
      later(() => {
        addEmail(buildSoloShopBrief());
        addNotification('📧 New Brief', 'Brewed Awakenings has a small ask.');
      }, rand(20000, 30000));
    }
    return true;
  }, [post, addProfit, unlockAchievement, later, agencyName, addEmail, addNotification]);

  const payoutSpin = useCallback((amount: number, label: string) => {
    updateLayoffs(st => ({ streak: 0, totalPayout: st.totalPayout + amount }));
    if (amount > 0) addProfit(`slots-${Date.now()}`, label, amount);
  }, [addProfit]);

  // ─── Neglect + Solo Shop: run once per completed campaign ─────────────────
  useEffect(() => {
    const s = getLayoffsState();
    // Existing saves: don't count campaigns finished before this system existed.
    if (!s.neglectInit) {
      updateLayoffs({ neglectInit: true, processedCampaigns: completed.map(c => c.id) });
      return;
    }
    const fresh = completed.filter(c => !s.processedCampaigns.includes(c.id));
    if (fresh.length === 0) return;

    const neglect = { ...s.neglect };
    const stages = { ...s.neglectStage };
    const announcements: Array<() => void> = [];

    for (const c of fresh) {
      const team = c.conceptingTeam?.memberIds ?? [];
      for (const id of CORE_ROLES) {
        if (s.cut.includes(id)) continue;
        if (team.includes(id)) {
          if ((stages[id] ?? 0) >= 2) {
            announcements.push(() => { post(id, WELCOME_BACK_LINE); unlockAchievement('welcome-back'); });
          }
          neglect[id] = 0;
          stages[id] = 0;
        } else {
          neglect[id] = (neglect[id] ?? 0) + 1;
        }
      }
    }

    updateLayoffs({ neglect, neglectStage: stages, processedCampaigns: [...s.processedCampaigns, ...fresh.map(c => c.id)] });

    // Announce newly reached stages (reads the updated store)
    for (const id of CORE_ROLES) {
      if (s.cut.includes(id)) continue;
      const stage = getNeglectStage(id);
      if (stage > (stages[id] ?? 0)) {
        const announce = NEGLECT_STAGE_ANNOUNCE[stage]?.(id);
        if (announce) announcements.push(() => post(id, announce.text, announce.channel));
        if (stage === 3) {
          const others = humansLeft().filter(o => o !== id && getNeglectStage(o) < 2);
          if (others.length > 0) {
            const who = pick(others);
            const first = FIRST_NAMES[id];
            announcements.push(() => post(who, pick(NOTICE_LINES).replace(/\{name\}/g, first)));
          }
        }
        stages[id] = stage;
      }
    }
    updateLayoffs({ neglectStage: stages });
    announcements.forEach((fn, i) => later(fn, 12000 + i * rand(5000, 9000)));

    // Solo Shop: a campaign finished with nobody left
    if (everyoneCut() && !s.soloShopTriggered && !isEnding) {
      updateLayoffs({ soloShopTriggered: true });
      later(() => triggerEndingSequence('solo_shop'), 12000);
    }
  }, [completedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tagline: changes after the first cut ─────────────────────────────────
  useEffect(() => {
    if (layoffs.cut.length > 0) document.title = `Agency RPG — ${NEW_TAGLINE}`;
  }, [layoffs.cut.length]);

  // ─── Webby voting emails (date-gated to the real People's Voice window) ───
  const hasActiveCampaign = campaigns.some(c => c.phase !== 'completed');
  useEffect(() => {
    if (!playerName) return;
    const check = () => {
      const s = getLayoffsState();
      const now = new Date();
      const forced = (() => { try { return localStorage.getItem('agencyrpg_webby_force') === '1'; } catch { return false; } })();
      const start = new Date(`${WEBBY_VOTING_WINDOW.start}T00:00:00`);
      const end = new Date(`${WEBBY_VOTING_WINDOW.end}T23:59:59`);
      const inWindow = forced || (now >= start && now <= end);
      if (!inWindow || completedCount < WEBBY_MIN_CAMPAIGNS || !hasActiveCampaign) return;

      const year = WEBBY_VOTING_WINDOW.start.slice(0, 4);
      const firstKey = `${year}-first`;
      const finalKey = `${year}-final`;
      const sendWebby = (isFinal: boolean) => {
        const humans = humansLeft();
        const teamCount = humans.length + 1; // + you
        const senderId = humans.includes('pm') ? 'pm' : humans.includes('suit') ? 'suit' : humans[0];
        const from = senderId
          ? { name: senderLabel(senderId), email: `${senderId}@agency.internal`, avatar: '📣' }
          : { name: name, email: 'you@agency.internal', avatar: '📣' };
        const { subject, body } = buildWebbyEmail(teamCount, agencyName, isFinal);
        addEmail(baseEmail({ id: `lay-webby-${isFinal ? 'final' : 'first'}-${Date.now()}`, type: 'team_message', from, subject, body }));
      };

      if (!s.webbySent.includes(firstKey)) {
        updateLayoffs({ webbySent: [...s.webbySent, firstKey], webbyFirstAt: Date.now() });
        sendWebby(false);
      } else if (!s.webbySent.includes(finalKey) && Date.now() - s.webbyFirstAt >= 3 * 86400000) {
        updateLayoffs({ webbySent: [...s.webbySent, finalKey] });
        sendWebby(true);
      }
    };
    const first = setTimeout(check, rand(20000, 60000));
    const interval = setInterval(check, 5 * 60000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [playerName, completedCount, hasActiveCampaign, agencyName, name, addEmail]);

  return (
    <LayoffsContext.Provider value={{ layoffs, startTrial, overrideVote, streamline, payoutSpin }}>
      {children}
    </LayoffsContext.Provider>
  );
}

export function useLayoffsContext(): LayoffsContextValue {
  const ctx = useContext(LayoffsContext);
  if (!ctx) throw new Error('useLayoffsContext must be used within LayoffsProvider');
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tallyVote() {
  const voters = humansLeft();
  const yes = voters.filter(id => getNeglectStage(id) >= 2).length;
  return { voters, host: voters.includes('pm') ? 'pm' : voters[0], yes, no: voters.length - yes };
}

const FULL_NAMES: Record<string, string> = {
  copywriter: 'Jamie Chen', 'art-director': 'Morgan Reyes', strategist: 'Alex Park',
  technologist: 'Sam Okonkwo', suit: 'Jordan Blake', media: 'Riley Torres', pm: 'Taylor Kim',
};

function senderLabel(id: string): string {
  return FULL_NAMES[id] ?? 'The Team';
}

function buildSoloShopBrief(): Email {
  return baseEmail({
    id: SOLO_BRIEF_ID,
    type: 'campaign_brief',
    from: { name: 'Maya Chen', email: 'maya@brewedawakenings.com', avatar: '☕' },
    subject: 'Brewed Awakenings - a few Instagram posts?',
    body: `Hi!\n\nMaya from Brewed Awakenings. It's been a while!\n\nNothing big this time. We just need a few Instagram posts for the new seasonal latte. Small budget, quick turnaround.\n\nI heard you've streamlined things over there, so I figured this would be easy for you guys.\n\nThanks!\nMaya ☕`,
    campaignBrief: {
      clientName: 'Brewed Awakenings',
      challenge: 'Announce the new seasonal latte on Instagram. That is the whole job.',
      audience: 'People who already follow the coffee shop on Instagram.',
      message: 'There is a new seasonal latte. It is available now.',
      successMetrics: ['Posts go up on time', 'Nobody complains'],
      budget: 30000,
      timeline: '1 week',
      vibe: 'On-brand. Fine. Whatever you think.',
      openEndedAsk: 'Can you make a few posts?',
      constraints: ['Instagram only', 'Small budget'],
      clientPersonality: 'Friendly, busy, expects this to be quick now',
      industry: 'food-beverage',
    },
  });
}
