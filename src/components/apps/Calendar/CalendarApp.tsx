import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useChatContext } from '../../../context/ChatContext';
import { useWindowContext } from '../../../context/WindowContext';
import styles from './CalendarApp.module.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLS = 5;
const ROWS = 10;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const BASE_DROP_INTERVAL = 800; // ms per row at level 1
const SPEED_FACTOR = 0.08; // each level reduces interval by 8%

// ─── Meeting Tetromino Definitions ───────────────────────────────────────────

interface TetrominoDef {
  name: string;
  shapes: number[][][]; // rotations → [row, col] offsets from origin
  color: string;
  labels: string[];
}

const TETROMINOS: TetrominoDef[] = [
  {
    name: 'Quick Sync',
    shapes: [[[0, 0]]],
    color: '#a8e6cf',
    labels: ['Quick Sync', 'Got a sec?', '5 min max (lie)', 'Ping me', 'Quick q'],
  },
  {
    name: '1:1',
    shapes: [
      [[0, 0], [1, 0]],
      [[0, 0], [0, 1]],
    ],
    color: '#a8d8ea',
    labels: ['1:1 with Taylor', 'Career chat', 'Feedback session', '1:1 catchup', 'Check-in'],
  },
  {
    name: 'Team Standup',
    shapes: [
      [[0, 0], [0, 1], [0, 2]],
      [[0, 0], [1, 0], [2, 0]],
    ],
    color: '#c3aed6',
    labels: ['Team Standup', 'Daily sync', 'Morning huddle', 'Scrum ceremony'],
  },
  {
    name: 'Client Call',
    shapes: [
      [[0, 0], [1, 0], [2, 0], [2, 1]], // L
      [[0, 0], [0, 1], [0, 2], [1, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 0], [1, 1], [1, 2]],
    ],
    color: '#ffb7b2',
    labels: ['Client Call', 'Stakeholder Alignment', 'The Big One', 'Client preso'],
  },
  {
    name: 'Creative Review',
    shapes: [
      [[0, 0], [0, 1], [0, 2], [1, 1]], // T
      [[0, 0], [1, 0], [1, 1], [2, 0]],
      [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 0], [1, 1], [2, 1]],
    ],
    color: '#f9e79f',
    labels: ['Creative Review', 'Crit Session', 'Concept Preso', 'Design review'],
  },
  {
    name: 'All-Hands',
    shapes: [
      [[0, 0], [0, 1], [1, 0], [1, 1]], // O
    ],
    color: '#d4a5a5',
    labels: ['All-Hands 🙄', 'CEO Update', 'Mandatory Fun', 'Town Hall'],
  },
  {
    name: 'Strategy Session',
    shapes: [
      [[0, 0], [1, 0], [2, 0], [3, 0]], // I vertical
      [[0, 0], [0, 1], [0, 2], [0, 3]], // I horizontal
    ],
    color: '#7fcdcd',
    labels: ['Strategy Session', 'Deep dive', 'Quarterly planning', 'Offsite prep'],
  },
  {
    name: 'Workshop',
    shapes: [
      [[0, 0], [0, 1], [1, 1], [1, 2]], // S
      [[0, 1], [1, 0], [1, 1], [2, 0]],
    ],
    color: '#b8d4e3',
    labels: ['Workshop', 'Brainstorm', 'Innovation Theater', 'Ideation session'],
  },
];

// ─── Power-up Types ──────────────────────────────────────────────────────────

type PowerUpType = 'cancel' | 'delegate' | 'email' | 'reschedule';

interface PowerUp {
  type: PowerUpType;
  icon: string;
  label: string;
}

