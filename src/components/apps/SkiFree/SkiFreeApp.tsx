import { useRef, useEffect, useState, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './SkiFreeApp.module.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const SKIER_SPEED = 3;
const SCROLL_SPEED = 3.5;
const BOOST_MULTIPLIER = 2.4;
const YETI_APPEAR_TIME = 30; // seconds
const YETI_SURVIVAL_TIME = 60; // seconds for achievement
const YETI_BASE_SPEED = 3.8;
const YETI_ACCEL = 0.015;
const OBSTACLE_SPAWN_RATE = 0.035;
const FLAG_SPAWN_RATE = 0.012;
const FLAG_POINTS = 100;
const DISTANCE_POINTS_PER_FRAME = 1;

// ─── Types ──────────────────────────────────────────────────────────────────

type GamePhase = 'start' | 'playing' | 'gameover';
type SkierDir = 'left' | 'center' | 'right';

interface Obstacle {
  x: number;
  y: number;
  type: 'tree' | 'rock' | 'skier';
  emoji: string;
  width: number;
  height: number;
}

interface Flag {
  x: number;
  y: number;
  collected: boolean;
}

interface Yeti {
  x: number;
  y: number;
  speed: number;
  eating: boolean;
  eatFrame: number;
}

interface SkiTrack {
  x: number;
  y: number;
  dir: SkierDir;
  age: number;
}

interface SprayParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SkiFreeApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const { unlockAchievement } = useAchievementContext();

  const [phase, setPhase] = useState<GamePhase>('start');
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [yetiActive, setYetiActive] = useState(false);
  const [deathMsg, setDeathMsg] = useState('');
  const [boosting, setBoosting] = useState(false);

  const gameRef = useRef({
    skierX: 0,
    skierY: 0,
    skierDir: 'center' as SkierDir,
    skierAngle: 0,        // current visual angle (smooth interpolation)
    boosting: false,
    boostUsed: false,      // track if F was ever pressed (for achievement)
    obstacles: [] as Obstacle[],
    flags: [] as Flag[],
    yeti: null as Yeti | null,
    score: 0,
    startTime: 0,
    elapsed: 0,
    canvasW: 0,
    canvasH: 0,
    gameOver: false,
    skierVisible: true,
    snowflakes: [] as { x: number; y: number; r: number; speed: number; drift: number }[],
    tracks: [] as SkiTrack[],
    trackTimer: 0,
    spray: [] as SprayParticle[],
    prevDir: 'center' as SkierDir,
    speedLines: [] as { x: number; y: number; len: number; alpha: number }[],
  });

  // ── Resize canvas ───────────────────────────────────────────────────────

  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;
    gameRef.current.canvasW = w;
    gameRef.current.canvasH = h;
  }, []);

  // ── Initialize snowflakes ───────────────────────────────────────────────

  const initSnow = useCallback(() => {
    const g = gameRef.current;
    g.snowflakes = [];
    for (let i = 0; i < 60; i++) {
      g.snowflakes.push({
        x: Math.random() * (g.canvasW || 600),
        y: Math.random() * (g.canvasH || 400),
        r: Math.random() * 2 + 1,
        speed: Math.random() * 1.5 + 0.5,
        drift: (Math.random() - 0.5) * 0.5,
      });
    }
  }, []);

  // ── Start game ──────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    resizeCanvas();
    const g = gameRef.current;
    g.skierX = g.canvasW / 2;
    g.skierY = g.canvasH * 0.2;
    g.skierDir = 'center';
    g.skierAngle = 0;
    g.boosting = false;
    g.boostUsed = false;
    g.obstacles = [];
    g.flags = [];
    g.yeti = null;
    g.score = 0;
    g.startTime = performance.now();
    g.elapsed = 0;
    g.gameOver = false;
    g.skierVisible = true;
    g.tracks = [];
    g.trackTimer = 0;
    g.spray = [];
    g.prevDir = 'center';
    g.speedLines = [];
    initSnow();
    setScore(0);
    setElapsed(0);
    setYetiActive(false);
    setDeathMsg('');
    setBoosting(false);
    setPhase('playing');
  }, [resizeCanvas, initSnow]);

  // ── Spawn helpers ───────────────────────────────────────────────────────

  const spawnObstacle = useCallback((g: typeof gameRef.current) => {
    const types: Array<{ type: Obstacle['type']; emoji: string; w: number; h: number }> = [
      { type: 'tree', emoji: '🌲', w: 28, h: 32 },
      { type: 'tree', emoji: '🌲', w: 28, h: 32 },
      { type: 'tree', emoji: '🌲', w: 28, h: 32 },
      { type: 'rock', emoji: '🪨', w: 24, h: 24 },
      { type: 'skier', emoji: '🧑', w: 22, h: 28 },
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    g.obstacles.push({
      x: Math.random() * (g.canvasW - 40) + 20,
      y: g.canvasH + 20,
      type: t.type,
      emoji: t.emoji,
      width: t.w,
      height: t.h,
    });
  }, []);

  const spawnFlag = useCallback((g: typeof gameRef.current) => {
    g.flags.push({
      x: Math.random() * (g.canvasW - 40) + 20,
      y: g.canvasH + 20,
      collected: false,
    });
  }, []);

  // ── Collision ───────────────────────────────────────────────────────────

  const rectsOverlap = (
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  // ── Emit snow spray ─────────────────────────────────────────────────────

  const emitSpray = useCallback((g: typeof gameRef.current, dir: 'left' | 'right') => {
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      g.spray.push({
        x: g.skierX + (dir === 'left' ? 8 : -8),
        y: g.skierY + 10,
        vx: (dir === 'left' ? 1 : -1) * (1 + Math.random() * 2),
        vy: -(0.5 + Math.random() * 1.5),
        life: 15 + Math.floor(Math.random() * 10),
        maxLife: 25,
        size: 2 + Math.random() * 2,
      });
    }
  }, []);

  // ── Game loop ───────────────────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = gameRef.current;

    if (g.gameOver) return;

    g.elapsed = (performance.now() - g.startTime) / 1000;

    // ── Input
    const keys = keysRef.current;
    const movingLeft = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const movingRight = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    const isBoosting = keys.has('f') || keys.has('F');

    // Boost state
    g.boosting = isBoosting;
    if (isBoosting && !g.boostUsed) {
      g.boostUsed = true;
      unlockAchievement('f-to-go-fast');
    }

    // Direction
    const newDir: SkierDir = movingLeft ? 'left' : movingRight ? 'right' : 'center';

    // Detect direction change for spray
    if (newDir !== g.prevDir && newDir !== 'center' && g.prevDir !== 'center') {
      emitSpray(g, newDir === 'left' ? 'right' : 'left');
    }
    g.prevDir = newDir;
    g.skierDir = newDir;

    // Smooth angle interpolation
    const targetAngle = newDir === 'left' ? -0.25 : newDir === 'right' ? 0.25 : 0;
    g.skierAngle += (targetAngle - g.skierAngle) * 0.2;

    // Movement
    const moveSpeed = isBoosting ? SKIER_SPEED * 1.5 : SKIER_SPEED;
    if (movingLeft) g.skierX -= moveSpeed;
    if (movingRight) g.skierX += moveSpeed;
    g.skierX = Math.max(16, Math.min(g.canvasW - 16, g.skierX));

    // ── Scroll speed
    const baseSpeed = SCROLL_SPEED + g.elapsed * 0.02;
    const speed = isBoosting ? baseSpeed * BOOST_MULTIPLIER : baseSpeed;

    // ── Spawn
    if (Math.random() < OBSTACLE_SPAWN_RATE) spawnObstacle(g);
    if (Math.random() < FLAG_SPAWN_RATE) spawnFlag(g);

    // ── Move obstacles/flags
    for (const obs of g.obstacles) obs.y -= speed;
    for (const flag of g.flags) { if (!flag.collected) flag.y -= speed; }
    g.obstacles = g.obstacles.filter(o => o.y > -40);
    g.flags = g.flags.filter(f => f.y > -40 || f.collected);

    // ── Ski tracks
    g.trackTimer++;
    if (g.trackTimer >= 3) {
      g.trackTimer = 0;
      g.tracks.push({ x: g.skierX, y: g.skierY + 14, dir: g.skierDir, age: 0 });
    }
    for (const t of g.tracks) {
      t.y -= speed;
      t.age++;
    }
    g.tracks = g.tracks.filter(t => t.y > -10 && t.age < 120);

    // ── Snow spray particles
    for (const p of g.spray) {
      p.x += p.vx;
      p.y += p.vy - speed * 0.3;
      p.vy += 0.1;
      p.life--;
    }
    g.spray = g.spray.filter(p => p.life > 0);

    // ── Speed lines (when boosting)
    if (isBoosting) {
      if (Math.random() < 0.4) {
        g.speedLines.push({
          x: Math.random() * g.canvasW,
          y: -10,
          len: 20 + Math.random() * 30,
          alpha: 0.3 + Math.random() * 0.3,
        });
      }
    }
    for (const sl of g.speedLines) {
      sl.y -= speed * 1.5;
      sl.alpha -= 0.01;
    }
    g.speedLines = g.speedLines.filter(sl => sl.alpha > 0 && sl.y + sl.len > -10);

    // ── Collision: skier vs obstacles
    const skierW = 24;
    const skierH = 28;
    const sx = g.skierX - skierW / 2;
    const sy = g.skierY - skierH / 2;

    for (const obs of g.obstacles) {
      const ox = obs.x - obs.width / 2;
      const oy = obs.y - obs.height / 2;
      if (rectsOverlap(sx + 4, sy + 4, skierW - 8, skierH - 8, ox + 4, oy + 4, obs.width - 8, obs.height - 8)) {
        g.gameOver = true;
        setDeathMsg('You crashed into a ' + obs.type + '!');
        setScore(Math.floor(g.score));
        setPhase('gameover');
        unlockAchievement('f-to-pay-respects');
        return;
      }
    }

    // ── Collision: skier vs flags
    for (const flag of g.flags) {
      if (flag.collected) continue;
      const fx = flag.x - 12;
      const fy = flag.y - 14;
      if (rectsOverlap(sx, sy, skierW, skierH, fx, fy, 24, 28)) {
        flag.collected = true;
        g.score += FLAG_POINTS;
      }
    }

    // ── Score
    g.score += DISTANCE_POINTS_PER_FRAME * (isBoosting ? 2 : 1);

    // ── Yeti logic
    if (g.elapsed >= YETI_APPEAR_TIME && !g.yeti) {
      g.yeti = {
        x: g.skierX + (Math.random() > 0.5 ? 100 : -100),
        y: g.canvasH + 60,
        speed: YETI_BASE_SPEED,
        eating: false,
        eatFrame: 0,
      };
    }

    if (g.yeti && !g.yeti.eating) {
      const dx = g.skierX - g.yeti.x;
      const dy = g.skierY - g.yeti.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      g.yeti.speed += YETI_ACCEL;

      // When boosting, yeti can't keep up — effective chase speed is reduced
      const effectiveYetiSpeed = isBoosting ? g.yeti.speed * 0.6 : g.yeti.speed;

      if (dist > 0) {
        g.yeti.x += (dx / dist) * effectiveYetiSpeed;
        g.yeti.y += (dy / dist) * effectiveYetiSpeed;
      }

      // Yeti also scrolls up with the world
      g.yeti.y -= speed * 0.3;

      if (dist < 20) {
        g.yeti.eating = true;
        g.yeti.eatFrame = 0;
      }

      // If boosting pushes yeti off screen, it's gone
      if (g.yeti.y > g.canvasH + 200) {
        g.yeti = null;
      }
    }

    if (g.yeti && g.yeti.eating) {
      g.yeti.eatFrame++;
      if (g.yeti.eatFrame > 60) {
        g.gameOver = true;
        g.skierVisible = false;
        setDeathMsg('The yeti got you! Om nom nom...');
        setScore(Math.floor(g.score));
        setPhase('gameover');
        unlockAchievement('f-to-pay-respects');
        return;
      }
      if (g.yeti.eatFrame > 30) {
        g.skierVisible = false;
      }
    }

    // ── Yeti survival achievement (must have used boost to earn it)
    if (g.elapsed >= YETI_SURVIVAL_TIME && g.boostUsed && (!g.yeti || (!g.yeti.eating))) {
      unlockAchievement('outran-the-yeti');
    }

    // ── Update snowflakes
    for (const s of g.snowflakes) {
      s.y -= speed * 0.3;
      s.x += s.drift;
      if (s.y < -5) { s.y = g.canvasH + 5; s.x = Math.random() * g.canvasW; }
      if (s.x < 0) s.x = g.canvasW;
      if (s.x > g.canvasW) s.x = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    // ── Background
    const grad = ctx.createLinearGradient(0, 0, 0, g.canvasH);
    grad.addColorStop(0, '#dceefb');
    grad.addColorStop(0.5, '#eef5fc');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, g.canvasW, g.canvasH);

    // ── Speed lines (boost effect)
    if (g.speedLines.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#b0d4f1';
      ctx.lineWidth = 1;
      for (const sl of g.speedLines) {
        ctx.globalAlpha = sl.alpha;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x, sl.y + sl.len);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Ski tracks (carving trail)
    ctx.save();
    for (const t of g.tracks) {
      const alpha = Math.max(0, 0.25 - t.age * 0.002);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(160, 185, 210, 1)';
      ctx.lineWidth = 1.5;

      // Track offset based on direction (carving effect)
      const offset = t.dir === 'left' ? -3 : t.dir === 'right' ? 3 : 0;

      ctx.beginPath();
      ctx.moveTo(t.x - 4 + offset, t.y);
      ctx.lineTo(t.x - 4 + offset, t.y + 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(t.x + 4 + offset, t.y);
      ctx.lineTo(t.x + 4 + offset, t.y + 4);
      ctx.stroke();
    }
    ctx.restore();

    // ── Snowflakes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const s of g.snowflakes) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Snow spray particles
    if (g.spray.length > 0) {
      ctx.save();
      for (const p of g.spray) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Obstacles
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const obs of g.obstacles) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(obs.x + 2, obs.y + obs.height / 2 + 4, obs.width / 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = obs.type === 'tree' ? '28px serif' : '22px serif';
      ctx.fillText(obs.emoji, obs.x, obs.y);
    }

    // ── Flags
    ctx.font = '20px serif';
    for (const flag of g.flags) {
      if (!flag.collected) {
        ctx.fillText('🚩', flag.x, flag.y);
      }
    }

    // ── Skier (with directional lean)
    if (g.skierVisible) {
      let skierAlpha = 1;
      if (g.yeti && g.yeti.eating) {
        skierAlpha = Math.max(0, 1 - g.yeti.eatFrame / 30);
      }
      ctx.save();
      ctx.globalAlpha = skierAlpha;
      ctx.translate(g.skierX, g.skierY);
      ctx.rotate(g.skierAngle);

      // Boost glow effect
      if (isBoosting) {
        ctx.shadowColor = 'rgba(100, 180, 255, 0.5)';
        ctx.shadowBlur = 12;
      }

      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛷️', 0, 0);
      ctx.restore();
    }

    // ── Yeti
    if (g.yeti) {
      ctx.save();
      let yetiSize = 32;
      if (g.yeti.eating) {
        yetiSize = 32 + g.yeti.eatFrame * 0.8;
      }
      ctx.font = `${yetiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(g.yeti.x + 2, g.yeti.y + yetiSize / 2 + 2, yetiSize / 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillText('🏔️', g.yeti.x, g.yeti.y);
      ctx.font = `${yetiSize}px serif`;
      ctx.fillText('👹', g.yeti.x, g.yeti.y);
      ctx.restore();
    }

    // ── Sync React state periodically
    if (Math.floor(g.elapsed * 60) % 15 === 0) {
      setScore(Math.floor(g.score));
      setElapsed(Math.floor(g.elapsed));
      setYetiActive(!!g.yeti && !g.yeti.eating);
      setBoosting(g.boosting);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnObstacle, spawnFlag, unlockAchievement, emitSpray]);

  // ── Key handlers ────────────────────────────────────────────────────────

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', 'f', 'F'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // ── Start / stop game loop ──────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, gameLoop]);

  // ── Resize observer ─────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    resizeCanvas();
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* HUD */}
      {phase === 'playing' && (
        <div className={styles.hud}>
          <span className={styles.score}>SCORE: {score}</span>
          <span className={styles.timer}>{elapsed}s</span>
          {boosting && <span className={styles.boostIndicator}>BOOST</span>}
          {yetiActive && <span className={styles.yetiWarning}>!! YETI !!</span>}
        </div>
      )}

      {/* Start screen */}
      {phase === 'start' && (
        <div className={styles.overlay}>
          <h1 className={styles.title}>S K I F R E E</h1>
          <p className={styles.subtitle}>
            Dodge trees, rocks, and other skiers. Collect flags for points.
            Watch out for the yeti...
          </p>
          <button className={styles.button} onClick={startGame} autoFocus>
            START
          </button>
          <span className={styles.controls}>Arrow Keys / A,D to move</span>
        </div>
      )}

      {/* Game over screen */}
      {phase === 'gameover' && (
        <div className={styles.overlay}>
          <h1 className={styles.title}>GAME OVER</h1>
          <p className={styles.deathMessage}>{deathMsg}</p>
          <p className={styles.finalScore}>SCORE: {score}</p>
          <p className={styles.subtitle}>You survived {elapsed} seconds</p>
          <button className={styles.button} onClick={startGame} autoFocus>
            PLAY AGAIN
          </button>
          <span className={styles.controls}>Arrow Keys / A,D to move</span>
        </div>
      )}
    </div>
  );
}
