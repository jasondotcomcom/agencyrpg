import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useConductContext } from '../../../context/ConductContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { LAWSUIT_CHAT_DISTRACTIONS } from '../../../data/conductEvents';
import styles from './LawsuitApp.module.css';

// ─── Threat Definitions ─────────────────────────────────────────────────────

interface ThreatDef {
  type: string;
  emoji: string;
  points: number;
}

const THREAT_DEFS: ThreatDef[] = [
  { type: 'subpoena',    emoji: '📄', points: 10 },
  { type: 'legal-brief', emoji: '📋', points: 10 },
  { type: 'cease-desist', emoji: '🛑', points: 15 },
  { type: 'evidence',    emoji: '📁', points: 15 },
  { type: 'deposition',  emoji: '📝', points: 20 },
  { type: 'gavel',       emoji: '🔨', points: 25 },
];

const SETTLEMENT_DEF: ThreatDef = { type: 'settlement', emoji: '💰', points: 0 };

// ─── Game Types ─────────────────────────────────────────────────────────────

type PlayerPosition = 'left' | 'right';

interface Threat {
  id: number;
  def: ThreatDef;
  lane: 0 | 1 | 2;           // 0=left, 1=center, 2=right
  /** Timer in frames: counts down from spawnFrames to 0. At 0, resolve hit/miss. */
  timer: number;
  spawnFrames: number;
  state: 'rising' | 'active' | 'smashed' | 'missed';
  smashFrame: number;         // animation countdown after smash
}

interface GameState {
  phase: 'start' | 'playing' | 'won' | 'lost' | 'settled';
  startTime: number;
  elapsed: number;
  score: number;
  misses: number;
  totalSmashed: number;
  threats: Threat[];
  playerPos: PlayerPosition;  // left = covers lanes 0,1  |  right = covers lanes 1,2
  nextId: number;
  spawnCooldown: number;
  settlementSpawned: boolean;
  chatIndex: number;
  chatCooldown: number;
  hammerAnim: [number, number]; // frames remaining for left/right hammer swing animation
}

const MAX_MISSES = 3;
const GAME_DURATION = 90;
const SMASH_ANIM_FRAMES = 15;

// ─── Lane geometry helpers ──────────────────────────────────────────────────

function getLaneX(lane: number, w: number): number {
  const margin = w * 0.15;
  const usable = w - margin * 2;
  return margin + usable * (lane / 2);
}

