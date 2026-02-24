import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useChatContext } from '../../../context/ChatContext';
import { useWindowContext } from '../../../context/WindowContext';
import styles from './CalendarApp.module.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const COLS = 5;
const ROWS = 18;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const CELL_SIZE = 28;
const TICK_BASE = 800; // ms per drop at level 1
const TICK_MIN = 100;  // fastest drop speed
const ROWS_PER_LEVEL = 10;
const HIGH_SCORE_KEY = 'arpg-tetris-highscore';

// ─── Piece Definitions ─────────────────────────────────────────────────────

interface PieceDef {
  shape: number[][];
  color: string;
  label: string;
}

// Meetings as Tetris pieces
const PIECE_DEFS: PieceDef[] = [
  // I-piece: Strategy Session (4 vertical)
  { shape: [[1],[1],[1],[1]], color: '#a8d8ea', label: 'Strategy Session' },
  // O-piece: All-Hands (2x2)
  { shape: [[1,1],[1,1]], color: '#c3aed6', label: 'All-Hands 🙄' },
  // T-piece: Creative Review
  { shape: [[0,1,0],[1,1,1]], color: '#a8e6cf', label: 'Creative Review' },
  // S-piece: Workshop
  { shape: [[0,1,1],[1,1,0]], color: '#f9e79f', label: 'Workshop' },
  // Z-piece: Brainstorm
  { shape: [[1,1,0],[0,1,1]], color: '#ffb7b2', label: 'Brainstorm' },
  // L-piece: Client Call (foot right)
  { shape: [[0,0,1],[1,1,1]], color: '#b5ead7', label: 'Client Call' },
  // J-piece: Team Standup (foot left)
  { shape: [[1,0,0],[1,1,1]], color: '#e2b6cf', label: 'Team Standup' },
  // Single block: Quick Sync
  { shape: [[1]], color: '#dcedc1', label: 'Quick Sync' },
  // Horizontal 2-block: 1:1
  { shape: [[1,1]], color: '#ffd3b6', label: '1:1 Meeting' },
  // Horizontal 3-block: Standup
  { shape: [[1,1,1]], color: '#d5aaff', label: 'Standup' },
];

const MEETING_LABELS = [
  'Quick Sync', 'Got a sec?', '5 min max (lie)',
  '1:1 with Taylor', 'Career chat', 'Feedback session',
  'All-Hands 🙄', 'CEO Update', 'Mandatory Fun',
  'Client Call', 'Stakeholder Alignment', 'The Big One',
  'Creative Review', 'Crit Session', 'Concept Preso',
  'Workshop', 'Brainstorm', 'Innovation Theater',
  'Strategy Session', 'Planning', 'Retro',
  'Budget Review', 'Roadmap Sync', 'Sprint Demo',
];

function randomLabel(): string {
  return MEETING_LABELS[Math.floor(Math.random() * MEETING_LABELS.length)];
}

// ─── Piece State ────────────────────────────────────────────────────────────

interface Piece {
  def: PieceDef;
  shape: number[][];
  x: number;
  y: number;
  label: string;
}

function randomPiece(): Piece {
  const def = PIECE_DEFS[Math.floor(Math.random() * PIECE_DEFS.length)];
  const shape = def.shape.map(r => [...r]);
  const w = shape[0].length;
  return {
    def,
    shape,
    x: Math.floor((COLS - w) / 2),
    y: 0,
    label: randomLabel(),
  };
}

function rotateShape(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

// ─── Board Helpers ──────────────────────────────────────────────────────────

type Board = (string | null)[][];

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function fits(board: Board, shape: number[][], x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (!shape[r][c]) continue;
      const bx = x + c;
      const by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return false;
      if (by >= 0 && board[by][bx] !== null) return false;
    }
  }
  return true;
}

function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(r => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
      if (!piece.shape[r][c]) continue;
      const bx = piece.x + c;
      const by = piece.y + r;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        newBoard[by][bx] = piece.def.color;
      }
    }
  }
  return newBoard;
}

function clearRows(board: Board): { board: Board; cleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const cleared = ROWS - newBoard.length;
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(null));
  }
  return { board: newBoard, cleared };
}