const POWER_UP_DEFS: Record<PowerUpType, { icon: string; label: string }> = {
  cancel: { icon: '❌', label: 'Cancel Meeting' },
  delegate: { icon: '👥', label: 'Delegate' },
  email: { icon: '📧', label: 'Make it an Email' },
  reschedule: { icon: '🗓️', label: 'Reschedule' },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Piece {
  defIndex: number;
  rotation: number;
  row: number;
  col: number;
  label: string;
  isUrgent?: boolean;
}

interface PlacedCell {
  color: string;
  label: string;
  isUrgent?: boolean;
}

type Grid = (PlacedCell | null)[][];

interface GameState {
  grid: Grid;
  current: Piece | null;
  next: Piece[];
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  gameOver: boolean;
  paused: boolean;
  powerUps: PowerUp[];
  flashRows: number[];
  totalPiecesPlaced: number;
  maxCombo: number;
  tetrisCount: number;
  lastClearLabel: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array<PlacedCell | null>(COLS).fill(null));
}

function getShape(piece: Piece): number[][] {
  const def = TETROMINOS[piece.defIndex];
  return def.shapes[piece.rotation % def.shapes.length];
}

function getAbsoluteCells(piece: Piece): Array<[number, number]> {
  return getShape(piece).map(([dr, dc]) => [piece.row + dr, piece.col + dc]);
}

function isValid(grid: Grid, piece: Piece): boolean {
  for (const [r, c] of getAbsoluteCells(piece)) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    if (grid[r][c] !== null) return false;
  }
  return true;
}

function rotatePiece(piece: Piece, dir: 1 | -1 = 1): Piece {
  const def = TETROMINOS[piece.defIndex];
  const rotations = def.shapes.length;
  return { ...piece, rotation: (piece.rotation + dir + rotations) % rotations };
}

function spawnPiece(level: number): Piece {
  const isUrgent = level >= 4 && Math.random() < 0.05 + level * 0.01;
  const defIndex = Math.floor(Math.random() * TETROMINOS.length);
  const def = TETROMINOS[defIndex];
  const rotation = Math.floor(Math.random() * def.shapes.length);
  const label = pick(def.labels);

  // Center horizontally
  const shape = def.shapes[rotation];
  const maxCol = Math.max(...shape.map(([, c]) => c));
  const col = Math.floor((COLS - maxCol - 1) / 2);

  return { defIndex, rotation, row: 0, col, label, isUrgent };
}

function placePiece(grid: Grid, piece: Piece): Grid {
  const newGrid = grid.map(row => [...row]);
  const def = TETROMINOS[piece.defIndex];
  for (const [r, c] of getAbsoluteCells(piece)) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      newGrid[r][c] = {
        color: piece.isUrgent ? '#e74c3c' : def.color,
        label: piece.label,
        isUrgent: piece.isUrgent,
      };
    }
  }
  return newGrid;
}

function getCompletedRows(grid: Grid): number[] {
  const rows: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    if (grid[r].every(cell => cell !== null)) rows.push(r);
  }
  return rows;
}

function clearRows(grid: Grid, rows: number[]): Grid {
  const remaining = grid.filter((_, i) => !rows.includes(i));
  while (remaining.length < ROWS) {
    remaining.unshift(Array<PlacedCell | null>(COLS).fill(null));
  }
  return remaining;
}

function getScoreForLines(count: number, level: number, combo: number): number {
  const base = count === 1 ? 100 : count === 2 ? 300 : count === 3 ? 500 : count >= 4 ? 800 : 0;
  const comboBonus = combo > 1 ? 50 * (combo - 1) : 0;
  return Math.round((base + comboBonus) * (1 + level * 0.1));
}

function getClearLabel(count: number): string {
  if (count >= 4) return 'INBOX ZERO! 🎉';
  if (count === 3) return 'Triple! ⚡';
  if (count === 2) return 'Double! 💪';
  return 'Day optimized! ✓';
}

function getDropInterval(level: number): number {
  return Math.max(100, BASE_DROP_INTERVAL * Math.pow(1 - SPEED_FACTOR, level - 1));
}

function maybeSpawnPowerUp(level: number): PowerUp | null {
  const chance = 0.05 + level * 0.008;
  if (Math.random() > chance) return null;
  const types: PowerUpType[] = ['cancel', 'delegate', 'email', 'reschedule'];
  const type = pick(types);
  return { type, ...POWER_UP_DEFS[type] };
}

