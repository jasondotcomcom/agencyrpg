import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useConductContext } from '../../../context/ConductContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { LAWSUIT_CHAT_DISTRACTIONS } from '../../../data/conductEvents';
import styles from './LawsuitApp.module.css';

// ─── Item Types ──────────────────────────────────────────────────────────────

interface ItemDef {
  type: string;
  emoji: string;
  speed: number;      // multiplier
  points: number;
  missPoints: number;  // penalty if missed
  isSettlement: boolean;
  isMomText: boolean;
  minPhase: number;    // 0, 1, or 2
}

const ITEM_DEFS: ItemDef[] = [
  { type: 'subpoena',    emoji: '📄', speed: 1.0, points: 10,  missPoints: 0,   isSettlement: false, isMomText: false, minPhase: 0 },
  { type: 'deposition',  emoji: '📋', speed: 1.0, points: 10,  missPoints: 0,   isSettlement: false, isMomText: false, minPhase: 0 },
  { type: 'business',    emoji: '💼', speed: 0.7, points: 5,   missPoints: 0,   isSettlement: false, isMomText: false, minPhase: 0 },
  { type: 'evidence',    emoji: '📁', speed: 1.4, points: 15,  missPoints: 0,   isSettlement: false, isMomText: false, minPhase: 1 },
  { type: 'microphone',  emoji: '🎤', speed: 1.4, points: 20,  missPoints: 0,   isSettlement: false, isMomText: false, minPhase: 1 },
  { type: 'camera',      emoji: '📸', speed: 1.8, points: 25,  missPoints: 0,   isSettlement: false, isMomText: false, minPhase: 2 },
  { type: 'momtext',     emoji: '📱', speed: 0.7, points: 5,   missPoints: -50, isSettlement: false, isMomText: true,  minPhase: 1 },
  { type: 'settlement',  emoji: '💰', speed: 0.5, points: 0,   missPoints: 0,   isSettlement: true,  isMomText: false, minPhase: 1 },
];

// ─── Game Item ───────────────────────────────────────────────────────────────

interface GameItem {
  id: number;
  def: ItemDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  side: 'left' | 'right';
  active: boolean;
  batted: boolean;
  bx: number;  // batted velocity
  by: number;
}

// ─── Game State ──────────────────────────────────────────────────────────────

interface GameState {
  phase: 'start' | 'playing' | 'won' | 'lost' | 'settled';
  startTime: number;
  elapsed: number;
  score: number;
  misses: number;
  totalBatted: number;
  items: GameItem[];
  leftSwing: number;   // frames remaining
  rightSwing: number;
  nextItemId: number;
  spawnCooldown: number;
  settlementSpawned: boolean;
  chatIndex: number;
  chatCooldown: number;
}

const MAX_MISSES = 5;
const GAME_DURATION = 90;
const SWING_FRAMES = 12;

