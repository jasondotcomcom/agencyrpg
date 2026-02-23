import { useEffect, useRef, useState } from 'react';
import { WindowProvider, useWindowContext } from './context/WindowContext';
import { EmailProvider, useEmailContext } from './context/EmailContext';
import { CampaignProvider, useCampaignContext } from './context/CampaignContext';
import { ChatProvider, useChatContext } from './context/ChatContext';
import { ReputationProvider, useReputationContext } from './context/ReputationContext';
import { useAchievementContext } from './context/AchievementContext';
import { AgencyFundsProvider } from './context/AgencyFundsContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { SettingsProvider } from './context/SettingsContext';
import { EndingProvider } from './context/EndingContext';
import { ConductProvider } from './context/ConductContext';
import { CheatProvider } from './context/CheatContext';
import { AchievementProvider } from './context/AchievementContext';
import { PlayerProvider, usePlayerContext } from './context/PlayerContext';
import { Desktop } from './components/Desktop';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { NotificationContainer } from './components/Notifications';
import LevelUpModal from './components/LevelUp/LevelUpModal';
import EndingSequence, { loadLegacy } from './components/Ending/EndingSequence';
import HRWatcher from './components/HRWatcher/HRWatcher';
import CheatIndicator from './components/CheatIndicator/CheatIndicator';
import OnboardingScreen from './components/Onboarding/OnboardingScreen';
import Screensaver from './components/Screensaver/Screensaver';
import { LOCKED_BRIEFS } from './data/lockedBriefs';
import { NG_PLUS_LOCKED_BRIEFS, buildBrewedAwakeningsNgPlus } from './data/ngPlusBriefs';
import type { LegacyPrestigeFlags } from './components/Ending/EndingSequence';

// ─── Mobile Detection ─────────────────────────────────────────────────────────

function isMobileDevice(): boolean {
  if (window.innerWidth < 768) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function MobileBlock() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Agency RPG', url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard denied */ }
  };

  return (
    <div className="mobile-block">
      <div className="mobile-icon">📱 → 💻</div>
      <h1>Agency RPG is a desktop experience.</h1>
      <p>Like a real creative agency, you'll need a real computer to do the work.</p>
      <p className="mobile-url">
        Visit <strong>AgencyRPG.com</strong> on your laptop or desktop.
      </p>
      <button onClick={handleShare} className={copied ? 'mobile-btn copied' : 'mobile-btn'}>
        {copied ? '✓ Link copied!' : 'Send link to myself'}
      </button>
    </div>
  );
}

// ─── App Content ──────────────────────────────────────────────────────────────

function AppContent() {
  const { addNotification } = useWindowContext();
  const { state: repState, hideLevelUp } = useReputationContext();
  const { campaigns } = useCampaignContext();
  const { addEmail } = useEmailContext();
  const { triggerCampaignEvent, morale, addMessage } = useChatContext();
  const { unlockAchievement } = useAchievementContext();
  const { playerName, setPlayerName, showScreensaver, dismissScreensaver, screensaverName } = usePlayerContext();
  const prevCompletedCountRef = useRef(campaigns.filter(c => c.phase === 'completed').length);
  const welcomeFiredRef = useRef(false);
  // Track whether this browser session has already been active (survives reload, clears on tab close)
  const isFreshSessionRef = useRef(!sessionStorage.getItem('agencyrpg_session_active'));

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

  // Unlock new briefs as campaigns complete
  useEffect(() => {
    const completedCount = campaigns.filter(c => c.phase === 'completed').length;
    if (completedCount <= prevCompletedCountRef.current) return;

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

    const toUnlock = allBriefs.filter(
      entry => !entry.unlockAtReputation
        && entry.unlockAt <= completedCount
        && entry.unlockAt > prevCompletedCountRef.current
        && !deliveredSet.has(entry.briefId),
    );

    toUnlock.forEach((entry, i) => {
      // Stagger deliveries so multiple unlocks feel sequential
      const delay = 2000 + i * 3000;
      setTimeout(() => {
        addEmail(entry.buildEmail());
        addNotification(
          '📧 New Brief!',
          `${entry.clientName} wants to work with your agency. Check your inbox.`,
        );
        triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: entry.clientName });

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

  return (
    <>
      <Desktop />
      {!playerName && showScreensaver ? (
        <Screensaver playerName={screensaverName} onDismiss={dismissScreensaver} />
      ) : !playerName ? (
        <OnboardingScreen onComplete={setPlayerName} />
      ) : (
        <>
          <WindowManager />
          <Taskbar />
      <NotificationContainer />
      {repState.showLevelUp && repState.levelUpTier && (
        <LevelUpModal
          tier={repState.levelUpTier}
          reputation={repState.currentReputation}
          onClose={hideLevelUp}
        />
      )}
      <EndingSequence />
      <HRWatcher />
      <CheatIndicator />
        </>
      )}
    </>
  );
}

function App() {
  if (isMobileDevice()) return <MobileBlock />;

  return (
    <PlayerProvider>
    <SettingsProvider>
      <AchievementProvider>
        <CheatProvider>
          <WindowProvider>
            <EmailProvider>
              <ChatProvider>
                <CampaignProvider>
                  <ReputationProvider>
                    <AgencyFundsProvider>
                      <PortfolioProvider>
                        <EndingProvider>
                          <ConductProvider>
                            <AppContent />
                          </ConductProvider>
                        </EndingProvider>
                      </PortfolioProvider>
                    </AgencyFundsProvider>
                  </ReputationProvider>
                </CampaignProvider>
              </ChatProvider>
            </EmailProvider>
          </WindowProvider>
        </CheatProvider>
      </AchievementProvider>
    </SettingsProvider>
    </PlayerProvider>
  );
}

export default App;