function getGhostRow(grid: Grid, piece: Piece): number {
  let ghostRow = piece.row;
  while (isValid(grid, { ...piece, row: ghostRow + 1 })) {
    ghostRow++;
  }
  return ghostRow;
}

// ─── Main Component ──────────────────────────────────────────────────────────

type Phase = 'menu' | 'playing' | 'gameover';

export default function CalendarApp(): React.ReactElement {
  const { unlockAchievement } = useAchievementContext();
  const { setMorale } = useChatContext();
  const { addNotification } = useWindowContext();

  const [phase, setPhase] = useState<Phase>('menu');
  const [highScore, setHighScore] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('agencyrpg-tetris-highscore') || '0'); } catch { return 0; }
  });

  function createInitialGame(): GameState {
    return {
      grid: createEmptyGrid(),
      current: spawnPiece(1),
      next: [spawnPiece(1), spawnPiece(1), spawnPiece(1)],
      score: 0,
      level: 1,
      linesCleared: 0,
      combo: 0,
      gameOver: false,
      paused: false,
      powerUps: [],
      flashRows: [],
      totalPiecesPlaced: 0,
      maxCombo: 0,
      tetrisCount: 0,
      lastClearLabel: null,
    };
  }

  const [game, setGame] = useState<GameState>(createInitialGame);
  const gameRef = useRef(game);
  gameRef.current = game;

  const tickAccumRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gameOverHandled = useRef(false);

  const startGame = useCallback(() => {
    const g = createInitialGame();
    setGame(g);
    gameRef.current = g;
    tickAccumRef.current = 0;
    lastTimeRef.current = 0;
    gameOverHandled.current = false;
    setPhase('playing');
  }, []);

  // ─── Advance piece to next — shared logic ────────────────────────────────

  function advancePiece(prev: GameState, newGrid: Grid, totalPlaced: number, extraScore: number): GameState {
    const completedRows = getCompletedRows(newGrid);

    if (completedRows.length > 0) {
      return {
        ...prev,
        grid: newGrid,
        current: null,
        flashRows: completedRows,
        score: prev.score + extraScore,
        totalPiecesPlaced: totalPlaced,
      };
    }

    const [nextPiece, ...remainingNext] = prev.next;
    const newNext = [...remainingNext, spawnPiece(prev.level)];

    if (!isValid(newGrid, nextPiece)) {
      return { ...prev, grid: newGrid, current: null, gameOver: true, score: prev.score + extraScore, totalPiecesPlaced: totalPlaced };
    }

    const powerUp = maybeSpawnPowerUp(prev.level);
    const newPowerUps = powerUp ? [...prev.powerUps.slice(-2), powerUp] : prev.powerUps;

    return {
      ...prev,
      grid: newGrid,
      current: nextPiece,
      next: newNext,
      combo: 0,
      score: prev.score + extraScore,
      powerUps: newPowerUps,
      totalPiecesPlaced: totalPlaced,
      lastClearLabel: null,
    };
  }

  // ─── Core game step (drop one row) ───────────────────────────────────────

  const gameStep = useCallback(() => {
    setGame(prev => {
      if (prev.gameOver || prev.paused || !prev.current || prev.flashRows.length > 0) return prev;

      const moved = { ...prev.current, row: prev.current.row + 1 };
      if (isValid(prev.grid, moved)) {
        return { ...prev, current: moved };
      }

      // Can't move down — lock piece
      const newGrid = placePiece(prev.grid, prev.current);
      return advancePiece(prev, newGrid, prev.totalPiecesPlaced + 1, 0);
    });
  }, []);

  // ─── Flash row clear animation ───────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || game.flashRows.length === 0) return;

    const timer = setTimeout(() => {
      setGame(prev => {
        const count = prev.flashRows.length;
        const cleared = clearRows(prev.grid, prev.flashRows);
        const newLinesCleared = prev.linesCleared + count;
        const newLevel = Math.floor(newLinesCleared / 10) + 1;
        const newCombo = prev.combo + 1;
        const points = getScoreForLines(count, prev.level, newCombo);
        const label = getClearLabel(count);
        const newTetris = count >= 4 ? prev.tetrisCount + 1 : prev.tetrisCount;
        const maxCombo = Math.max(prev.maxCombo, newCombo);

        const [nextPiece, ...remainingNext] = prev.next;
        const newNext = [...remainingNext, spawnPiece(newLevel)];

        if (!isValid(cleared, nextPiece)) {
          return {
            ...prev,
            grid: cleared,
            current: null,
            flashRows: [],
            score: prev.score + points,
            level: newLevel,
            linesCleared: newLinesCleared,
            combo: newCombo,
            gameOver: true,
            lastClearLabel: label,
            tetrisCount: newTetris,
            maxCombo,
          };
        }

        const powerUp = maybeSpawnPowerUp(newLevel);
        const newPowerUps = powerUp ? [...prev.powerUps.slice(-2), powerUp] : prev.powerUps;

        return {
          ...prev,
          grid: cleared,
          current: nextPiece,
          next: newNext,
          flashRows: [],
          score: prev.score + points,
          level: newLevel,
          linesCleared: newLinesCleared,
          combo: newCombo,
          lastClearLabel: label,
          tetrisCount: newTetris,
          maxCombo,
          powerUps: newPowerUps,
        };
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [phase, game.flashRows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Game loop (requestAnimationFrame) ─────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const g = gameRef.current;
      if (!g.gameOver && !g.paused) {
        tickAccumRef.current += delta;
        const interval = getDropInterval(g.level);
        if (tickAccumRef.current >= interval) {
          tickAccumRef.current -= interval;
          gameStep();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, gameStep]);

  // ─── Clear label timeout ─────────────────────────────────────────────────

  useEffect(() => {
    if (!game.lastClearLabel) return;
    const t = setTimeout(() => setGame(prev => ({ ...prev, lastClearLabel: null })), 1500);
    return () => clearTimeout(t);
  }, [game.lastClearLabel]);

  // ─── Game over handling ──────────────────────────────────────────────────

  useEffect(() => {
    if (!game.gameOver || phase !== 'playing' || gameOverHandled.current) return;
    gameOverHandled.current = true;

    setPhase('gameover');

    if (game.score > highScore) {
      setHighScore(game.score);
      try { localStorage.setItem('agencyrpg-tetris-highscore', String(game.score)); } catch { /* noop */ }
    }

    // Achievements
    if (game.score >= 1000) unlockAchievement('calendar-tetris');
    if (game.level >= 5) unlockAchievement('schedule-survivor');
    if (game.tetrisCount >= 1) unlockAchievement('that-was-an-email');
    if (game.maxCombo >= 3) unlockAchievement('chaos-calendar');
    if (game.totalPiecesPlaced >= 50) unlockAchievement('recurring-champion');
    if (game.level >= 10) unlockAchievement('delegation-king');

    if (game.score >= 500) {
      setMorale('high');
      addNotification('📅 Calendar Tetris!', `Score: ${game.score} — your week is under control!`);
    } else {
      addNotification('📅 Calendar Overwhelmed', `Score: ${game.score} — meetings won this time.`);
    }
  }, [game.gameOver, game.score, game.level, game.tetrisCount, game.maxCombo, game.totalPiecesPlaced,
      phase, highScore, unlockAchievement, setMorale, addNotification]);

  // ─── Input helpers ───────────────────────────────────────────────────────

  const moveHorizontal = useCallback((dir: -1 | 1) => {
    setGame(prev => {
      if (!prev.current || prev.gameOver || prev.paused) return prev;
      const moved = { ...prev.current, col: prev.current.col + dir };
      return isValid(prev.grid, moved) ? { ...prev, current: moved } : prev;
    });
  }, []);

  const rotate = useCallback(() => {
    setGame(prev => {
      if (!prev.current || prev.gameOver || prev.paused) return prev;
      const rotated = rotatePiece(prev.current);
      if (isValid(prev.grid, rotated)) return { ...prev, current: rotated };
      // Wall kicks
      for (const kick of [-1, 1, -2, 2]) {
        const kicked = { ...rotated, col: rotated.col + kick };
        if (isValid(prev.grid, kicked)) return { ...prev, current: kicked };
      }
      return prev;
    });
  }, []);

  const softDrop = useCallback(() => {
    setGame(prev => {
      if (!prev.current || prev.gameOver || prev.paused) return prev;
      const moved = { ...prev.current, row: prev.current.row + 1 };
      return isValid(prev.grid, moved) ? { ...prev, current: moved, score: prev.score + 1 } : prev;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGame(prev => {
      if (!prev.current || prev.gameOver || prev.paused) return prev;
      let piece = { ...prev.current };
      let dropDist = 0;
      while (isValid(prev.grid, { ...piece, row: piece.row + 1 })) {
        piece = { ...piece, row: piece.row + 1 };
        dropDist++;
      }
      const newGrid = placePiece(prev.grid, piece);
      return advancePiece(prev, newGrid, prev.totalPiecesPlaced + 1, dropDist * 2);
    });
    tickAccumRef.current = 0;
  }, []);

  // ─── Power-up usage ──────────────────────────────────────────────────────

  const usePowerUp = useCallback((type: PowerUpType) => {
    setGame(prev => {
      const idx = prev.powerUps.findIndex(p => p.type === type);
      if (idx === -1) return prev;

      const newPowerUps = [...prev.powerUps];
      newPowerUps.splice(idx, 1);
      let newGrid = prev.grid.map(row => [...row]);

      if (type === 'cancel' || type === 'email') {
        // Remove one random occupied cell
        const occupied: Array<[number, number]> = [];
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (newGrid[r][c]) occupied.push([r, c]);
          }
        }
        if (occupied.length > 0) {
          const [r, c] = pick(occupied);
          newGrid[r][c] = null;
        }
      } else if (type === 'delegate') {
        // Clear the bottom-most incomplete row
        for (let r = ROWS - 1; r >= 0; r--) {
          const filled = newGrid[r].filter(c => c !== null).length;
          if (filled > 0 && filled < COLS) {
            newGrid[r] = Array<PlacedCell | null>(COLS).fill(null);
            const above = newGrid.slice(0, r);
            const below = newGrid.slice(r + 1);
            newGrid = [Array<PlacedCell | null>(COLS).fill(null), ...above, ...below];
            break;
          }
        }
      } else if (type === 'reschedule') {
        // Shuffle the bottom 3 rows
        const bottom3 = Math.max(0, ROWS - 3);
        const cells: (PlacedCell | null)[] = [];
        for (let r = bottom3; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            cells.push(newGrid[r][c]);
          }
        }
        for (let i = cells.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        let ci = 0;
        for (let r = bottom3; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            newGrid[r][c] = cells[ci++];
          }
        }
      }

      return { ...prev, grid: newGrid, powerUps: newPowerUps };
    });
  }, []);

  // ─── Keyboard controls ───────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKey = (e: KeyboardEvent) => {
      if (gameRef.current.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveHorizontal(-1); break;
        case 'ArrowRight': e.preventDefault(); moveHorizontal(1); break;
        case 'ArrowDown': e.preventDefault(); softDrop(); break;
        case 'ArrowUp':
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'z': case 'Z': e.preventDefault(); rotate(); break;
        case 'p': case 'P':
          e.preventDefault();
          setGame(prev => ({ ...prev, paused: !prev.paused }));
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, moveHorizontal, softDrop, hardDrop, rotate]);

  // ─── Touch controls (swipe) ──────────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const elapsed = Date.now() - touchRef.current.time;
    touchRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 15 && absDy < 15 && elapsed < 200) { rotate(); return; }
    if (absDy > 60 && dy > 0 && absDy > absDx * 1.5) { hardDrop(); return; }
    if (absDx > 30 && absDx > absDy * 1.2) { moveHorizontal(dx > 0 ? 1 : -1); return; }
  }, [rotate, hardDrop, moveHorizontal]);

  // ─── Render: Menu ────────────────────────────────────────────────────────

  if (phase === 'menu') {
    return (
      <div className={styles.container}>
        <div className={styles.menuScreen}>
          <div className={styles.menuIcon}>📅</div>
          <h1 className={styles.menuTitle}>Calendar Tetris</h1>
          <p className={styles.menuSub}>
            Meetings fall from the sky. Fill complete days to clear them.
            Don't let your calendar overwhelm you.
          </p>
          <div className={styles.menuControls}>
            <div className={styles.controlRow}><span className={styles.controlKey}>← →</span> Move</div>
            <div className={styles.controlRow}><span className={styles.controlKey}>↓</span> Soft drop</div>
            <div className={styles.controlRow}><span className={styles.controlKey}>Space</span> Hard drop</div>
            <div className={styles.controlRow}><span className={styles.controlKey}>Z</span> Rotate</div>
            <div className={styles.controlHint}>Mobile: swipe to move, tap to rotate, swipe down to drop</div>
          </div>
          {highScore > 0 && (
            <div className={styles.menuHighScore}>High Score: {highScore}</div>
          )}
          <button className={styles.playBtn} onClick={startGame}>Start Week</button>
        </div>
      </div>
    );
  }

  // ─── Render: Game Over ───────────────────────────────────────────────────

  if (phase === 'gameover') {
    const isNewHigh = game.score >= highScore && game.score > 0;
    return (
      <div className={styles.container}>
        <div className={styles.gameOverScreen}>
          <div className={styles.gameOverIcon}>😵‍💫</div>
          <h2 className={styles.gameOverTitle}>Calendar Overwhelmed!</h2>
          <div className={styles.gameOverStats}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>{game.score}{isNewHigh ? ' 🏆 NEW!' : ''}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Level</span>
              <span className={styles.statValue}>{game.level}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Lines</span>
              <span className={styles.statValue}>{game.linesCleared}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Best Combo</span>
              <span className={styles.statValue}>{game.maxCombo}x</span>
            </div>
            {game.tetrisCount > 0 && (
              <div className={styles.statRow}>
                <span className={styles.statLabel}>INBOX ZEROs</span>
                <span className={styles.statValue}>{game.tetrisCount} 🎉</span>
              </div>
            )}
          </div>
          <button className={styles.playBtn} onClick={startGame}>Try Again</button>
          <button className={styles.menuBtn} onClick={() => setPhase('menu')}>Menu</button>
        </div>
      </div>
    );
  }

  // ─── Render: Playing ─────────────────────────────────────────────────────

  const ghostRow = game.current ? getGhostRow(game.grid, game.current) : -1;

  return (
    <div className={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={styles.gameLayout}>
        {/* Side panel */}
        <div className={styles.sidePanel}>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>Score</div>
            <div className={styles.scoreValue}>{game.score}</div>
          </div>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>Level</div>
            <div className={styles.scoreValue}>{game.level}</div>
          </div>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>Lines</div>
            <div className={styles.scoreValue}>{game.linesCleared}</div>
          </div>

          <div className={styles.nextBox}>
            <div className={styles.nextLabel}>Next</div>
            {game.next.slice(0, 2).map((piece, i) => (
              <NextPiecePreview key={i} piece={piece} small={i === 1} />
            ))}
          </div>

          {game.powerUps.length > 0 && (
            <div className={styles.powerUps}>
              {game.powerUps.map((pu, i) => (
                <button
                  key={`${pu.type}-${i}`}
                  className={styles.powerUpBtn}
                  onClick={() => usePowerUp(pu.type)}
                  title={pu.label}
                >
                  {pu.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className={styles.gridWrapper}>
          <div className={styles.dayLabels}>
            {DAY_LABELS.map(day => (
              <div key={day} className={styles.dayLabel}>{day}</div>
            ))}
          </div>

          <div className={styles.grid}>
            {game.grid.map((row, r) =>
              row.map((cell, c) => {
                const isFlash = game.flashRows.includes(r);

                // Ghost preview
                let isGhost = false;
                if (game.current && !cell) {
                  const ghost = { ...game.current, row: ghostRow };
                  isGhost = getAbsoluteCells(ghost).some(([gr, gc]) => gr === r && gc === c);
                }

                // Active piece
                let activeCell: PlacedCell | null = null;
                if (game.current) {
                  const match = getAbsoluteCells(game.current).some(([pr, pc]) => pr === r && pc === c);
                  if (match) {
                    const def = TETROMINOS[game.current.defIndex];
                    activeCell = {
                      color: game.current.isUrgent ? '#e74c3c' : def.color,
                      label: game.current.label,
                      isUrgent: game.current.isUrgent,
                    };
                  }
                }

                const display = activeCell || cell;
                const ghostColor = game.current ? TETROMINOS[game.current.defIndex].color : '#999';

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.cell} ${isFlash ? styles.cellFlash : ''} ${isGhost && !display ? styles.cellGhost : ''}`}
                    style={display ? {
                      background: display.color,
                      borderColor: display.isUrgent ? '#c0392b' : undefined,
                    } : undefined}
                  >
                    {isGhost && !display && (
                      <div className={styles.ghostBlock} style={{ borderColor: ghostColor }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {game.lastClearLabel && (
            <div className={styles.clearLabel}>{game.lastClearLabel}</div>
          )}

          {game.current && game.current.row <= 1 && (
            <div className={styles.pieceLabel}>{game.current.label}</div>
          )}

          {game.combo > 1 && (
            <div className={styles.comboLabel}>{game.combo}x Combo! 🔥</div>
          )}

          {game.paused && (
            <div className={styles.pauseOverlay}>
              <div className={styles.pauseText}>PAUSED</div>
              <div className={styles.pauseHint}>Press P to resume</div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile button controls */}
      <div className={styles.mobileControls}>
        <button className={styles.controlBtn} onPointerDown={() => moveHorizontal(-1)} aria-label="Move left">←</button>
        <button className={styles.controlBtn} onPointerDown={() => rotate()} aria-label="Rotate">↻</button>
        <button className={styles.controlBtn} onPointerDown={() => softDrop()} aria-label="Soft drop">↓</button>
        <button className={styles.controlBtn} onPointerDown={() => hardDrop()} aria-label="Hard drop">⤓</button>
        <button className={styles.controlBtn} onPointerDown={() => moveHorizontal(1)} aria-label="Move right">→</button>
      </div>
    </div>
  );
}

// ─── Next Piece Preview ──────────────────────────────────────────────────────

function NextPiecePreview({ piece, small }: { piece: Piece; small?: boolean }) {
  const def = TETROMINOS[piece.defIndex];
  const shape = def.shapes[piece.rotation % def.shapes.length];
  const maxR = Math.max(...shape.map(([r]) => r)) + 1;
  const maxC = Math.max(...shape.map(([, c]) => c)) + 1;

  return (
    <div className={`${styles.nextPiece} ${small ? styles.nextPieceSmall : ''}`}>
      <div
        className={styles.nextGrid}
        style={{
          gridTemplateColumns: `repeat(${maxC}, 1fr)`,
          gridTemplateRows: `repeat(${maxR}, 1fr)`,
        }}
      >
        {Array.from({ length: maxR * maxC }, (_, i) => {
          const r = Math.floor(i / maxC);
          const c = i % maxC;
          const filled = shape.some(([sr, sc]) => sr === r && sc === c);
          return (
            <div
              key={i}
              className={styles.nextCell}
              style={filled ? { background: piece.isUrgent ? '#e74c3c' : def.color } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
