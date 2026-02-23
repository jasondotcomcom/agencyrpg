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
  { type: 'subpoena',     emoji: '📄', points: 10 },
  { type: 'legal-brief',  emoji: '📋', points: 10 },
  { type: 'cease-desist',  emoji: '🛑', points: 15 },
  { type: 'evidence',     emoji: '📁', points: 15 },
  { type: 'deposition',   emoji: '📝', points: 20 },
  { type: 'gavel',        emoji: '🔨', points: 25 },
];

const SETTLEMENT_DEF: ThreatDef = { type: 'settlement', emoji: '💰', points: 0 };

// ─── Game Constants ─────────────────────────────────────────────────────────

const NUM_LANES = 5;
const MAX_MISSES = 3;
const GAME_DURATION = 90;
const SMASH_ANIM_FRAMES = 12;
const HAMMER_WIND_FRAMES = 4;   // anticipation before strike
const HAMMER_STRIKE_FRAMES = 3; // fast downswing
const HAMMER_FOLLOW_FRAMES = 5; // follow-through
const HAMMER_TOTAL = HAMMER_WIND_FRAMES + HAMMER_STRIKE_FRAMES + HAMMER_FOLLOW_FRAMES;

// ─── Hit Effect Types ───────────────────────────────────────────────────────

const HIT_WORDS = ['POW!', 'WHAM!', 'BANG!', 'SMASH!', 'CRACK!', 'DENIED!', 'OVERRULED!'];

interface HitEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  frame: number;
  maxFrames: number;
  color: string;
}

interface MissEffect {
  id: number;
  lane: number;
  frame: number;
  maxFrames: number;
}

// ─── Game Types ─────────────────────────────────────────────────────────────

type PlayerPosition = 'left' | 'right';

interface Threat {
  id: number;
  def: ThreatDef;
  lane: number;              // 0-4 for 5 lanes
  /** Progress 0→1: travels down the path. At 1.0, resolve hit/miss. */
  progress: number;
  speed: number;             // progress per frame
  state: 'active' | 'smashed' | 'missed';
  smashFrame: number;
}

interface GameState {
  phase: 'start' | 'playing' | 'won' | 'lost' | 'settled';
  startTime: number;
  elapsed: number;
  score: number;
  misses: number;
  totalSmashed: number;
  threats: Threat[];
  playerPos: PlayerPosition;  // left = covers lanes 0,1,2  |  right = covers lanes 2,3,4
  nextId: number;
  spawnCooldown: number;
  settlementSpawned: boolean;
  chatIndex: number;
  chatCooldown: number;
  hammerAnim: [number, number]; // frames remaining for left/right gavel
  hitEffects: HitEffect[];
  missEffects: MissEffect[];
  shakeFrames: number;       // screen shake countdown
  shakeOffset: { x: number; y: number };
  effectId: number;
}

// ─── Lane geometry helpers ──────────────────────────────────────────────────

function getLaneX(lane: number, w: number): number {
  const margin = w * 0.08;
  const usable = w - margin * 2;
  return margin + usable * (lane / (NUM_LANES - 1));
}

