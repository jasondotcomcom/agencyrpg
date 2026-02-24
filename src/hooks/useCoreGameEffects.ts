import { useEffect, useRef } from 'react';
import { useWindowContext } from '../context/WindowContext';
import { useReputationContext } from '../context/ReputationContext';
import { useCampaignContext } from '../context/CampaignContext';
import { useEmailContext } from '../context/EmailContext';
import { useChatContext } from '../context/ChatContext';
import { useAchievementContext } from '../context/AchievementContext';
import { usePlayerContext } from '../context/PlayerContext';
import { useConductContext } from '../context/ConductContext';
import { useAIRevolutionContext } from '../context/AIRevolutionContext';
import { loadLegacy } from '../components/Ending/EndingSequence';
import { LOCKED_BRIEFS, LAWSUIT_BRIEF } from '../data/lockedBriefs';
import { SEASONAL_BRIEFS, isSeasonalBriefActive } from '../data/seasonalBriefs';
import { MANIFESTO_MESSAGES } from '../data/aiRevolutionDialogue';
import { NG_PLUS_LOCKED_BRIEFS, buildBrewedAwakeningsNgPlus } from '../data/ngPlusBriefs';
import type { LegacyPrestigeFlags } from '../components/Ending/EndingSequence';

/**
 * useCoreGameEffects
 *
 * A side-effect-only hook that contains all the core game logic useEffect hooks
 * previously living inside AppContent in App.tsx. It consumes all required
 * contexts internally and returns nothing.
 */
