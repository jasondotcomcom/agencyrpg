import { useRef, useEffect, useState, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './SkiFreeApp.module.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const SKIER_SPEED = 3;
const SCROLL_SPEED = 3.5;
const YETI_APPEAR_TIME = 30; // seconds
const YETI_SURVIVAL_TIME = 60; // seconds for achievement
const YETI_BASE_SPEED = 3.8;
const YETI_ACCEL = 0.015; // speed increase per frame
const OBSTACLE_SPAWN_RATE = 0.035;
const FLAG_SPAWN_RATE = 0.012;
const FLAG_POINTS = 100;
const DISTANCE_POINTS_PER_FRAME = 1;

// ─── Types ──────────────────────────────────────────────────────────────────

type GamePhase = 'start' | 'playing' | 'gameover';

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

  // Game state refs (mutable during rAF loop)
  const gameRef = useRef({
    skierX: 0,
    skierY: 0,
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
    // Snow particle system
    snowflakes: [] as { x: number; y: number; r: number; speed: number; drift: number }[],
  });

  // ── Resize canvas to fill container ───────────────────────────────────────

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

  // ── Initialize snowflakes ─────────────────────────────────────────────────

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

  // ── Start game ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    resizeCanvas();
    const g = gameRef.current;
    g.skierX = g.canvasW / 2;
    g.skierY = g.canvasH * 0.2;
    g.obstacles = [];
    g.flags = [];
    g.yeti = null;
    g.score = 0;
    g.startTime = performance.now();
    g.elapsed = 0;
    g.gameOver = false;
    g.skierVisible = true;
    initSnow();
    setScore(0);
    setElapsed(0);
    setYetiActive(false);
    setDeathMsg('');
    setPhase('playing');
  }, [resizeCanvas, initSnow]);

  // ── Spawn helpers ─────────────────────────────────────────────────────────

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

  // ── Collision detection ───────────────────────────────────────────────────

  const rectsOverlap = (
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ) => {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  };

  // ── Game loop ─────────────────────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = gameRef.current;

    if (g.gameOver) return;

    // ── Update elapsed time
    g.elapsed = (performance.now() - g.startTime) / 1000;

    // ── Handle input
    const keys = keysRef.current;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
      g.skierX -= SKIER_SPEED;
    }
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
      g.skierX += SKIER_SPEED;
    }
    // Clamp skier
    g.skierX = Math.max(16, Math.min(g.canvasW - 16, g.skierX));

    // ── Spawn obstacles & flags
    if (Math.random() < OBSTACLE_SPAWN_RATE) spawnObstacle(g);
    if (Math.random() < FLAG_SPAWN_RATE) spawnFlag(g);

    // ── Scroll obstacles upward
    const speed = SCROLL_SPEED + g.elapsed * 0.02; // gradually speed up
    for (const obs of g.obstacles) {
      obs.y -= speed;
    }
    for (const flag of g.flags) {
      if (!flag.collected) flag.y -= speed;
    }

    // ── Remove off-screen
    g.obstacles = g.obstacles.filter(o => o.y > -40);
    g.flags = g.flags.filter(f => f.y > -40 || f.collected);

    // ── Collision: skier vs obstacles
    const skierW = 24;
    const skierH = 28;
    const sx = g.skierX - skierW / 2;
    const sy = g.skierY - skierH / 2;

    for (const obs of g.obstacles) {
      const ox = obs.x - obs.width / 2;
      const oy = obs.y - obs.height / 2;
      if (rectsOverlap(sx + 4, sy + 4, skierW - 8, skierH - 8, ox + 4, oy + 4, obs.width - 8, obs.height - 8)) {
        // Hit obstacle - game over
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

    // ── Score from distance
    g.score += DISTANCE_POINTS_PER_FRAME;

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
      // Chase the player
      const dx = g.skierX - g.yeti.x;
      const dy = g.skierY - g.yeti.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      g.yeti.speed += YETI_ACCEL;
      if (dist > 0) {
        g.yeti.x += (dx / dist) * g.yeti.speed;
        g.yeti.y += (dy / dist) * g.yeti.speed;
      }

      // Check yeti catches player
      if (dist < 20) {
        g.yeti.eating = true;
        g.yeti.eatFrame = 0;
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
      // During eating animation: skier fades, yeti grows
      if (g.yeti.eatFrame > 30) {
        g.skierVisible = false;
      }
    }

    // ── Yeti survival achievement
    if (g.elapsed >= YETI_SURVIVAL_TIME && g.yeti && !g.yeti.eating) {
      unlockAchievement('outran-the-yeti');
    }

    // ── Update snowflakes
    for (const s of g.snowflakes) {
      s.y -= speed * 0.3;
      s.x += s.drift;
      if (s.y < -5) {
        s.y = g.canvasH + 5;
        s.x = Math.random() * g.canvasW;
      }
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

    // ── Ski tracks (faint lines behind skier)
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(g.skierX - 5, g.skierY + 14);
    ctx.lineTo(g.skierX - 5, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.skierX + 5, g.skierY + 14);
    ctx.lineTo(g.skierX + 5, 0);
    ctx.stroke();
    ctx.restore();

    // ── Snowflakes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const s of g.snowflakes) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Obstacles
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '24px serif';
    for (const obs of g.obstacles) {
      // Slight shadow
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

    // ── Skier
    if (g.skierVisible) {
      let skierAlpha = 1;
      if (g.yeti && g.yeti.eating) {
        skierAlpha = Math.max(0, 1 - g.yeti.eatFrame / 30);
      }
      ctx.save();
      ctx.globalAlpha = skierAlpha;
      ctx.font = '26px serif';
      ctx.fillText('⛷️', g.skierX, g.skierY);
      ctx.restore();
    }

    // ── Yeti
    if (g.yeti) {
      ctx.save();
      let yetiSize = 32;
      if (g.yeti.eating) {
        // Grow during eat animation
        yetiSize = 32 + g.yeti.eatFrame * 0.8;
      }
      ctx.font = `${yetiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Yeti shadow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(g.yeti.x + 2, g.yeti.y + yetiSize / 2 + 2, yetiSize / 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillText('🏔️', g.yeti.x, g.yeti.y); // Yeti rendered as monster
      // Draw a second layer for the actual abominable snowman feel
      ctx.font = `${yetiSize}px serif`;
      ctx.fillText('👹', g.yeti.x, g.yeti.y);
      ctx.restore();
    }

    // ── Sync React state periodically (every ~15 frames for perf)
    if (Math.floor(g.elapsed * 60) % 15 === 0) {
      setScore(Math.floor(g.score));
      setElapsed(Math.floor(g.elapsed));
      setYetiActive(!!g.yeti && !g.yeti.eating);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnObstacle, spawnFlag, unlockAchievement]);

  // ── Key handlers ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
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

  // ── Start / stop game loop ────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, gameLoop]);

  // ── Resize observer ───────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    resizeCanvas();
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* HUD - visible during play */}
      {phase === 'playing' && (
        <div className={styles.hud}>
          <span className={styles.score}>SCORE: {score}</span>
          <span className={styles.timer}>{elapsed}s</span>
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