// ─── Component ───────────────────────────────────────────────────────────────

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
    totalBatted: 0,
    items: [],
    leftSwing: 0,
    rightSwing: 0,
    nextItemId: 0,
    spawnCooldown: 0,
    settlementSpawned: false,
    chatIndex: 0,
    chatCooldown: 0,
  });
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [hudState, setHudState] = useState({
    score: 0, misses: 0, elapsed: 0, phase: 'start' as string,
    phaseLabel: '', chatMessages: [] as Array<{ author: string; text: string }>,
  });

  // ── Get game phase (0-30s, 30-60s, 60-90s) ────────────────────────────────

  const getPhase = (elapsed: number): number => {
    if (elapsed < 30) return 0;
    if (elapsed < 60) return 1;
    return 2;
  };

  // ── Spawn an item ──────────────────────────────────────────────────────────

  const spawnItem = useCallback((game: GameState, w: number, h: number) => {
    const phase = getPhase(game.elapsed);
    const available = ITEM_DEFS.filter(d => d.minPhase <= phase);

    // Settlement: only once between 40-70s
    const canSpawnSettlement = !game.settlementSpawned && game.elapsed >= 40 && game.elapsed <= 70;
    const pool = canSpawnSettlement ? available : available.filter(d => !d.isSettlement);

    // Weight settlement lower
    let def: ItemDef;
    if (canSpawnSettlement && Math.random() < 0.08) {
      def = ITEM_DEFS.find(d => d.isSettlement)!;
      game.settlementSpawned = true;
    } else {
      const nonSettlement = pool.filter(d => !d.isSettlement);
      def = nonSettlement[Math.floor(Math.random() * nonSettlement.length)];
    }

    const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    const baseSpeed = (1 + phase * 0.3) * def.speed;

    const item: GameItem = {
      id: game.nextItemId++,
      def,
      x: side === 'left' ? w * 0.1 : w * 0.9,
      y: h - 40,
      vx: (side === 'left' ? 1 : -1) * (1.5 + Math.random()) * baseSpeed,
      vy: -(4 + Math.random() * 2) * baseSpeed,
      side,
      active: true,
      batted: false,
      bx: 0,
      by: 0,
    };

    game.items.push(item);
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────

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

    // ── Check win ──
    if (game.elapsed >= GAME_DURATION) {
      game.phase = 'won';
      setHudState(prev => ({ ...prev, phase: 'won' }));
      completeLawsuit('won');
      unlockAchievement('objection');
      if (game.misses === 0) unlockAchievement('pro-se');
      if (game.totalBatted >= 100) unlockAchievement('legally-battered');
      const plays = incrementCounter('lawsuit-plays');
      if (plays >= 3) unlockAchievement('litigation-hell');
      return;
    }

    // ── Check lose ──
    if (game.misses >= MAX_MISSES) {
      game.phase = 'lost';
      setHudState(prev => ({ ...prev, phase: 'lost' }));
      completeLawsuit('lost');
      const plays = incrementCounter('lawsuit-plays');
      if (plays >= 3) unlockAchievement('litigation-hell');
      return;
    }

    // ── Handle input ──
    const keys = keysRef.current;
    if ((keys.has('a') || keys.has('arrowleft')) && game.leftSwing === 0) {
      game.leftSwing = SWING_FRAMES;
    }
    if ((keys.has('d') || keys.has('arrowright')) && game.rightSwing === 0) {
      game.rightSwing = SWING_FRAMES;
    }

    // ── Spawn items ──
    const phase = getPhase(game.elapsed);
    const spawnRate = phase === 0 ? 90 : phase === 1 ? 55 : 30;
    game.spawnCooldown--;
    if (game.spawnCooldown <= 0) {
      spawnItem(game, w, h);
      game.spawnCooldown = spawnRate + Math.floor(Math.random() * 20);
    }

    // ── Chat distractions ──
    if (phase >= 1) {
      game.chatCooldown--;
      if (game.chatCooldown <= 0 && game.chatIndex < LAWSUIT_CHAT_DISTRACTIONS.length) {
        const distraction = LAWSUIT_CHAT_DISTRACTIONS[game.chatIndex];
        game.chatIndex++;
        game.chatCooldown = 300 + Math.floor(Math.random() * 300);
        setHudState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages.slice(-2), {
            author: distraction.authorId,
            text: distraction.text,
          }],
        }));
      }
    }

    // ── Update items ──
    const gravity = 0.08;
    const deskY = h - 80;
    const deskLeft = w * 0.3;
    const deskRight = w * 0.7;
    const penLeftX = deskLeft + 30;
    const penRightX = deskRight - 30;
    const penY = deskY - 20;
    const hitRadius = 50;

    for (const item of game.items) {
      if (!item.active) continue;

      if (item.batted) {
        item.x += item.bx;
        item.y += item.by;
        item.by += 0.5;
        if (item.y > h + 50 || item.x < -50 || item.x > w + 50) {
          item.active = false;
        }
        continue;
      }

      item.x += item.vx;
      item.y += item.vy;
      item.vy += gravity;

      // Check if bat hits
      const isLeftSwinging = game.leftSwing > SWING_FRAMES / 2;
      const isRightSwinging = game.rightSwing > SWING_FRAMES / 2;

      if (isLeftSwinging) {
        const dx = item.x - penLeftX;
        const dy = item.y - penY;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
          item.batted = true;
          item.bx = -4 - Math.random() * 3;
          item.by = -3 - Math.random() * 2;
          game.score += item.def.points;
          game.totalBatted++;
          if (item.def.isSettlement) {
            game.phase = 'settled';
            setHudState(prev => ({ ...prev, phase: 'settled' }));
            completeLawsuit('settled');
            unlockAchievement('settled-out-of-court');
            const plays = incrementCounter('lawsuit-plays');
            if (plays >= 3) unlockAchievement('litigation-hell');
            return;
          }
        }
      }

      if (isRightSwinging) {
        const dx = item.x - penRightX;
        const dy = item.y - penY;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
          item.batted = true;
          item.bx = 4 + Math.random() * 3;
          item.by = -3 - Math.random() * 2;
          game.score += item.def.points;
          game.totalBatted++;
          if (item.def.isSettlement) {
            game.phase = 'settled';
            setHudState(prev => ({ ...prev, phase: 'settled' }));
            completeLawsuit('settled');
            unlockAchievement('settled-out-of-court');
            const plays = incrementCounter('lawsuit-plays');
            if (plays >= 3) unlockAchievement('litigation-hell');
            return;
          }
        }
      }

      // Miss: item goes past the top or falls back past bottom
      if (item.y < -30 || (item.vy > 0 && item.y > h + 30)) {
        item.active = false;
        game.misses++;
        if (item.def.isMomText) {
          game.score += item.def.missPoints;
        }
      }
    }

    // Cleanup inactive items
    game.items = game.items.filter(i => i.active);

    // Decrement swing frames
    if (game.leftSwing > 0) game.leftSwing--;
    if (game.rightSwing > 0) game.rightSwing--;

    // ── Render ──
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1a1a2e');
    bg.addColorStop(1, '#16213e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Desk
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(deskLeft, deskY, deskRight - deskLeft, 30);
    ctx.fillStyle = '#7a5740';
    ctx.fillRect(deskLeft, deskY, deskRight - deskLeft, 4);

    // Left pen
    ctx.save();
    ctx.translate(penLeftX, penY);
    if (game.leftSwing > 0) {
      const swingAngle = Math.sin((game.leftSwing / SWING_FRAMES) * Math.PI) * -0.8;
      ctx.rotate(swingAngle);
    }
    ctx.fillStyle = '#333';
    ctx.fillRect(-3, -35, 6, 35);
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(-3, -35, 6, 8);
    ctx.restore();

    // Right pen
    ctx.save();
    ctx.translate(penRightX, penY);
    if (game.rightSwing > 0) {
      const swingAngle = Math.sin((game.rightSwing / SWING_FRAMES) * Math.PI) * 0.8;
      ctx.rotate(swingAngle);
    }
    ctx.fillStyle = '#333';
    ctx.fillRect(-3, -35, 6, 35);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(-3, -35, 6, 8);
    ctx.restore();

    // Items
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const item of game.items) {
      if (item.def.isSettlement && item.active && !item.batted) {
        // Glowing effect for settlement
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.fillText(item.def.emoji, item.x, item.y);
        ctx.restore();
      } else {
        ctx.fillText(item.def.emoji, item.x, item.y);
      }
    }

    // Stressed face
    const stressFaces = ['😐', '😟', '😰', '😱', '🤯'];
    const faceIndex = Math.min(game.misses, stressFaces.length - 1);
    ctx.font = '32px serif';
    ctx.fillText(stressFaces[faceIndex], w / 2, deskY - 10);

    // Update HUD
    setHudState(prev => ({
      ...prev,
      score: game.score,
      misses: game.misses,
      elapsed: game.elapsed,
    }));

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnItem, completeLawsuit, unlockAchievement, incrementCounter]);

  // ── Start game ─────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const game = gameRef.current;
    game.phase = 'playing';
    game.startTime = performance.now();
    game.elapsed = 0;
    game.score = 0;
    game.misses = 0;
    game.totalBatted = 0;
    game.items = [];
    game.leftSwing = 0;
    game.rightSwing = 0;
    game.nextItemId = 0;
    game.spawnCooldown = 60;
    game.settlementSpawned = false;
    game.chatIndex = 0;
    game.chatCooldown = 200;
    setHudState({ score: 0, misses: 0, elapsed: 0, phase: 'playing', phaseLabel: '', chatMessages: [] });
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Canvas resize ──────────────────────────────────────────────────────────

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

  // ── Keyboard ───────────────────────────────────────────────────────────────

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

  // ── Cleanup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Phase labels ───────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

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
              <span key={i} className={`${styles.missIcon} ${i < hudState.misses ? 'active' : ''}`}
                style={{ opacity: i < hudState.misses ? 1 : 0.2 }}>
                ⚖️
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
            Legal documents are flying at you. Use your two pens to bat them away before they pile up.
            Survive 90 seconds to win.
          </div>
          <div className={styles.controls}>
            <span className={styles.controlKey}>A</span> / <span className={styles.controlKey}>←</span> Left Pen
            &nbsp;&nbsp;
            <span className={styles.controlKey}>D</span> / <span className={styles.controlKey}>→</span> Right Pen
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
            You survived 90 seconds of legal chaos. The case has been dismissed, but your reputation
            took a hit and legal fees cost $25,000.
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
            Too many documents got through. You lost the lawsuit. $75,000 in damages and legal fees.
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