function coveredLanes(pos: PlayerPosition): number[] {
  // Each position = 2 gavels (one per hand). Player body doesn't block.
  // Left: gavels cover lanes 0,1 — Right: gavels cover lanes 3,4
  // Lane 2 (center) is the gap — never covered by either position.
  return pos === 'left' ? [0, 1] : [3, 4];
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
    hitEffects: [],
    missEffects: [],
    shakeFrames: 0,
    shakeOffset: { x: 0, y: 0 },
    effectId: 0,
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
    const t = Math.min(game.elapsed / GAME_DURATION, 1); // 0→1 over game

    // Determine lane — bias toward uncovered lanes to create tension
    let lane: number;
    const covered = coveredLanes(game.playerPos);
    const uncoveredLanes = Array.from({ length: NUM_LANES }, (_, i) => i).filter(l => !covered.includes(l));

    if (Math.random() < 0.4 && uncoveredLanes.length > 0) {
      lane = uncoveredLanes[Math.floor(Math.random() * uncoveredLanes.length)];
    } else {
      lane = Math.floor(Math.random() * NUM_LANES);
    }

    // Settlement: one-time appearance between 40-70s
    const canSettlement = !game.settlementSpawned && game.elapsed >= 40 && game.elapsed <= 70;
    let def: ThreatDef;
    if (canSettlement && Math.random() < 0.06) {
      def = SETTLEMENT_DEF;
      game.settlementSpawned = true;
    } else {
      // Gradually introduce harder threats
      const maxIndex = t < 0.25 ? 3 : t < 0.5 ? 5 : THREAT_DEFS.length;
      def = THREAT_DEFS[Math.floor(Math.random() * maxIndex)];
    }

    // Quadratic ease-in: first 20s feel almost too easy, then it tightens
    const ramp = t * t; // slow change early, accelerates late
    const baseSpeed = 0.004 + ramp * 0.022; // 0.004 (~4s travel) → 0.026 (~0.6s travel)
    const variance = baseSpeed * 0.2 * (Math.random() - 0.5);
    const speed = baseSpeed + variance;

    game.threats.push({
      id: game.nextId++,
      def,
      lane,
      progress: 0,
      speed,
      state: 'active',
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
    const t = Math.min(game.elapsed / GAME_DURATION, 1); // 0→1 progression

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

    // ── Handle input (edge-triggered) ──
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

    // ── Spawn threats — slow and deliberate start, frantic finish ──
    // Quadratic ramp: 120 frames (~2s) at start → 15 frames (~0.25s) at end
    const ramp = t * t;
    const spawnInterval = Math.round(120 - ramp * 105);
    game.spawnCooldown--;
    if (game.spawnCooldown <= 0) {
      spawnThreat(game);
      // No double-spawns for first 30s, then ramp 0% → 30%
      if (game.elapsed > 30) {
        const doubleChance = ((game.elapsed - 30) / (GAME_DURATION - 30)) * 0.30;
        if (Math.random() < doubleChance) {
          spawnThreat(game);
        }
      }
      game.spawnCooldown = spawnInterval + Math.floor(Math.random() * Math.max(5, 15 - ramp * 12));
    }

    // ── Chat distractions ──
    if (game.elapsed >= 30) {
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

    // ── Layout: threats travel UP from bottom toward the player at top ──
    const strikeZoneY = h * 0.18;  // player/hammer area (top)
    const spawnZoneY = h * 0.90;   // threats appear here (bottom)
    const pathLen = spawnZoneY - strikeZoneY;

    // ── Update threats ──
    const covered = coveredLanes(game.playerPos);

    for (const thr of game.threats) {
      if (thr.state === 'smashed') {
        thr.smashFrame--;
        if (thr.smashFrame <= 0) thr.state = 'missed'; // mark for cleanup
        continue;
      }
      if (thr.state === 'missed') continue;

      thr.progress += thr.speed;

      // Reached the strike zone — resolve
      if (thr.progress >= 1.0) {
        const isCovered = covered.includes(thr.lane);
        if (isCovered) {
          // Smashed!
          thr.state = 'smashed';
          thr.smashFrame = SMASH_ANIM_FRAMES;
          game.score += thr.def.points;
          game.totalSmashed++;

          // Determine which gavel (0=left hand, 1=right hand)
          const covIdx = covered.indexOf(thr.lane);
          const hammerIdx = Math.min(covIdx, 1);
          game.hammerAnim[hammerIdx] = HAMMER_TOTAL;

          // Hit effect
          const lx = getLaneX(thr.lane, w);
          const hitWord = HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)];
          const colors = ['#ffdd57', '#ff6b6b', '#4ecdc4', '#ff9ff3', '#feca57', '#54a0ff'];
          game.hitEffects.push({
            id: game.effectId++,
            x: lx + (Math.random() - 0.5) * 20,
            y: strikeZoneY + 10,
            text: hitWord,
            frame: 0,
            maxFrames: 30,
            color: colors[Math.floor(Math.random() * colors.length)],
          });

          // Screen shake
          game.shakeFrames = 6;

          // Settlement catch
          if (thr.def.type === 'settlement') {
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
          thr.state = 'missed';
          game.misses++;
          game.missEffects.push({
            id: game.effectId++,
            lane: thr.lane,
            frame: 0,
            maxFrames: 20,
          });
          // Bigger shake on miss
          game.shakeFrames = 10;
        }
      }
    }

    // Cleanup resolved threats
    game.threats = game.threats.filter(thr => thr.state !== 'missed');

    // Update hit effects
    game.hitEffects = game.hitEffects.filter(e => {
      e.frame++;
      return e.frame < e.maxFrames;
    });

    // Update miss effects
    game.missEffects = game.missEffects.filter(e => {
      e.frame++;
      return e.frame < e.maxFrames;
    });

    // Decrement hammer animations
    for (let i = 0; i < 2; i++) {
      if (game.hammerAnim[i] > 0) game.hammerAnim[i]--;
    }

    // Screen shake
    if (game.shakeFrames > 0) {
      game.shakeFrames--;
      const intensity = game.shakeFrames * 1.2;
      game.shakeOffset = {
        x: (Math.random() - 0.5) * intensity * 2,
        y: (Math.random() - 0.5) * intensity * 2,
      };
    } else {
      game.shakeOffset = { x: 0, y: 0 };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── RENDER ──
    // ══════════════════════════════════════════════════════════════════════════

    ctx.save();
    ctx.translate(game.shakeOffset.x, game.shakeOffset.y);
    ctx.clearRect(-10, -10, w + 20, h + 20);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#16213e');
    bg.addColorStop(0.4, '#1a1a2e');
    bg.addColorStop(1, '#0f1923');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // ── Draw lane paths (threats travel UP from bottom to top) ──
    for (let lane = 0; lane < NUM_LANES; lane++) {
      const lx = getLaneX(lane, w);
      const isCov = covered.includes(lane);

      // Path track (dashed line from bottom spawn to top strike zone)
      ctx.strokeStyle = isCov ? 'rgba(74, 124, 89, 0.25)' : 'rgba(100, 60, 60, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(lx, spawnZoneY);
      ctx.lineTo(lx, strikeZoneY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lane gutter
      ctx.fillStyle = isCov ? 'rgba(74, 124, 89, 0.04)' : 'rgba(100, 60, 60, 0.04)';
      ctx.fillRect(lx - 20, strikeZoneY, 40, pathLen);

      // Strike zone indicator at top
      ctx.fillStyle = isCov ? 'rgba(74, 124, 89, 0.15)' : 'rgba(180, 60, 60, 0.08)';
      ctx.beginPath();
      ctx.roundRect(lx - 22, strikeZoneY - 4, 44, 20, 4);
      ctx.fill();

      // Strike zone border
      ctx.strokeStyle = isCov ? 'rgba(74, 124, 89, 0.4)' : 'rgba(180, 60, 60, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lx - 22, strikeZoneY - 4, 44, 20, 4);
      ctx.stroke();

      // Lane number at bottom
      ctx.fillStyle = '#333355';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${lane + 1}`, lx, spawnZoneY + 6);
    }

    // ── Draw threats traveling UP from bottom ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const thr of game.threats) {
      const lx = getLaneX(thr.lane, w);

      if (thr.state === 'smashed') {
        // Disintegration animation: scatter + fade
        const progress = 1 - thr.smashFrame / SMASH_ANIM_FRAMES;
        ctx.save();
        ctx.globalAlpha = 1 - progress * progress;
        ctx.translate(lx, strikeZoneY + 8);
        const fragmentCount = 4;
        for (let f = 0; f < fragmentCount; f++) {
          const angle = (f / fragmentCount) * Math.PI * 2 + progress * 2;
          const dist = progress * 35;
          const fx = Math.cos(angle) * dist;
          const fy = Math.sin(angle) * dist + progress * 15; // scatter downward
          ctx.save();
          ctx.translate(fx, fy);
          ctx.scale(1 - progress * 0.8, 1 - progress * 0.8);
          ctx.font = '14px serif';
          ctx.fillText(thr.def.emoji, 0, 0);
          ctx.restore();
        }
        ctx.restore();
        continue;
      }

      // Position: travels UP from spawnZoneY to strikeZoneY
      const threatY = spawnZoneY - pathLen * thr.progress;

      // Size scales up as it approaches the player
      const approachScale = 0.7 + thr.progress * 0.4;

      // Urgency pulsing when close
      const urgencyPulse = thr.progress > 0.7
        ? 1 + Math.sin(thr.progress * 40) * 0.08 * (thr.progress - 0.7) / 0.3
        : 1;

      // Danger glow on uncovered lane when very close
      if (thr.progress > 0.8 && !covered.includes(thr.lane)) {
        ctx.save();
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 8 + (thr.progress - 0.8) * 40;
        ctx.globalAlpha = 0.3;
        ctx.font = `${Math.round(28 * approachScale)}px serif`;
        ctx.fillText(thr.def.emoji, lx, threatY);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(lx, threatY);
      ctx.scale(approachScale * urgencyPulse, approachScale * urgencyPulse);

      // Settlement glow
      if (thr.def.type === 'settlement') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15 + Math.sin(game.elapsed * 8) * 5;
      }

      ctx.font = '28px serif';
      ctx.fillText(thr.def.emoji, 0, 0);
      ctx.restore();

      // Progress indicator dot
      if (thr.progress < 0.85) {
        ctx.fillStyle = thr.def.type === 'settlement'
          ? 'rgba(255, 215, 0, 0.5)'
          : `rgba(255, 100, 100, ${0.2 + thr.progress * 0.4})`;
        ctx.beginPath();
        ctx.arc(lx, threatY - 18, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Draw miss effects (red flash on lane) ──
    for (const m of game.missEffects) {
      const lx = getLaneX(m.lane, w);
      const progress = m.frame / m.maxFrames;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.4;
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(lx - 24, strikeZoneY, 48, pathLen + 10);
      ctx.restore();

      // "MISS" text
      if (m.frame < 15) {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MISS!', lx, strikeZoneY + 30 + m.frame * 1.5);
        ctx.restore();
      }
    }

    // ── Draw player character (above the gavel line, between the two gavels) ──
    const covLanes = coveredLanes(game.playerPos);
    // Player body sits between the two gavel lanes
    const playerCenterX = (getLaneX(covLanes[0], w) + getLaneX(covLanes[1], w)) / 2;
    const playerY = strikeZoneY - 40;

    // Body — drawn above gavel line, does NOT block any lane
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑‍⚖️', playerCenterX, playerY);

    // ── Draw 2 gavels (one per hand) with wind-up / strike / follow-through ──
    for (let i = 0; i < 2; i++) {
      const hammerLane = covLanes[i];
      const hx = getLaneX(hammerLane, w);
      const hy = strikeZoneY + 8;
      const remaining = game.hammerAnim[i];

      let angle = 0;
      let scale = 1;
      let hammerY = hy;

      if (remaining > 0) {
        if (remaining > HAMMER_STRIKE_FRAMES + HAMMER_FOLLOW_FRAMES) {
          // Wind-up: pull up
          const windProgress = (remaining - HAMMER_STRIKE_FRAMES - HAMMER_FOLLOW_FRAMES) / HAMMER_WIND_FRAMES;
          angle = windProgress * 0.8;
          hammerY = hy + windProgress * 12;
          scale = 1 + windProgress * 0.15;
        } else if (remaining > HAMMER_FOLLOW_FRAMES) {
          // Strike: slam down
          const strikeProgress = 1 - (remaining - HAMMER_FOLLOW_FRAMES) / HAMMER_STRIKE_FRAMES;
          angle = 0.8 * (1 - strikeProgress) + (-0.5) * strikeProgress;
          hammerY = hy + 12 * (1 - strikeProgress);
          scale = 1.15 - strikeProgress * 0.2;
        } else {
          // Follow-through
          const followProgress = 1 - remaining / HAMMER_FOLLOW_FRAMES;
          angle = -0.5 * (1 - followProgress);
          scale = 0.95 + followProgress * 0.05;
        }
      }

      ctx.save();
      ctx.translate(hx, hammerY);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔨', 0, 0);
      ctx.restore();

      // Arm line from player to gavel
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(playerCenterX, playerY + 10);
      ctx.lineTo(hx, hammerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Draw hit effects (POW! WHAM! etc.) ──
    for (const e of game.hitEffects) {
      const progress = e.frame / e.maxFrames;
      const scale = 0.5 + (1 - Math.abs(progress - 0.2)) * 0.8;
      const alpha = progress < 0.1 ? progress / 0.1 : 1 - (progress - 0.1) / 0.9;
      const yOffset = progress * 30; // float downward (away from player)

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(e.x, e.y + yOffset);
      ctx.scale(scale, scale);

      // Text outline
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(e.text, 0, 0);

      // Fill
      ctx.fillStyle = e.color;
      ctx.fillText(e.text, 0, 0);
      ctx.restore();
    }

    // ── Coverage indicator at top strike zone ──
    for (const cl of covered) {
      const lx = getLaneX(cl, w);
      ctx.fillStyle = 'rgba(74, 124, 89, 0.06)';
      ctx.beginPath();
      ctx.ellipse(lx, strikeZoneY + 8, 24, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // undo shake translate

    // Update HUD
    setHudState(prevState => ({
      ...prevState,
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
    game.spawnCooldown = 40; // First threat after ~0.7s — gives player a beat to orient
    game.settlementSpawned = false;
    game.chatIndex = 0;
    game.chatCooldown = 200;
    game.hammerAnim = [0, 0];
    game.hitEffects = [];
    game.missEffects = [];
    game.shakeFrames = 0;
    game.shakeOffset = { x: 0, y: 0 };
    game.effectId = 0;
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
            Legal threats pop up from below! You hold a gavel in each hand,
            covering 2 lanes per side. Slide LEFT or RIGHT to choose which
            side to defend. Threats under your gavels get smashed automatically.
            Miss {MAX_MISSES} and you lose. Survive {GAME_DURATION} seconds to win.
          </div>
          <div className={styles.controls}>
            <span className={styles.controlKey}>←</span> Cover lanes 1-2
            &nbsp;&nbsp;
            <span className={styles.controlKey}>→</span> Cover lanes 4-5
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