function ghostY(board: Board, piece: Piece): number {
  let gy = piece.y;
  while (fits(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
}

function isBoardEmpty(board: Board): boolean {
  return board.every(row => row.every(cell => cell === null));
}

function allColumnsHaveBlocks(board: Board): boolean {
  for (let c = 0; c < COLS; c++) {
    if (!board.some(row => row[c] !== null)) return false;
  }
  return true;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

function scoreForCleared(lines: number, combo: number): number {
  const base = lines === 1 ? 100 : lines === 2 ? 300 : lines === 3 ? 500 : lines >= 4 ? 800 : 0;
  return base * Math.max(1, combo);
}

// ─── Power-ups ──────────────────────────────────────────────────────────────

type PowerUp = 'cancel' | 'delegate' | 'email' | 'reschedule';

interface PowerUpDef {
  id: PowerUp;
  icon: string;
  label: string;
  description: string;
}

const POWERUP_DEFS: PowerUpDef[] = [
  { id: 'cancel', icon: '❌', label: 'Cancel Meeting', description: 'Remove one block' },
  { id: 'delegate', icon: '👥', label: 'Delegate', description: 'Shrink current piece' },
  { id: 'email', icon: '📧', label: 'Make it an Email', description: 'Clear a random block' },
  { id: 'reschedule', icon: '🗓️', label: 'Reschedule', description: 'Clear bottom row' },
];

function maybeDropPowerUp(): PowerUp | null {
  if (Math.random() < 0.08) {
    return POWERUP_DEFS[Math.floor(Math.random() * POWERUP_DEFS.length)].id;
  }
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CalendarApp() {
  const { unlockAchievement, incrementCounter } = useAchievementContext();
  const { setMorale } = useChatContext();
  const { addNotification } = useWindowContext();

  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState<Piece>(randomPiece);
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0'); } catch { return 0; }
  });
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [showLabel, setShowLabel] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [emailUseCount, setEmailUseCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMessage, setShowMessage] = useState<string | null>(null);

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const phaseRef = useRef(phase);
  const pausedRef = useRef(isPaused);
  boardRef.current = board;
  pieceRef.current = piece;
  phaseRef.current = phase;
  pausedRef.current = isPaused;

  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Game tick ──────────────────────────────────────────────────────────

  const spawnNext = useCallback(() => {
    const np = nextPiece;
    if (!fits(boardRef.current, np.shape, np.x, np.y)) {
      // Game over
      const finalBoard = boardRef.current;
      if (allColumnsHaveBlocks(finalBoard)) unlockAchievement('overbooked');
      setPhase('gameover');
      return;
    }
    setPiece(np);
    setNextPiece(randomPiece());
    setShowLabel(true);
    setTimeout(() => setShowLabel(false), 1500);

    // Maybe drop a power-up
    const pu = maybeDropPowerUp();
    if (pu) {
      setPowerUps(prev => prev.length < 4 ? [...prev, pu] : prev);
    }
  }, [nextPiece, unlockAchievement]);

  const lockAndClear = useCallback((p: Piece) => {
    let newBoard = lockPiece(boardRef.current, p);
    const { board: clearedBoard, cleared } = clearRows(newBoard);

    if (cleared > 0) {
      // Find which rows were cleared for animation
      const fullRows: number[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (newBoard[r].every(cell => cell !== null)) fullRows.push(r);
      }
      setClearingRows(fullRows);
      setTimeout(() => setClearingRows([]), 300);

      const newCombo = combo + 1;
      setCombo(newCombo);
      const pts = scoreForCleared(cleared, newCombo);
      setScore(prev => prev + pts);
      const newLines = linesCleared + cleared;
      setLinesCleared(newLines);
      setLevel(Math.floor(newLines / ROWS_PER_LEVEL) + 1);

      // Show message for special clears
      if (cleared >= 4) {
        setShowMessage('INBOX ZERO! 🎉');
        unlockAchievement('calendar-tetris');
        setTimeout(() => setShowMessage(null), 2000);
      } else if (cleared >= 2) {
        const msgs = ['Back-to-back efficiency!', 'Double booked (in a good way)!', 'Multi-clear!'];
        setShowMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        setTimeout(() => setShowMessage(null), 1500);
      }

      if (newCombo >= 5) unlockAchievement('combo-master');
      if (newLines >= 20) unlockAchievement('efficiency-expert');

      if (isBoardEmpty(clearedBoard)) {
        unlockAchievement('inbox-zero');
        setShowMessage('BOARD CLEAR! ✨');
        setTimeout(() => setShowMessage(null), 2000);
      }

      newBoard = clearedBoard;
    } else {
      setCombo(0);
    }

    setBoard(newBoard);
    boardRef.current = newBoard;
  }, [combo, linesCleared, unlockAchievement]);

  const dropOne = useCallback(() => {
    if (phaseRef.current !== 'playing' || pausedRef.current) return;
    const p = pieceRef.current;
    if (fits(boardRef.current, p.shape, p.x, p.y + 1)) {
      setPiece({ ...p, y: p.y + 1 });
    } else {
      lockAndClear(p);
      spawnNext();
    }
  }, [lockAndClear, spawnNext]);

  // Auto-drop timer
  useEffect(() => {
    if (phase !== 'playing' || isPaused) return;
    const speed = Math.max(TICK_MIN, TICK_BASE - (level - 1) * 70);
    const timer = setInterval(dropOne, speed);
    return () => clearInterval(timer);
  }, [phase, level, isPaused, dropOne]);

  // Game time tracker
  useEffect(() => {
    if (phase !== 'playing' || isPaused) return;
    const timer = setInterval(() => setGameTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [phase, isPaused]);

  // Achievement: 5 minutes without game over
  useEffect(() => {
    if (gameTime >= 300 && phase === 'playing') unlockAchievement('calendar-zen');
  }, [gameTime, phase, unlockAchievement]);

  // Achievement: reach level 10
  useEffect(() => {
    if (level >= 10) unlockAchievement('calendar-survivor');
  }, [level, unlockAchievement]);

  // ─── Input handling ──────────────────────────────────────────────────────

  const move = useCallback((dx: number) => {
    if (phaseRef.current !== 'playing' || pausedRef.current) return;
    const p = pieceRef.current;
    if (fits(boardRef.current, p.shape, p.x + dx, p.y)) {
      setPiece({ ...p, x: p.x + dx });
    }
  }, []);

  const rotate = useCallback(() => {
    if (phaseRef.current !== 'playing' || pausedRef.current) return;
    const p = pieceRef.current;
    const rotated = rotateShape(p.shape);
    // Try normal position, then wall kicks
    for (const kick of [0, -1, 1, -2, 2]) {
      if (fits(boardRef.current, rotated, p.x + kick, p.y)) {
        setPiece({ ...p, shape: rotated, x: p.x + kick });
        return;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    if (phaseRef.current !== 'playing' || pausedRef.current) return;
    const p = pieceRef.current;
    const gy = ghostY(boardRef.current, p);
    const dropped = { ...p, y: gy };
    setPiece(dropped);
    lockAndClear(dropped);
    spawnNext();
  }, [lockAndClear, spawnNext]);

  const softDrop = useCallback(() => {
    if (phaseRef.current !== 'playing' || pausedRef.current) return;
    const p = pieceRef.current;
    if (fits(boardRef.current, p.shape, p.x, p.y + 1)) {
      setPiece({ ...p, y: p.y + 1 });
      setScore(prev => prev + 1);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); move(-1); break;
        case 'ArrowRight': e.preventDefault(); move(1); break;
        case 'ArrowDown': e.preventDefault(); softDrop(); break;
        case 'ArrowUp': case ' ': e.preventDefault(); hardDrop(); break;
        case 'z': case 'Z': rotate(); break;
        case 'x': case 'X': rotate(); break;
        case 'p': case 'P': case 'Escape': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, move, softDrop, hardDrop, rotate]);

  // Touch controls
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || phase !== 'playing') return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 15 && absDy < 15 && dt < 300) {
      // Tap = rotate
      rotate();
    } else if (absDy > absDx) {
      if (dy > 40) {
        // Swipe down = soft drop (long swipe = hard drop)
        if (dy > 100) hardDrop();
        else softDrop();
      } else if (dy < -40) {
        // Swipe up = hard drop
        hardDrop();
      }
    } else {
      if (dx > 25) move(1);
      else if (dx < -25) move(-1);
    }
  }, [phase, move, softDrop, hardDrop, rotate]);

  // ─── Power-up usage ───────────────────────────────────────────────────────

  const usePowerUp = useCallback((idx: number) => {
    if (phase !== 'playing' || isPaused) return;
    const pu = powerUps[idx];
    if (!pu) return;

    const newBoard = boardRef.current.map(r => [...r]);

    switch (pu) {
      case 'cancel': {
        // Remove a random filled cell
        const filled: [number, number][] = [];
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (newBoard[r][c]) filled.push([r, c]);
        if (filled.length > 0) {
          const [r, c] = filled[Math.floor(Math.random() * filled.length)];
          newBoard[r][c] = null;
        }
        break;
      }
      case 'email': {
        // Clear a random single block
        const filled: [number, number][] = [];
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (newBoard[r][c]) filled.push([r, c]);
        if (filled.length > 0) {
          const [r, c] = filled[Math.floor(Math.random() * filled.length)];
          newBoard[r][c] = null;
        }
        const count = emailUseCount + 1;
        setEmailUseCount(count);
        const totalCount = incrementCounter('email-powerup-used');
        if (totalCount >= 10) unlockAchievement('meeting-minimalist');
        break;
      }
      case 'delegate': {
        // Current piece becomes a single block
        setPiece(p => ({ ...p, shape: [[1]] }));
        break;
      }
      case 'reschedule': {
        // Clear the bottom row
        for (let c = 0; c < COLS; c++) newBoard[ROWS - 1][c] = null;
        // Gravity: don't shift rows for reschedule
        break;
      }
    }

    setBoard(newBoard);
    boardRef.current = newBoard;
    setPowerUps(prev => prev.filter((_, i) => i !== idx));
  }, [phase, isPaused, powerUps, emailUseCount, incrementCounter, unlockAchievement]);

  // ─── Start / Restart ──────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const b = createBoard();
    const p = randomPiece();
    const np = randomPiece();
    setBoard(b);
    boardRef.current = b;
    setPiece(p);
    pieceRef.current = p;
    setNextPiece(np);
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setCombo(0);
    setPowerUps([]);
    setClearingRows([]);
    setGameTime(0);
    setEmailUseCount(0);
    setIsPaused(false);
    setShowMessage(null);
    setShowLabel(true);
    setTimeout(() => setShowLabel(false), 1500);
    setPhase('playing');
    containerRef.current?.focus();
  }, []);

  // Save high score on game over
  useEffect(() => {
    if (phase === 'gameover' && score > highScore) {
      setHighScore(score);
      try { localStorage.setItem(HIGH_SCORE_KEY, String(score)); } catch { /* */ }
    }
  }, [phase, score, highScore]);

  // Notify on game over
  useEffect(() => {
    if (phase === 'gameover') {
      if (score > 500) {
        setMorale('high');
        addNotification('📅 Calendar Tetris', `Score: ${score} — Level ${level}! Nice organizing.`);
      }
    }
  }, [phase, score, level, setMorale, addNotification]);

  // ─── Rendering ────────────────────────────────────────────────────────────

  const gy = phase === 'playing' ? ghostY(board, piece) : 0;

  // Menu screen
  if (phase === 'menu') {
    return (
      <div className={styles.container}>
        <div className={styles.menuScreen}>
          <div className={styles.menuLogo}>📅</div>
          <h1 className={styles.menuTitle}>Calendar Tetris</h1>
          <p className={styles.menuSub}>Meetings are falling. Your calendar is filling up. Can you keep it under control?</p>
          <div className={styles.menuControls}>
            <div className={styles.controlRow}><kbd>←→</kbd> Move</div>
            <div className={styles.controlRow}><kbd>↑</kbd> Hard Drop</div>
            <div className={styles.controlRow}><kbd>↓</kbd> Soft Drop</div>
            <div className={styles.controlRow}><kbd>Z</kbd> Rotate</div>
            <div className={styles.controlRow}><kbd>P</kbd> Pause</div>
          </div>
          {highScore > 0 && (
            <div className={styles.menuHighScore}>High Score: {highScore.toLocaleString()}</div>
          )}
          <button className={styles.startBtn} onClick={startGame}>
            Sort This Week
          </button>
        </div>
      </div>
    );
  }

  // Game over screen
  if (phase === 'gameover') {
    const isNewHigh = score >= highScore && score > 0;
    return (
      <div className={styles.container}>
        <div className={styles.gameOverScreen}>
          <div className={styles.gameOverEmoji}>📅💥</div>
          <h1 className={styles.gameOverTitle}>Your Calendar Has Overwhelmed You</h1>
          <div className={styles.gameOverStats}>
            <div className={styles.gameOverStat}>
              <span className={styles.gameOverStatValue}>{score.toLocaleString()}</span>
              <span className={styles.gameOverStatLabel}>{isNewHigh ? '🏆 New High Score!' : 'Score'}</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.gameOverStatValue}>{level}</span>
              <span className={styles.gameOverStatLabel}>Level</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.gameOverStatValue}>{linesCleared}</span>
              <span className={styles.gameOverStatLabel}>Days Cleared</span>
            </div>
          </div>
          <button className={styles.startBtn} onClick={startGame}>
            Try Again
          </button>
          <button className={styles.menuBtn} onClick={() => setPhase('menu')}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Playing screen
  return (
    <div
      className={styles.container}
      ref={containerRef}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Score</span>
          <span className={styles.hudValue}>{score.toLocaleString()}</span>
        </div>
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Level</span>
          <span className={styles.hudValue}>{level}</span>
        </div>
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Lines</span>
          <span className={styles.hudValue}>{linesCleared}</span>
        </div>
        {combo > 1 && (
          <div className={styles.hudCombo}>{combo}x Combo!</div>
        )}
      </div>

      {/* Game area */}
      <div className={styles.gameArea}>
        {/* Next piece preview */}
        <div className={styles.nextPreview}>
          <div className={styles.nextLabel}>Next</div>
          <div className={styles.nextGrid}>
            {nextPiece.shape.map((row, r) => (
              <div key={r} className={styles.nextRow}>
                {row.map((cell, c) => (
                  <div
                    key={c}
                    className={styles.nextCell}
                    style={{
                      background: cell ? nextPiece.def.color : 'transparent',
                      border: cell ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Board */}
        <div className={styles.board} style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE }}>
          {/* Day labels */}
          <div className={styles.dayLabels}>
            {DAY_LABELS.map(d => (
              <div key={d} className={styles.dayLabel} style={{ width: CELL_SIZE }}>{d}</div>
            ))}
          </div>

          {/* Grid lines */}
          {Array.from({ length: ROWS }).map((_, r) => (
            <div
              key={r}
              className={`${styles.gridRow} ${clearingRows.includes(r) ? styles.gridRowClearing : ''}`}
              style={{ top: r * CELL_SIZE, height: CELL_SIZE }}
            >
              {Array.from({ length: COLS }).map((_, c) => (
                <div key={c} className={styles.gridCell} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
              ))}
            </div>
          ))}

          {/* Placed blocks */}
          {board.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <div
                  key={`${r}-${c}`}
                  className={styles.block}
                  style={{
                    left: c * CELL_SIZE,
                    top: r * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: cell,
                  }}
                />
              ) : null
            )
          )}

          {/* Ghost piece */}
          {piece.shape.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <div
                  key={`ghost-${r}-${c}`}
                  className={styles.ghostBlock}
                  style={{
                    left: (piece.x + c) * CELL_SIZE,
                    top: (gy + r) * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderColor: piece.def.color,
                  }}
                />
              ) : null
            )
          )}

          {/* Active piece */}
          {piece.shape.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <div
                  key={`piece-${r}-${c}`}
                  className={styles.block}
                  style={{
                    left: (piece.x + c) * CELL_SIZE,
                    top: (piece.y + r) * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: piece.def.color,
                  }}
                />
              ) : null
            )
          )}

          {/* Piece label */}
          {showLabel && piece.y <= 3 && (
            <div
              className={styles.pieceLabel}
              style={{ left: piece.x * CELL_SIZE, top: (piece.y + piece.shape.length) * CELL_SIZE + 4 }}
            >
              {piece.label}
            </div>
          )}

          {/* Danger zone indicator */}
          {board.slice(0, 4).some(row => row.some(c => c !== null)) && (
            <div className={styles.dangerZone} />
          )}
        </div>

        {/* Power-ups */}
        {powerUps.length > 0 && (
          <div className={styles.powerUps}>
            {powerUps.map((pu, i) => {
              const def = POWERUP_DEFS.find(d => d.id === pu)!;
              return (
                <button
                  key={`${pu}-${i}`}
                  className={styles.powerUpBtn}
                  onClick={() => usePowerUp(i)}
                  title={def.description}
                >
                  <span className={styles.powerUpIcon}>{def.icon}</span>
                  <span className={styles.powerUpName}>{def.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className={styles.mobileControls}>
        <button className={styles.controlBtn} onTouchStart={(e) => { e.preventDefault(); move(-1); }}>◀</button>
        <button className={styles.controlBtn} onTouchStart={(e) => { e.preventDefault(); rotate(); }}>↻</button>
        <button className={styles.controlBtn} onTouchStart={(e) => { e.preventDefault(); softDrop(); }}>▼</button>
        <button className={styles.controlBtn} onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}>⏬</button>
        <button className={styles.controlBtn} onTouchStart={(e) => { e.preventDefault(); move(1); }}>▶</button>
      </div>

      {/* Overlay messages */}
      {showMessage && (
        <div className={styles.floatingMessage}>{showMessage}</div>
      )}

      {isPaused && (
        <div className={styles.pauseOverlay} onClick={() => setIsPaused(false)}>
          <div className={styles.pauseText}>PAUSED</div>
          <div className={styles.pauseSub}>Tap or press P to resume</div>
        </div>
      )}
    </div>
  );
}