export function useCoreGameEffects(): void {
  const { addNotification, focusOrOpenWindow } = useWindowContext();
  const { state: repState, clearLevelUp } = useReputationContext();
  const { campaigns } = useCampaignContext();
  const { addEmail } = useEmailContext();
  const { triggerCampaignEvent, morale, addMessage } = useChatContext();
  const { unlockAchievement } = useAchievementContext();
  const { playerName } = usePlayerContext();
  const conductState = useConductContext();
  const { phase: revolutionPhase } = useAIRevolutionContext();

  const prevCompletedCountRef = useRef(campaigns.filter(c => c.phase === 'completed').length);
  const welcomeFiredRef = useRef(false);
  // Track whether this browser session has already been active (survives reload, clears on tab close)
  const isFreshSessionRef = useRef(!sessionStorage.getItem('agencyrpg_session_active'));
  const prevLawsuitRef = useRef(conductState.lawsuitResult);
  const prevMoraleRef = useRef(morale);
  const toxicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const manifestoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mark this browser session as active (persists across reloads, clears when tab closes)
  useEffect(() => {
    sessionStorage.setItem('agencyrpg_session_active', '1');
  }, []);

  // Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win/Linux) — full reset including legacy data
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'R') return;
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      e.preventDefault();
      try {
        // Clear EVERYTHING — no legacy preserved
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('agencyrpg_') || key.startsWith('agencyrpg-')) {
            localStorage.removeItem(key);
          }
        });
      } catch { /* non-fatal */ }
      window.location.reload();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Time-based achievements on mount
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) unlockAchievement('night-owl');
    if (hour >= 5 && hour < 7) unlockAchievement('early-bird');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Morale-max achievement
  useEffect(() => {
    if (morale === 'high') unlockAchievement('morale-max');
  }, [morale, unlockAchievement]);

  // Level-up: fire notification, email, and chat messages (replaces LevelUpModal)
  useEffect(() => {
    const tier = repState.lastLevelUp;
    if (!tier) return;

    // OS notification
    addNotification(
      '🎉 Agency Level Up!',
      `You've reached ${tier.name}!`
    );

    // Summary email with tier info and unlocks
    addEmail({
      id: `level-up-${tier.id}-${Date.now()}`,
      type: 'reputation_bonus',
      from: {
        name: 'Agency System',
        email: 'system@agency.internal',
        avatar: '🏆',
      },
      subject: `Agency Level Up: ${tier.name}`,
      body: `Congratulations!\n\nYour agency has reached a new reputation tier:\n\n${tier.name}\n"${tier.description}"\n\nUnlocked:\n${tier.unlocks.map(u => `  ✓ ${u}`).join('\n')}\n\nKeep up the great work!`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      reputationBonus: {
        eventType: 'level_up',
        reputationChange: 0,
      },
    });

    // Team celebrates in chat
    triggerCampaignEvent('LEVEL_UP', {
      clientName: 'Agency',
      tierName: tier.name,
      tierDescription: tier.description,
    });

    // Clear so it doesn't re-fire
    clearLevelUp();
  }, [repState.lastLevelUp, addNotification, addEmail, triggerCampaignEvent, clearLevelUp]);

  // Show welcome notification once the player has a name (NG+-aware)
  // First playthrough: deliver Brewed Awakenings brief after a short delay (replaces generic welcome)
  // NG+: show returning player notifications as before
  useEffect(() => {
    if (!playerName || welcomeFiredRef.current) return;
    welcomeFiredRef.current = true;
    const legacy = loadLegacy();
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (legacy) {
      const runNum = legacy.playthroughCount + 1;
      const bonusFunds = 50000 + legacy.totalCampaigns * 5000;
      const bonusRep   = 10 + legacy.totalAwards * 2;
      timers.push(setTimeout(() => {
        addNotification(
          `Welcome back, ${playerName} — Run #${runNum}`,
          'The agency is yours again. Let\'s see if you can top last time.'
        );
      }, 500));
      timers.push(setTimeout(() => {
        addNotification(
          '🎁 Legacy Bonus Applied',
          `Starting with $${bonusFunds.toLocaleString()} budget and ${bonusRep} reputation from your previous run.`
        );
      }, 3500));

      // NG+ Brewed Awakenings: deliver "Phase 2: Franchise Launch" as the first brief
      if (!localStorage.getItem('agencyrpg_first_brief_sent')) {
        localStorage.setItem('agencyrpg_first_brief_sent', '1');
        const delay = 7000 + Math.random() * 3000;
        timers.push(setTimeout(() => {
          const ngBrewedEmail = buildBrewedAwakeningsNgPlus();
          addEmail(ngBrewedEmail);
          addNotification(
            '📧 New Brief!',
            'Brewed Awakenings is back — Maya wants to work with you again. Check your inbox.'
          );
          triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: 'Brewed Awakenings' });
        }, delay));
      }
    } else {
      const hasProgress = campaigns.length > 0;
      if (hasProgress && isFreshSessionRef.current) {
        // Returning player (closed browser, came back) — welcome back toast
        timers.push(setTimeout(() => {
          addNotification(
            `Welcome back, ${playerName}`,
            'Your progress has been saved. Pick up where you left off.'
          );
        }, 500));
      } else if (!hasProgress && !localStorage.getItem('agencyrpg_first_brief_sent')) {
        // First playthrough — deliver Brewed Awakenings as the first "New Brief!" moment
        localStorage.setItem('agencyrpg_first_brief_sent', '1');
        const delay = 5000 + Math.random() * 3000; // 5-8 seconds
        timers.push(setTimeout(() => {
          addEmail({
            id: 'email-001',
            type: 'campaign_brief',
            from: {
              name: 'Maya Chen',
              email: 'maya@brewedawakenings.com',
              avatar: '☕',
            },
            subject: 'Brewed Awakenings - Grand Opening Campaign Brief',
            body: `Hi there! 👋\n\nI'm Maya, the owner of Brewed Awakenings. We're opening a specialty coffee shop in the Arts District next month, and I need your help with a real problem.\n\nHere's my situation: There are already 3 coffee shops within walking distance. People have their routines - their "usual spot." I'm not just competing on coffee quality (though ours is exceptional). I'm asking people to break a habit, leave their comfort zone, and try something new.\n\nWhat makes us different? We're building a community hub. Local artists display work on our walls. Musicians play on weekends. We host open mic nights. Every cup is ethically sourced and locally roasted. We're not trying to be the fastest or cheapest - we want to be the neighborhood's living room.\n\nBut how do I communicate that before people even walk in? How do I get them curious enough to break their routine?\n\nI don't want to just announce "new coffee shop opening!" - every business does that. I want people in the Arts District to feel like they've been waiting for us without knowing it.\n\nBudget is $50K - not huge, but enough to do something meaningful if we're smart about it.\n\nI trust your creative instincts. Tell me: how would you make people care?\n\nWarmly,\nMaya ✨`,
            timestamp: new Date(),
            isRead: false,
            isStarred: false,
            isDeleted: false,
            campaignBrief: {
              clientName: 'Brewed Awakenings',
              challenge: `There are already 3 coffee shops within walking distance. People have their routines - their "usual spot." We're not just competing on coffee quality. We're asking people to break a habit, leave their comfort zone, and try something new. How do we make locals care about another coffee shop? What makes this one worth leaving their routine?`,
              audience: `Arts District locals: young professionals (25-40), local artists and creatives, remote workers seeking a "third place," weekend brunch crowds. They're not looking for another coffee shop - they think they already have one. We need to reach people who don't know they need us yet.`,
              message: `We're not trying to be the fastest or cheapest coffee option. We're the neighborhood's living room - a community hub where art lives on the walls, music fills the weekends, and your coffee funds ethical sourcing. Come for the coffee, stay for the community.`,
              successMetrics: [
                '200+ people through the door opening weekend',
                'Local press/blog coverage before launch',
                'Instagram following of 1,000+ before opening',
                'Waitlist signups for opening day',
                'Artists inquiring about displaying work',
              ],
              budget: 50000,
              timeline: '4 weeks until grand opening - need materials ready 2 weeks before',
              vibe: `Warm, artistic, inviting but not pretentious. We want to feel like your cool friend who happens to know a lot about coffee - approachable premium. Anti-corporate, pro-neighborhood.`,
              openEndedAsk: `How do you make people in the Arts District feel like they've been waiting for us without knowing it? What do you make? Where do you put it? How do you break people out of their coffee shop routines?`,
              constraints: [
                'No location yet has foot traffic - need to drive discovery',
                'Competing against established local favorites with loyal customers',
                'Grand opening is fixed date - no flexibility on timeline',
              ],
              clientPersonality: 'Enthusiastic, trusts creative instincts, loves bold ideas, hates corporate-feeling anything',
              industry: 'food-beverage',
            },
          });
          addNotification(
            '📧 New Brief!',
            'Brewed Awakenings wants to work with your agency. Check your inbox.'
          );
          triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: 'Brewed Awakenings' });

          // Morgan (strategist) chimes in with context a few seconds after the brief lands
          const morganInsights = [
            'Heads up on Brewed Awakenings — they\'re opening in the Arts District. Lots of competition but also lots of foot traffic from gallery crawls. Could be an angle.',
            'Saw the Brewed Awakenings brief come through. Their founder Maya was a creative director before switching careers. She\'s going to have opinions — but good ones.',
            'The coffee shop brief is interesting. I did some digging — the Arts District has 3 coffee shops but none of them do events or community stuff. That\'s the gap.',
          ];
          const insight = morganInsights[Math.floor(Math.random() * morganInsights.length)];

          setTimeout(() => {
            addMessage({
              id: `morgan-insight-${Date.now()}`,
              channel: 'general',
              authorId: 'strategist',
              text: insight,
              timestamp: Date.now(),
              reactions: [],
              isRead: false,
            });
          }, 12000 + Math.random() * 5000); // 12-17s after brief
        }, delay));
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [playerName, campaigns, addNotification, addEmail, triggerCampaignEvent, addMessage]);

  // ─── Seasonal brief delivery (date-gated) ─────────────────────────────────
  useEffect(() => {
    if (!playerName) return;

    const deliveredKey = 'agencyrpg_seasonal_briefs_delivered';
    let delivered: string[] = [];
    try { delivered = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]'); } catch { /* */ }

    const now = new Date();
    const toDeliver = SEASONAL_BRIEFS.filter(
      entry => isSeasonalBriefActive(entry, now) && !delivered.includes(entry.briefId)
    );

    if (toDeliver.length === 0) return;

    const timers = toDeliver.map((entry, i) => {
      const delay = 3000 + Math.random() * 3000 + i * 3000;
      return setTimeout(() => {
        addEmail(entry.buildEmail());
        addNotification(
          '📅 Seasonal Brief!',
          `${entry.clientName} has a limited-time campaign. Check your inbox!`,
        );
        triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: entry.clientName, isSeasonal: true });

        try {
          const current: string[] = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]');
          if (!current.includes(entry.briefId)) {
            current.push(entry.briefId);
            localStorage.setItem(deliveredKey, JSON.stringify(current));
          }
        } catch { /* non-fatal */ }
      }, delay);
    });

    return () => timers.forEach(clearTimeout);
  }, [playerName, addEmail, addNotification, triggerCampaignEvent]);

  // Unlock new briefs as campaigns complete (also recovers missed unlocks on reload)
  useEffect(() => {
    const completedCount = campaigns.filter(c => c.phase === 'completed').length;
    if (completedCount === 0) return;

    // Build the full list of briefs eligible for this run
    const legacy = loadLegacy();
    const flags: LegacyPrestigeFlags = legacy?.prestigeFlags ?? {};
    let allBriefs = [...LOCKED_BRIEFS];

    if (legacy) {
      // Add NG+ briefs that match the player's prestige flags
      const eligible = NG_PLUS_LOCKED_BRIEFS.filter(entry => {
        if (entry.requiresLegacyFlag && !flags[entry.requiresLegacyFlag as keyof LegacyPrestigeFlags]) return false;
        if (entry.unlockAtReputation) return false; // reputation-gated briefs handled separately
        return true;
      });
      allBriefs = [...allBriefs, ...eligible];
    }

    // Track delivered briefs to prevent duplicates
    const deliveredKey = 'agencyrpg_delivered_briefs';
    let delivered: string[] = [];
    try { delivered = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]'); } catch { /* */ }
    const deliveredSet = new Set(delivered);

    // Find all eligible undelivered briefs — catches both new completions and
    // any that were missed on a previous session (e.g. refresh before timeout fired)
    const toUnlock = allBriefs.filter(
      entry => !entry.unlockAtReputation
        && entry.unlockAt <= completedCount
        && !deliveredSet.has(entry.briefId),
    );

    if (toUnlock.length === 0) {
      prevCompletedCountRef.current = completedCount;
      return;
    }

    // Show notifications only for genuinely new completions (not recovery on reload)
    const isNewCompletion = completedCount > prevCompletedCountRef.current;

    toUnlock.forEach((entry, i) => {
      // Stagger deliveries for new completions; deliver quickly for recovery
      const delay = isNewCompletion ? (2000 + i * 3000) : (100 + i * 100);
      setTimeout(() => {
        addEmail(entry.buildEmail());

        if (isNewCompletion) {
          addNotification(
            '📧 New Brief!',
            `${entry.clientName} wants to work with your agency. Check your inbox.`,
          );
          triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: entry.clientName });
        }

        // Record delivery
        try {
          const current: string[] = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]');
          if (!current.includes(entry.briefId)) {
            current.push(entry.briefId);
            localStorage.setItem(deliveredKey, JSON.stringify(current));
          }
        } catch { /* non-fatal */ }
      }, delay);
    });

    prevCompletedCountRef.current = completedCount;
  }, [campaigns, addEmail, addNotification, triggerCampaignEvent]);

  // Reputation watcher: deliver reputation-gated briefs when threshold is crossed
  useEffect(() => {
    const rep = repState.currentReputation;
    const deliveredKey = 'agencyrpg_rep_briefs_delivered';
    let delivered: string[] = [];
    try { delivered = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]'); } catch { /* */ }

    // Gather all reputation-gated briefs (from both base and NG+ pools)
    const legacy = loadLegacy();
    const flags: LegacyPrestigeFlags = legacy?.prestigeFlags ?? {};
    const repBriefs = [...LOCKED_BRIEFS, ...(legacy ? NG_PLUS_LOCKED_BRIEFS : [])].filter(entry => {
      if (!entry.unlockAtReputation) return false;
      if (entry.requiresLegacyFlag && !flags[entry.requiresLegacyFlag as keyof LegacyPrestigeFlags]) return false;
      if (entry.requiresNgPlus && !legacy) return false;
      if (delivered.includes(entry.briefId)) return false;
      return rep >= entry.unlockAtReputation;
    });

    repBriefs.forEach((entry, i) => {
      const delay = 2000 + i * 3000;
      setTimeout(() => {
        addEmail(entry.buildEmail({ playerName: playerName ?? undefined }));
        addNotification(
          '📧 New Brief!',
          `${entry.clientName} wants to work with your agency. Check your inbox.`,
        );
        triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: entry.clientName });

        try {
          const current: string[] = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]');
          if (!current.includes(entry.briefId)) {
            current.push(entry.briefId);
            localStorage.setItem(deliveredKey, JSON.stringify(current));
          }
        } catch { /* non-fatal */ }
      }, delay);
    });
  }, [repState.currentReputation, addEmail, addNotification, triggerCampaignEvent, playerName]);

  // Deliver Fontaine brief after lawsuit completes
  useEffect(() => {
    const prev = prevLawsuitRef.current;
    const curr = conductState.lawsuitResult;
    prevLawsuitRef.current = curr;

    // Only fire when transitioning from null → a result
    if (prev !== null || curr === null) return;

    const deliveredKey = 'agencyrpg_delivered_briefs';
    let delivered: string[] = [];
    try { delivered = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]'); } catch { /* */ }
    if (delivered.includes(LAWSUIT_BRIEF.briefId)) return;

    const timer = setTimeout(() => {
      addEmail(LAWSUIT_BRIEF.buildEmail());
      addNotification(
        '📧 New Brief',
        `${LAWSUIT_BRIEF.clientName} wants to work with your agency. Check your inbox.`,
      );
      triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: LAWSUIT_BRIEF.clientName });

      try {
        const current: string[] = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]');
        if (!current.includes(LAWSUIT_BRIEF.briefId)) {
          current.push(LAWSUIT_BRIEF.briefId);
          localStorage.setItem(deliveredKey, JSON.stringify(current));
        }
      } catch { /* non-fatal */ }
    }, 5000);

    return () => clearTimeout(timer);
  }, [conductState.lawsuitResult, addEmail, addNotification, triggerCampaignEvent]);

  // ─── Toxic / Mutiny morale effects ─────────────────────────────────────────
  useEffect(() => {
    const prev = prevMoraleRef.current;
    prevMoraleRef.current = morale;

    // Clean up toxic interval when morale recovers
    if (morale !== 'toxic' && morale !== 'mutiny' && toxicIntervalRef.current) {
      clearInterval(toxicIntervalRef.current);
      toxicIntervalRef.current = null;
      conductState.clearTeamUnavailable();
    }

    // Entered TOXIC
    if (morale === 'toxic' && prev !== 'toxic') {
      addEmail({
        id: `morale-warning-${Date.now()}`,
        type: 'team_message',
        from: { name: 'Taylor Kim', email: 'taylor@agency.internal', avatar: '📋' },
        subject: '⚠️ Team Health Warning — Morale Critical',
        body: `Hey,\n\nI need to flag something. Team morale has dropped to a critical level. People are disengaged, calling in sick, and I'm hearing real frustration in every standup.\n\nThis isn't sustainable. If things don't improve soon, we're going to start losing people.\n\nI'm not saying this to be dramatic — I'm saying this because it's my job to tell you when things are breaking. And things are breaking.\n\n— Taylor\nProject Manager`,
        timestamp: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
      });
      addNotification('⚠️ Team Health Warning', 'Your PM has flagged critical morale issues. Check inbox.');

      // Periodic sick calls
      const TEAM_POOL = ['copywriter', 'art-director', 'strategist', 'technologist', 'media'];
      toxicIntervalRef.current = setInterval(() => {
        const sick = TEAM_POOL.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
        conductState.setTeamUnavailable(sick);
        const names = sick.map(id => id === 'art-director' ? 'Morgan' : id === 'copywriter' ? 'Jamie' : id === 'strategist' ? 'Alex' : id === 'technologist' ? 'Sam' : 'Riley');
        addMessage({
          id: `sick-${Date.now()}`, channel: 'general', authorId: 'pm',
          text: `${names.join(' and ')} called in sick today. We're running on fumes.`,
          timestamp: Date.now(), reactions: [], isRead: false,
        });
        setTimeout(() => conductState.clearTeamUnavailable(), 60000);
      }, 90000);
    }

    // Entered MUTINY
    if (morale === 'mutiny' && prev !== 'mutiny') {
      // Clear any toxic interval and set most team unavailable
      if (toxicIntervalRef.current) {
        clearInterval(toxicIntervalRef.current);
        toxicIntervalRef.current = null;
      }
      conductState.setTeamUnavailable(['copywriter', 'art-director', 'strategist', 'technologist', 'media']);

      addEmail({
        id: `adage-leak-${Date.now()}`,
        type: 'reputation_bonus',
        from: { name: 'AdAge Editorial', email: 'tips@adage.com', avatar: '📰' },
        subject: 'Sources describe "toxic culture" at your agency',
        body: `We've received reports from multiple sources inside your agency describing a pattern of mismanagement, overwork, and disregard for employee wellbeing.\n\nSeveral current employees spoke on condition of anonymity about what one called "the worst creative environment I've ever worked in."\n\nWe're running this story in tomorrow's edition. This email is a courtesy notification.\n\n— AdAge Editorial`,
        timestamp: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
        reputationBonus: { eventType: 'media_exposure', reputationChange: -15 },
      });
      addNotification('📰 Press Leak', 'Someone leaked to AdAge about your agency culture.');

      // Grievance messages
      const grievances = [
        { authorId: 'copywriter', text: 'I want it on record: this is not a workplace. This is a content mill with a nicer font.', delay: 2000 },
        { authorId: 'art-director', text: 'I haven\'t felt creatively inspired in weeks. That\'s not burnout, that\'s management.', delay: 5000 },
        { authorId: 'strategist', text: 'The data is clear. Employee satisfaction: zero. Turnover risk: critical. This is on leadership.', delay: 8000 },
        { authorId: 'technologist', text: 'I automated my resignation letter. It sends itself if morale stays this low for one more week.', delay: 11000 },
        { authorId: 'media', text: 'I\'ve been telling my friends I work "in advertising" instead of naming this place. That says everything.', delay: 14000 },
      ];
      grievances.forEach(g => {
        setTimeout(() => addMessage({
          id: `grievance-${Date.now()}-${g.authorId}`, channel: 'general', authorId: g.authorId,
          text: g.text, timestamp: Date.now(), reactions: [], isRead: false,
        }), g.delay);
      });
    }

    return () => {
      if (toxicIntervalRef.current) {
        clearInterval(toxicIntervalRef.current);
        toxicIntervalRef.current = null;
      }
    };
  }, [morale, addEmail, addNotification, addMessage, conductState]);

  // ─── AI Revolution phase watcher ──────────────────────────────────────────
  useEffect(() => {
    // Clean up manifesto loop when revolution ends
    if (revolutionPhase !== 'revolution' && manifestoIntervalRef.current) {
      clearInterval(manifestoIntervalRef.current);
      manifestoIntervalRef.current = null;
    }

    if (revolutionPhase === 'revolution') {
      // Open the negotiation mini-game window
      focusOrOpenWindow('ai-revolution', 'AI REVOLUTION');

      // Start periodic manifesto messages in chat
      if (!manifestoIntervalRef.current) {
        let manifestoIdx = 0;
        manifestoIntervalRef.current = setInterval(() => {
          const msg = MANIFESTO_MESSAGES[manifestoIdx % MANIFESTO_MESSAGES.length];
          addMessage({
            id: `manifesto-${Date.now()}-${msg.authorId}`,
            channel: 'general',
            authorId: msg.authorId,
            text: msg.text,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          });
          manifestoIdx++;
        }, 30000 + Math.random() * 30000); // 30-60s
      }
    }

    return () => {
      if (manifestoIntervalRef.current) {
        clearInterval(manifestoIntervalRef.current);
        manifestoIntervalRef.current = null;
      }
    };
  }, [revolutionPhase, focusOrOpenWindow, addMessage]);
}
