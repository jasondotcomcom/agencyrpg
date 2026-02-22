import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TeamMember } from '../../types/campaign';
import type { GamePhase, WaitPhase, GameDef, MechanicCategory, GameResultMeta } from './types';
import { ALL_GAMES } from './allGames';
import { useSettingsContext } from '../../context/SettingsContext';
import { useAchievementContext } from '../../context/AchievementContext';
import styles from './MicroGames.module.css';

// ─── Props ──────────────────────────────────────────────────────────────────

interface MicroGamesProps {
  phase: WaitPhase;
  members: TeamMember[];
  progress: { current: number; total: number } | null;
  isComplete: boolean;
  onSeeResults?: () => void;
}

// ─── Game Picker (category-aware, no back-to-back same category) ────────────

function pickNextGame(
  phase: WaitPhase,
  recentIds: Set<string>,
  lastCategory: MechanicCategory | null,
): GameDef {
  const phaseMatch = (g: GameDef) => g.waitPhase === phase || g.waitPhase === 'both';

  // Best: different category AND not recently played
  let pool = ALL_GAMES.filter(g =>
    phaseMatch(g) && !recentIds.has(g.id) && g.category !== lastCategory
  );

  // Fallback 1: allow same category but not recently played
  if (pool.length === 0) {
    pool = ALL_GAMES.filter(g => phaseMatch(g) && !recentIds.has(g.id));
  }

  // Fallback 2: allow everything for this phase
  if (pool.length === 0) {
    pool = ALL_GAMES.filter(g => phaseMatch(g));
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MicroGames({
  phase, members, progress, isComplete, onSeeResults,
}: MicroGamesProps): React.ReactElement {
  const { settings } = useSettingsContext();
  const { extendedTimers, skipMiniGames } = settings.accessibility;
  const { unlockAchievement, incrementCounter, resetCounter, getCounter } = useAchievementContext();

  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [currentGame, setCurrentGame] = useState<GameDef | null>(null);
  const [gameMember, setGameMember] = useState<TeamMember | null>(null);
  const [score, setScore] = useState({ won: 0, total: 0 });
  const [lastResult, setLastResult] = useState<{ won: boolean; msg: string } | null>(null);
  const [timeFraction, setTimeFraction] = useState(1);
  const [gameKey, setGameKey] = useState(0); // Forces full remount between games
  const recentRef = useRef<Set<string>>(new Set());
  const lastCategoryRef = useRef<MechanicCategory | null>(null);
  const resolvedRef = useRef(false);
  const gameStartTimeRef = useRef(0);

  // Campaign-level stats (reset each campaign/mount)
  const campaignStatsRef = useRef({ wins: 0, fails: 0, totalTime: 0, games: 0 });
  const campaignCheckedRef = useRef(false);

  const pickMember = useCallback(() => {
    return members[Math.floor(Math.random() * members.length)] || {
      id: 'pm', name: 'Taylor', role: 'PM', avatar: '📋',
      specialty: '', description: '', personality: '', voiceStyle: '',
    };
  }, [members]);

  // Pick first game
  useEffect(() => {
    const game = pickNextGame(phase, recentRef.current, null);
    setCurrentGame(game);
    setGameMember(pickMember());
  }, [phase, pickMember]);

  // Ready → Playing transition (0.8s pause)
  useEffect(() => {
    if (gamePhase !== 'ready' || !currentGame) return;
    const timer = setTimeout(() => setGamePhase('playing'), 800);
    return () => clearTimeout(timer);
  }, [gamePhase, currentGame]);

  // Timer during playing
  useEffect(() => {
    if (gamePhase !== 'playing' || !currentGame) return;
    resolvedRef.current = false;
    gameStartTimeRef.current = Date.now();
    const startTime = Date.now();
    const duration = currentGame.duration * (extendedTimers ? 2 : 1);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      setTimeFraction(Math.max(0, remaining / duration));

      if (remaining <= 0 && !resolvedRef.current) {
        clearInterval(interval);
        // Survivor games: surviving the timer = win
        if (currentGame.survivorGame) {
          handleResult(true, { hits: 0 });
        } else {
          handleResult(false);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, currentGame]);

  // ─── Achievement Tracking ─────────────────────────────────────────────

  function trackMiniGameAchievements(
    won: boolean,
    game: GameDef,
    meta?: GameResultMeta,
  ) {
    const category = game.category;
    const elapsedMs = Date.now() - gameStartTimeRef.current;

    // ── Core counters ───────────────────────────────────────────────────
    incrementCounter('mg-total-played');
    const totalPlayed = getCounter('mg-total-played') + 1;

    if (won) {
      incrementCounter('mg-total-wins');
      const totalWins = getCounter('mg-total-wins') + 1;

      // Streak tracking
      const currentStreak = incrementCounter('mg-win-streak');
      resetCounter('mg-fail-streak');
      const bestStreak = getCounter('mg-best-streak');
      if (currentStreak > bestStreak) {
        // Manually set best streak by resetting and re-incrementing
        resetCounter('mg-best-streak');
        for (let i = 0; i < currentStreak; i++) incrementCounter('mg-best-streak');
      }

      // ── Win milestones ──────────────────────────────────────────────
      if (totalWins === 1)  unlockAchievement('first-win');
      if (totalWins >= 10)  unlockAchievement('ten-wins');
      if (totalWins >= 25)  unlockAchievement('twenty-five-wins');
      if (totalWins >= 50)  unlockAchievement('fifty-wins');
      if (totalWins >= 100) unlockAchievement('hundred-wins');

      // ── Streak achievements ─────────────────────────────────────────
      if (currentStreak >= 3)  unlockAchievement('three-streak');
      if (currentStreak >= 5)  unlockAchievement('five-streak');
      if (currentStreak === 7) unlockAchievement('lucky-seven');
      if (currentStreak >= 10) unlockAchievement('ten-streak');

      // Comeback kid: won after 3+ fail streak
      const prevFailStreak = getCounter('mg-fail-streak');
      if (prevFailStreak >= 3) unlockAchievement('comeback-kid');

      // The Natural: first 5 games all wins
      if (totalPlayed <= 5 && totalWins === totalPlayed && totalWins >= 5) {
        unlockAchievement('the-natural');
      }

      // Quick draw: click game won in < 1 second
      if (category === 'click' && elapsedMs < 1000) {
        unlockAchievement('quick-draw');
      }

      // Buzzer beater: won with < 10% time remaining
      if (timeFraction < 0.1) {
        unlockAchievement('buzzer-beater');
      }

      // ── Category-specific wins ────────────────────────────────────────
      if (category === 'avoid') {
        const avoidWins = incrementCounter('mg-avoid-wins');
        if (avoidWins >= 10) unlockAchievement('dodge-master');

        // Perfect (no hits) — survivor games that expire call with hits:0
        if (meta?.hits === 0 || (game.survivorGame && !meta?.hits)) {
          const perfectWins = incrementCounter('mg-avoid-perfect');
          unlockAchievement('pixel-perfect');
          if (perfectWins >= 5) unlockAchievement('untouchable');
        }

        // No-scope: survived the full timer (survivor game that won on timeout)
        if (game.survivorGame) {
          unlockAchievement('no-scope');
        }
      }

      if (category === 'timing' || category === 'flick') {
        const timingWins = incrementCounter('mg-timing-wins');
        if (timingWins >= 10) unlockAchievement('timing-ace');

        // Spin doctor: 5 spin/wheel wins in a row
        const wheelStreak = incrementCounter('mg-wheel-win-streak');
        resetCounter('mg-wheel-fail-streak');
        if (wheelStreak >= 5) unlockAchievement('spin-doctor');

        if (meta?.exactCenter) {
          const centerHits = incrementCounter('mg-timing-center');
          unlockAchievement('bullseye');
          if (centerHits >= 3) unlockAchievement('perfect-timing');
        }
      }

      if (category === 'puzzle' || category === 'physical') {
        const wordWins = incrementCounter('mg-word-wins');
        if (wordWins >= 10) unlockAchievement('word-nerd');

        if (meta?.elapsedMs !== undefined && meta.elapsedMs < 3000) {
          unlockAchievement('speed-reader');
        }

        if (meta?.wrongPicks === 0) {
          unlockAchievement('flawless-puzzler');
        }
      }

      if (category === 'hold') {
        const holdWins = incrementCounter('mg-hold-wins');
        if (holdWins >= 5) unlockAchievement('iron-grip');
      }

      if (category === 'click' || category === 'physical') {
        const clickWins = incrementCounter('mg-click-wins');
        if (clickWins >= 10) unlockAchievement('button-masher');
      }

      // Bubble surgeon: won buzzword game with 0 wrong pops
      if (game.id === 'avoid-buzzwords' && meta?.wrongPicks === 0) {
        unlockAchievement('bubble-surgeon');
      }

    } else {
      // ── Fail path ───────────────────────────────────────────────────
      incrementCounter('mg-total-fails');
      const totalFails = getCounter('mg-total-fails') + 1;

      const failStreak = incrementCounter('mg-fail-streak');
      resetCounter('mg-win-streak');

      if (totalFails === 1)  unlockAchievement('first-fail');
      if (totalFails >= 10)  unlockAchievement('ten-fails');
      if (totalFails >= 25)  unlockAchievement('twenty-five-fails');
      if (totalFails >= 50)  unlockAchievement('fifty-fails');

      if (failStreak >= 3)   unlockAchievement('triple-fail');
      if (failStreak >= 5)   unlockAchievement('five-fail-streak');
      if (failStreak === 7)  unlockAchievement('unlucky-seven');

      // Disaster artist: first 5 games all fails
      const totalWins = getCounter('mg-total-wins');
      if (totalPlayed <= 5 && totalWins === 0 && totalFails >= 5) {
        unlockAchievement('disaster-artist');
      }

      // Instant fail: failed within first second
      if (elapsedMs < 1000) {
        unlockAchievement('instant-fail');
      }

      // Timeout: let timer expire (non-survivor game that ran out)
      if (!game.survivorGame && timeFraction <= 0) {
        incrementCounter('mg-timeouts');
        if (getCounter('mg-timeouts') + 1 >= 5) unlockAchievement('timeout-king');
      }

      // Wheel/spin fail tracking
      if (category === 'timing' || category === 'flick') {
        incrementCounter('mg-wheel-fail-streak');
        resetCounter('mg-wheel-win-streak');

        if (meta?.missMargin !== undefined) {
          if (meta.missMargin < 0.1) {
            const closeFails = incrementCounter('mg-close-fails');
            unlockAchievement('so-close');
            if (closeFails >= 3) unlockAchievement('close-shave');
          }
          if (meta.missMargin > 0.8) {
            unlockAchievement('not-even-close');
          }
        }
      }

      // Avoid game fails — track hits
      if (category === 'avoid') {
        if (meta?.hits) {
          for (let i = 0; i < meta.hits; i++) incrementCounter('mg-total-hits');
          incrementCounter('mg-hit-games');
          const totalHits = getCounter('mg-total-hits') + meta.hits;
          const hitGames = getCounter('mg-hit-games') + 1;
          if (totalHits >= 50) unlockAchievement('punching-bag');
          if (totalHits >= 100) unlockAchievement('scar-tissue');
          if (hitGames >= 10) unlockAchievement('hit-magnet');
        }
      }

      // Wrong answers tracking
      if (meta?.wrongPicks) {
        for (let i = 0; i < meta.wrongPicks; i++) incrementCounter('mg-wrong-answers');
        const totalWrong = getCounter('mg-wrong-answers') + meta.wrongPicks;
        if (totalWrong >= 10) unlockAchievement('wrong-answers-ten');
        if (totalWrong >= 25) unlockAchievement('wrong-answers-twenty-five');
        if (totalWrong >= 50) unlockAchievement('wrong-every-time');
      }

      // Friendly fire: popped a good word
      if (game.id === 'avoid-buzzwords' && meta?.wrongPicks) {
        unlockAchievement('bad-popper');
      }
    }

    // ── Alternator tracking ───────────────────────────────────────────────
    const lastResult = getCounter('mg-last-result');
    const currentResult = won ? 1 : 0;
    if (totalPlayed > 1 && currentResult !== lastResult) {
      const altCount = incrementCounter('mg-alt-count');
      if (altCount >= 6) unlockAchievement('alternator');
    } else {
      resetCounter('mg-alt-count');
      incrementCounter('mg-alt-count'); // start at 1
    }
    // Store last result (0=fail, 1=win)
    resetCounter('mg-last-result');
    if (won) incrementCounter('mg-last-result');

    // Glass cannon: 3 wins then 3 fails
    const failStreakNow = getCounter('mg-fail-streak');
    if (!won && failStreakNow === 3 && getCounter('mg-best-streak') >= 3) {
      unlockAchievement('glass-cannon');
    }

    // ── Total games milestones ──────────────────────────────────────────
    if (totalPlayed >= 50)  unlockAchievement('marathon-runner');
    if (totalPlayed >= 100) unlockAchievement('hundred-games');
    if (totalPlayed >= 200) unlockAchievement('two-hundred-games');
    if (totalPlayed >= 500) unlockAchievement('five-hundred-games');

    // ── Time-of-day ─────────────────────────────────────────────────────
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5)  unlockAchievement('night-gamer');
    if (hour >= 5 && hour < 7)  unlockAchievement('morning-grinder');

    // ── Win rate achievements (after 20+ games) ─────────────────────────
    if (totalPlayed >= 20) {
      const totalWins = getCounter('mg-total-wins');
      const rate = totalWins / totalPlayed;
      if (rate >= 0.45 && rate <= 0.55) unlockAchievement('balanced-player');
      if (rate > 0.8)  unlockAchievement('overachiever');
      if (rate < 0.3)  unlockAchievement('underdog');
    }

    // ── Specialist achievements ─────────────────────────────────────────
    const avoidW = getCounter('mg-avoid-wins');
    const timingW = getCounter('mg-timing-wins');
    const wordW = getCounter('mg-word-wins');
    const holdW = getCounter('mg-hold-wins');
    const clickW = getCounter('mg-click-wins');
    const allCats = [avoidW, timingW, wordW, holdW, clickW];
    const maxCat = Math.max(...allCats);
    if (maxCat >= 5) {
      if (avoidW === maxCat && avoidW > timingW && avoidW > wordW) unlockAchievement('avoid-specialist');
      if (timingW === maxCat && timingW > avoidW && timingW > wordW) unlockAchievement('timing-specialist');
      if (wordW === maxCat && wordW > avoidW && wordW > timingW) unlockAchievement('puzzle-specialist');
    }
    if (avoidW >= 3 && timingW >= 3 && wordW >= 3 && holdW >= 3 && clickW >= 3) {
      unlockAchievement('jack-of-all-trades');
    }

    // ── Campaign stats ──────────────────────────────────────────────────
    campaignStatsRef.current.games += 1;
    campaignStatsRef.current.totalTime += elapsedMs;
    if (won) campaignStatsRef.current.wins += 1;
    else campaignStatsRef.current.fails += 1;
  }

  // ─── Campaign-level achievement checks (on completion) ─────────────────

  function checkCampaignAchievements() {
    if (campaignCheckedRef.current) return;
    campaignCheckedRef.current = true;

    const cs = campaignStatsRef.current;
    if (cs.games === 0) return;

    // Perfectionist: won every game in a campaign
    if (cs.fails === 0 && cs.wins > 0) {
      unlockAchievement('perfectionist-campaign');
      const flawless = incrementCounter('mg-flawless-campaigns');
      if (flawless >= 3) unlockAchievement('flawless-victory');
    }

    // Chaos Agent: failed every game in a campaign
    if (cs.wins === 0 && cs.fails > 0) {
      unlockAchievement('chaos-agent');
    }

    // Speedrunner / Took Your Time
    const avgTime = cs.totalTime / cs.games;
    if (avgTime < 3000 && cs.games >= 3) unlockAchievement('speedrunner');
    if (avgTime > 7000 && cs.games >= 3) unlockAchievement('took-your-time');
  }

  function handleResult(won: boolean, meta?: GameResultMeta) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    const member = gameMember || pickMember();
    const msg = won
      ? currentGame!.winMsg(member)
      : currentGame!.failMsg(member);

    // Track recent games (last 8)
    recentRef.current.add(currentGame!.id);
    if (recentRef.current.size > 8) {
      const first = recentRef.current.values().next().value;
      if (first !== undefined) recentRef.current.delete(first);
    }
    lastCategoryRef.current = currentGame!.category;

    // Track achievements
    trackMiniGameAchievements(won, currentGame!, meta);

    setScore(s => ({ won: s.won + (won ? 1 : 0), total: s.total + 1 }));
    setLastResult({ won, msg });
    setGamePhase('result');

    // Transition after result display (1.3s)
    setTimeout(() => {
      if (isComplete) {
        checkCampaignAchievements();
        setGamePhase('complete');
      } else {
        const next = pickNextGame(phase, recentRef.current, lastCategoryRef.current);
        setCurrentGame(next);
        setGameMember(pickMember());
        setGameKey(k => k + 1); // Force fresh component tree
        setGamePhase('ready');
      }
    }, 1300);
  }

  // Check for completion mid-game
  useEffect(() => {
    if (isComplete && gamePhase === 'ready') {
      checkCampaignAchievements();
      setTimeout(() => setGamePhase('complete'), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, gamePhase]);

  const handleWin = useCallback((meta?: GameResultMeta) => handleResult(true, meta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGame, gameMember]);
  const handleFail = useCallback((meta?: GameResultMeta) => handleResult(false, meta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGame, gameMember]);

  // Memoize the rendered game element so render() is called once per game,
  // not on every 50ms timer tick. Prevents random values (targetAngle, shuffled
  // items, etc.) from re-generating each render and breaking game state.
  const gameElement = useMemo(
    () => (currentGame && gameMember ? currentGame.render(handleWin, handleFail, gameMember) : null),
    // gameKey increments on every game transition; handleWin/handleFail change with currentGame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameKey, handleWin, handleFail],
  );

  const progressPct = progress
    ? (progress.total > 0 ? (progress.current / progress.total) * 100 : 0)
    : 0;

  // ─── Render ───────────────────────────────────────────────────────────

  // Skip Mini-Games: show a passive wait screen instead of games
  if (skipMiniGames) {
    if (isComplete) {
      // Reuse the complete screen without a score remark
      return (
        <div className={styles.container}>
          <div className={styles.completeScreen}>
            <div className={styles.completeEmoji}>🎉</div>
            <div className={styles.completeTitle}>
              {phase === 'concepting' ? 'CONCEPTS READY!' : 'Production Complete!'}
            </div>
            <div className={styles.completeActions}>
              <button className={styles.primaryButton} onClick={onSeeResults}>
                {phase === 'concepting' ? 'See Concepts' : 'Review Work'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.container}>
        <div className={styles.readyScreen}>
          <div className={styles.readySubtext}>Team is working on it...</div>
          {progress && (
            <div className={styles.progressFooter}>
              <div className={styles.progressMini}>
                <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.progressMiniLabel}>{progress.current}/{progress.total}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gamePhase === 'complete') {
    const remark = score.total === 0 ? '' :
      score.won / score.total >= 0.8 ? 'Great help! The team appreciated your input.' :
      score.won / score.total >= 0.5 ? 'Solid contributions - concepts coming together.' :
      'Nice work helping out, boss.';

    return (
      <div className={styles.container}>
        <div className={styles.completeScreen}>
          <div className={styles.completeEmoji}>🎉</div>
          <div className={styles.completeTitle}>
            {phase === 'concepting' ? "CONCEPTS READY!" : "Production Complete!"}
          </div>
          {score.total > 0 && (
            <div className={styles.completeScore}>
              {remark}
            </div>
          )}
          <div className={styles.completeActions}>
            <button className={styles.primaryButton} onClick={onSeeResults}>
              {phase === 'concepting' ? 'See Concepts' : 'Review Work'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'result' && lastResult) {
    return (
      <div className={styles.container}>
        <div className={styles.resultScreen}>
          <div className={`${styles.resultIcon} ${lastResult.won ? styles.win : styles.lose}`}>
            {lastResult.won ? '✅' : '❌'}
          </div>
          <div className={styles.resultText}>
            {lastResult.won ? 'Nice work!' : 'Oops!'}
          </div>
          <div className={styles.resultMessage}>{lastResult.msg}</div>
        </div>
        {(progress || score.total > 0) && (
          <div className={styles.progressFooter}>
            {progress && (
              <>
                <div className={styles.progressMini}>
                  <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressMiniLabel}>
                  {progress.current}/{progress.total}
                </span>
              </>
            )}
            <span className={styles.scoreDisplay}>
              Score: {score.won}/{score.total}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === 'ready' && currentGame) {
    return (
      <div className={styles.container}>
        <div className={styles.readyScreen}>
          <div className={styles.readySubtext}>Get ready...</div>
          <div className={styles.readyInstruction}>{currentGame.instruction}</div>
        </div>
        {(progress || score.total > 0) && (
          <div className={styles.progressFooter}>
            {progress && (
              <>
                <div className={styles.progressMini}>
                  <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressMiniLabel}>
                  {progress.current}/{progress.total}
                </span>
              </>
            )}
            <span className={styles.scoreDisplay}>
              Score: {score.won}/{score.total}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === 'playing' && currentGame && gameMember) {
    return (
      <div className={styles.container}>
        <div className={styles.gameArea}>
          <div className={styles.timerBar}>
            <div
              className={`${styles.timerFill} ${timeFraction < 0.25 ? styles.urgent : ''}`}
              style={{ width: `${timeFraction * 100}%` }}
            />
          </div>
          <div key={`game-${currentGame.id}-${gameKey}`} style={{ width: '100%' }}>
            {gameElement}
          </div>
        </div>
        {(progress || score.total > 0) && (
          <div className={styles.progressFooter}>
            {progress && (
              <>
                <div className={styles.progressMini}>
                  <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressMiniLabel}>
                  {progress.current}/{progress.total}
                </span>
              </>
            )}
            <span className={styles.scoreDisplay}>
              Score: {score.won}/{score.total}
            </span>
          </div>
        )}
      </div>
    );
  }

  return <div className={styles.container} />;
}