function coveredLanes(pos: PlayerPosition): [number, number] {
  return pos === 'left' ? [0, 1] : [1, 2];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LawsuitApp(): React.ReactElement {
  const { completeLawsuit } = useConductContext();
  const { unlockAchievement, incrementCounter } = useAchievementContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>({
    phase: 'start',
    startTime: 0,
    elapsed: 0,
    score: 0,
    misses: 0,
    totalSmashed: 0,
    threats: [],
    playerPos: 'left',
    nextId: 0,
    spawnCooldown: 80,
    settlementSpawned: false,
    chatIndex: 0,
    chatCooldown: 200,
    hammerAnim: [0, 0],
  });
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const prevKeysRef = useRef<Set<string>>(new Set());
  const [hudState, setHudState] = useState({
    score: 0, misses: 0, elapsed: 0, phase: 'start' as string,
    chatMessages: [] as Array<{ author: string; text: string }>,
  });

  // ── Spawn a threat ────────────────────────────────────────────────────────

  const spawnThreat = useCallback((game: GameState) => {
    const phase = game.elapsed < 30 ? 0 : game.elapsed < 60 ? 1 : 2;

    // Determine lane — bias toward uncovered lane to create tension
    let lane: 0 | 1 | 2;
    const [c0, c1] = coveredLanes(game.playerPos);
    const uncovered = ([0, 1, 2] as const).find(l => l !== c0 && l !== c1)!;

    if (Math.random() < 0.35) {
      // Threat in uncovered lane — forces a decision
      lane = uncovered as 0 | 1 | 2;
    } else {
      lane = ([0, 1, 2] as const)[Math.floor(Math.random() * 3)];
    }

    // Settlement: one-time appearance between 40-70s
    const canSettlement = !game.settlementSpawned && game.elapsed >= 40 && game.elapsed <= 70;
    let def: ThreatDef;
    if (canSettlement && Math.random() < 0.06) {
      def = SETTLEMENT_DEF;
      game.settlementSpawned = true;
    } else {
      // Pick from available threats (harder ones appear in later phases)
      const maxIndex = phase === 0 ? 3 : phase === 1 ? 5 : THREAT_DEFS.length;
      def = THREAT_DEFS[Math.floor(Math.random() * maxIndex)];
    }

    // Active window (frames the threat is visible before resolving)
    const baseFrames = phase === 0 ? 90 : phase === 1 ? 65 : 45;
    const variance = Math.floor(Math.random() * 20);
    const spawnFrames = baseFrames + variance;

    game.threats.push({
      id: game.nextId++,
      def,
      lane,
      timer: spawnFrames,
      spawnFrames,
      state: 'rising',
      smashFrame: 0,
    });
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const game = gameRef.current;
    if (game.phase !== 'playing') return;

    const w = canvas.width;
    const h = canvas.height;
    const now = performance.now();
    game.elapsed = (now - game.startTime) / 1000;
    const phase = game.elapsed < 30 ? 0 : game.elapsed < 60 ? 1 : 2;

    // ── Win check ──
    if (game.elapsed >= GAME_DURATION) {
      game.phase = 'won';
      setHudState(prev => ({ ...prev, phase: 'won' }));
      completeLawsuit('won');
      unlockAchievement('objection');
      if (game.misses === 0) unlockAchievement('pro-se');
      if (game.totalSmashed >= 100) unlockAchievement('legally-battered');
      const plays = incrementCounter('lawsuit-plays');
      if (plays >= 3) unlockAchievement('litigation-hell');
      return;
    }

    // ── Lose check ──
    if (game.misses >= MAX_MISSES) {
      game.phase = 'lost';
      setHudState(prev => ({ ...prev, phase: 'lost' }));
      completeLawsuit('lost');
      const plays = incrementCounter('lawsuit-plays');
      if (plays >= 3) unlockAchievement('litigation-hell');
      return;
    }

    // ── Handle input (edge-triggered: only on fresh press) ──
    const keys = keysRef.current;
    const prev = prevKeysRef.current;
    const leftPressed = (keys.has('arrowleft') || keys.has('a')) && !(prev.has('arrowleft') || prev.has('a'));
    const rightPressed = (keys.has('arrowright') || keys.has('d')) && !(prev.has('arrowright') || prev.has('d'));
    prevKeysRef.current = new Set(keys);

    if (leftPressed && game.playerPos !== 'left') {
      game.playerPos = 'left';
    } else if (rightPressed && game.playerPos !== 'right') {
      game.playerPos = 'right';
    }

    // ── Spawn threats ──
    const spawnRate = phase === 0 ? 80 : phase === 1 ? 50 : 28;
    game.spawnCooldown--;
    if (game.spawnCooldown <= 0) {
      spawnThreat(game);
      game.spawnCooldown = spawnRate + Math.floor(Math.random() * 25);
    }

    // ── Chat distractions ──
    if (phase >= 1) {
      game.chatCooldown--;
      if (game.chatCooldown <= 0 && game.chatIndex < LAWSUIT_CHAT_DISTRACTIONS.length) {
        const d = LAWSUIT_CHAT_DISTRACTIONS[game.chatIndex];
        game.chatIndex++;
        game.chatCooldown = 300 + Math.floor(Math.random() * 300);
        setHudState(p => ({
          ...p,
          chatMessages: [...p.chatMessages.slice(-2), { author: d.authorId, text: d.text }],
        }));
      }
    }

    // ── Update threats ──
    const [cov0, cov1] = coveredLanes(game.playerPos);

    for (const t of game.threats) {
      if (t.state === 'smashed') {
        t.smashFrame--;
        if (t.smashFrame <= 0) t.state = 'missed'; // reuse 'missed' to mark for cleanup
        continue;
      }
      if (t.state === 'missed') continue;

      // Rising phase (first ~20% of timer) then active
      const risingThreshold = t.spawnFrames * 0.2;
      if (t.timer > t.spawnFrames - risingThreshold) {
        t.state = 'rising';
      } else {
        t.state = 'active';
      }

      t.timer--;

      // Timer expired — resolve
      if (t.timer <= 0) {
        const isCovered = t.lane === cov0 || t.lane === cov1;
        if (isCovered) {
          // Smashed!
          t.state = 'smashed';
          t.smashFrame = SMASH_ANIM_FRAMES;
          game.score += t.def.points;
          game.totalSmashed++;

          // Trigger hammer animation for the arm that's over this lane
          const hammerIdx = t.lane === cov0 ? 0 : 1;
          game.hammerAnim[hammerIdx] = SMASH_ANIM_FRAMES;

          // Settlement catch
          if (t.def.type === 'settlement') {
            game.phase = 'settled';
            setHudState(p => ({ ...p, phase: 'settled' }));
            completeLawsuit('settled');
            unlockAchievement('settled-out-of-court');
            const plays = incrementCounter('lawsuit-plays');
            if (plays >= 3) unlockAchievement('litigation-hell');
            return;
          }
        } else {
          // Missed!
          t.state = 'missed';
          game.misses++;
        }
      }
    }

    // Cleanup resolved threats
    game.threats = game.threats.filter(t => t.state !== 'missed');

    // Decrement hammer animations
    if (game.hammerAnim[0] > 0) game.hammerAnim[0]--;
    if (game.hammerAnim[1] > 0) game.hammerAnim[1]--;

    // ── Render ──
    ctx.clearRect(0, 0, w, h);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1a1a2e');
    bg.addColorStop(1, '#16213e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Lane markers
    const groundY = h * 0.78;
    const holeH = h * 0.12;
    for (let lane = 0; lane < 3; lane++) {
      const lx = getLaneX(lane, w);
      const holeW = w * 0.18;

      // Lane background (dark pit)
      ctx.fillStyle = '#0d0d1a';
      ctx.beginPath();
      ctx.ellipse(lx, groundY, holeW / 2, holeH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lane border
      ctx.strokeStyle = '#333355';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(lx, groundY, holeW / 2, holeH / 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Lane label
      ctx.fillStyle = '#444466';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`LANE ${lane + 1}`, lx, groundY + holeH / 2 + 4);
    }

    // Ground line
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, groundY + holeH / 2 + 2, w, h - groundY);

    // ── Draw threats ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of game.threats) {
      const lx = getLaneX(t.lane, w);

      if (t.state === 'smashed') {
        // Smash animation: flatten + fade
        const progress = 1 - t.smashFrame / SMASH_ANIM_FRAMES;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(lx, groundY - 30);
        ctx.scale(1 + progress * 0.5, 1 - progress * 0.7);
        ctx.font = '32px serif';
        ctx.fillText(t.def.emoji, 0, 0);
        ctx.restore();
        continue;
      }

      // Rising animation: slide up from hole
      const lifeProgress = 1 - t.timer / t.spawnFrames; // 0→1 over lifetime
      const riseProgress = Math.min(1, lifeProgress / 0.2); // 0→1 during first 20%
      const threatY = groundY + 20 - riseProgress * 50;

      // Urgency pulsing as timer runs low
      const urgency = 1 - t.timer / t.spawnFrames;
      const pulse = urgency > 0.6 ? 1 + Math.sin(urgency * 30) * 0.1 : 1;

      ctx.save();
      ctx.translate(lx, threatY);
      ctx.scale(pulse, pulse);

      // Glow for settlement
      if (t.def.type === 'settlement') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15 + Math.sin(game.elapsed * 8) * 5;
      }

      ctx.font = '32px serif';
      ctx.fillText(t.def.emoji, 0, 0);
      ctx.restore();

      // Timer bar under threat
      const barW = 40;
      const barH = 4;
      const barX = lx - barW / 2;
      const barY = threatY + 22;
      const fill = t.timer / t.spawnFrames;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = fill > 0.3 ? '#4a7c59' : '#cc3333';
      ctx.fillRect(barX, barY, barW * fill, barH);
    }

    // ── Draw player character ──
    const playerCenterX = game.playerPos === 'left'
      ? (getLaneX(0, w) + getLaneX(1, w)) / 2
      : (getLaneX(1, w) + getLaneX(2, w)) / 2;
    const playerY = groundY - 70;

    // Body
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑‍⚖️', playerCenterX, playerY);

    // Hammers (gavels) — one per covered lane
    const [lane0, lane1] = coveredLanes(game.playerPos);
    const hammerLanes = [lane0, lane1];
    for (let i = 0; i < 2; i++) {
      const hx = getLaneX(hammerLanes[i], w);
      const hy = groundY - 50;
      const swingActive = game.hammerAnim[i] > 0;
      const swingProgress = swingActive ? game.hammerAnim[i] / SMASH_ANIM_FRAMES : 0;
      const angle = swingActive ? Math.sin(swingProgress * Math.PI) * -0.6 : 0;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(angle);
      ctx.font = '26px serif';
      ctx.fillText('🔨', 0, 0);
      ctx.restore();

      // Draw line connecting character to hammer
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(playerCenterX, playerY + 10);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Coverage indicator — highlight covered lanes
    for (const cl of [cov0, cov1]) {
      const lx = getLaneX(cl, w);
      ctx.fillStyle = 'rgba(74, 124, 89, 0.12)';
      ctx.beginPath();
      ctx.ellipse(lx, groundY, w * 0.1, holeH / 2 + 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update HUD
    setHudState(prev => ({
      ...prev,
      score: game.score,
      misses: game.misses,
      elapsed: game.elapsed,
    }));

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnThreat, completeLawsuit, unlockAchievement, incrementCounter]);

  // ── Start game ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const game = gameRef.current;
    game.phase = 'playing';
    game.startTime = performance.now();
    game.elapsed = 0;
    game.score = 0;
    game.misses = 0;
    game.totalSmashed = 0;
    game.threats = [];
    game.playerPos = 'left';
    game.nextId = 0;
    game.spawnCooldown = 60;
    game.settlementSpawned = false;
    game.chatIndex = 0;
    game.chatCooldown = 200;
    game.hammerAnim = [0, 0];
    prevKeysRef.current = new Set();
    setHudState({ score: 0, misses: 0, elapsed: 0, phase: 'playing', chatMessages: [] });
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Canvas resize ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const handleUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Phase labels ──────────────────────────────────────────────────────────

  const [phaseLabel, setPhaseLabel] = useState('');
  useEffect(() => {
    if (hudState.phase !== 'playing') return;
    const elapsed = hudState.elapsed;
    if (elapsed > 29.5 && elapsed < 31) {
      setPhaseLabel('Phase 2: Discovery');
      setTimeout(() => setPhaseLabel(''), 2000);
    }
    if (elapsed > 59.5 && elapsed < 61) {
      setPhaseLabel('CLOSING ARGUMENTS');
      setTimeout(() => setPhaseLabel(''), 2000);
    }
  }, [hudState.elapsed, hudState.phase]);

  // ── Render ────────────────────────────────────────────────────────────────

  const timerPercent = Math.min(100, (hudState.elapsed / GAME_DURATION) * 100);
  const isDanger = hudState.misses >= MAX_MISSES - 1;

  return (
    <div className={styles.lawsuit}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Timer bar */}
      <div
        className={`${styles.timerBar} ${isDanger ? styles.timerBarDanger : ''}`}
        style={{ width: `${timerPercent}%` }}
      />

      {/* HUD */}
      {hudState.phase === 'playing' && (
        <div className={styles.hud}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreLabel}>Score</div>
            <div className={styles.scoreValue}>{hudState.score}</div>
            <div style={{ fontSize: '0.625rem', color: '#888', marginTop: 4 }}>
              {Math.floor(GAME_DURATION - hudState.elapsed)}s remaining
            </div>
          </div>
          <div className={styles.missesDisplay}>
            {Array.from({ length: MAX_MISSES }).map((_, i) => (
              <span key={i} className={styles.missIcon}
                style={{ opacity: i < hudState.misses ? 1 : 0.2 }}>
                ❌
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Phase label */}
      {phaseLabel && <div className={styles.phaseLabel}>{phaseLabel}</div>}

      {/* Chat distractions */}
      {hudState.chatMessages.length > 0 && hudState.phase === 'playing' && (
        <div className={styles.chatOverlay}>
          {hudState.chatMessages.map((msg, i) => (
            <div key={i} className={styles.chatBubble}>
              <span className={styles.chatAuthor}>{msg.author}:</span> {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Start screen */}
      {hudState.phase === 'start' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>⚖️</div>
          <div className={styles.overlayTitle}>Lawsuit Defense</div>
          <div className={styles.overlayText}>
            Legal threats pop up from 3 lanes. You hold two gavels — one in each hand —
            covering 2 of the 3 lanes at a time. Slide LEFT or RIGHT to choose which
            two lanes to cover. Threats in your lanes get smashed automatically.
            Miss {MAX_MISSES} and you lose. Survive {GAME_DURATION} seconds to win.
          </div>
          <div className={styles.controls}>
            <span className={styles.controlKey}>←</span> Cover lanes 1 &amp; 2
            &nbsp;&nbsp;
            <span className={styles.controlKey}>→</span> Cover lanes 2 &amp; 3
          </div>
          <button className={styles.startButton} onClick={startGame}>
            Begin Defense
          </button>
        </div>
      )}

      {/* Win screen */}
      {hudState.phase === 'won' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>🏆</div>
          <div className={styles.overlayTitle}>Lawsuit Dismissed!</div>
          <div className={styles.overlayText}>
            You survived {GAME_DURATION} seconds of legal chaos. The case has been dismissed,
            but your reputation took a hit and legal fees cost $25,000.
          </div>
          <div className={styles.overlayText}>Final Score: {hudState.score}</div>
        </div>
      )}

      {/* Lose screen */}
      {hudState.phase === 'lost' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>💀</div>
          <div className={styles.overlayTitle}>Lawsuit Lost</div>
          <div className={styles.overlayText}>
            Too many legal threats got through. You lost the lawsuit.
            $75,000 in damages and legal fees.
          </div>
          <div className={styles.overlayText}>Final Score: {hudState.score}</div>
        </div>
      )}

      {/* Settlement screen */}
      {hudState.phase === 'settled' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>💰</div>
          <div className={styles.overlayTitle}>Settled Out of Court</div>
          <div className={styles.overlayText}>
            You caught the settlement offer. Paid $50,000 to make it go away.
            Sometimes the smart move is knowing when to fold.
          </div>
          <div className={styles.overlayText}>Final Score: {hudState.score}</div>
        </div>
      )}
    </div>
  );
}
