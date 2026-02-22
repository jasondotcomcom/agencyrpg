import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useChatContext } from '../../../context/ChatContext';
import { useWindowContext } from '../../../context/WindowContext';
import type { GameResultMeta } from '../../MicroGames/types';
import styles from './CalendarApp.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalSlot { day: number; slot: number; duration: number; title: string; color?: string }
interface CalMeeting {
  id: string; title: string; duration: number; color: string;
  constraint?: { days?: number[]; maxSlot?: number; minSlot?: number };
  trashable?: boolean; isSurprise?: boolean;
}
interface CalScenario {
  name: string;
  theme: string;
  prefilled: CalSlot[];
  queue: CalMeeting[];
  surpriseDelay: number;
  difficulty: 'normal' | 'hard' | 'chaos';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAYS = 5;
const SLOTS = 18; // 9am-6pm = 18 half-hour slots
const SLOT_H = 24;
const TIME_LABELS = ['9', '9:30', '10', '10:30', '11', '11:30', '12', '12:30', '1', '1:30', '2', '2:30', '3', '3:30', '4', '4:30', '5', '5:30'];
const GAME_DURATION = 90000; // 90 seconds

// ─── Scenarios ────────────────────────────────────────────────────────────────

const scenarios: CalScenario[] = [
  {
    name: 'Monday Madness',
    theme: 'Your week is packed with back-to-backs. Sort it out before the day starts.',
    difficulty: 'normal',
    prefilled: [
      { day: 0, slot: 0, duration: 4, title: 'Sprint Planning', color: '#7f8c8d' },
      { day: 2, slot: 6, duration: 2, title: 'Lunch w/ Client', color: '#7f8c8d' },
      { day: 4, slot: 14, duration: 4, title: 'Friday Wrap-up', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-client',    title: 'Client Call',          duration: 2, color: '#5b8def', constraint: { days: [0, 2] } },
      { id: 'cal-creative',  title: 'Creative Review',      duration: 3, color: '#e67e22' },
      { id: 'cal-1on1',      title: '1:1 with Taylor',      duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 } },
      { id: 'cal-focus1',    title: 'Focus Time',           duration: 4, color: '#27ae60' },
      { id: 'cal-standup',   title: 'Daily Standup',        duration: 1, color: '#3498db', constraint: { maxSlot: 1 } },
      { id: 'cal-design',    title: 'Design Crit',          duration: 2, color: '#e74c3c' },
      { id: 'cal-email1',    title: 'Status Update Email',  duration: 1, color: '#95a5a6', trashable: true },
      { id: 'cal-vendor',    title: 'Vendor Demo',          duration: 2, color: '#1abc9c', constraint: { days: [1, 3] } },
      { id: 'cal-surprise',  title: 'Holding Co. Call',     duration: 2, color: '#c0392b', isSurprise: true },
    ],
    surpriseDelay: 20000,
  },
  {
    name: 'Deadline Week',
    theme: 'Big presentation Friday. You need focus time but everyone wants meetings.',
    difficulty: 'hard',
    prefilled: [
      { day: 2, slot: 0, duration: 4, title: 'Status Update', color: '#7f8c8d' },
      { day: 4, slot: 0, duration: 6, title: 'Client Presentation', color: '#7f8c8d' },
      { day: 0, slot: 6, duration: 2, title: 'Team Lunch', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-focus1',    title: 'Deep Focus Time',      duration: 6, color: '#27ae60' },
      { id: 'cal-allhands',  title: 'All-Hands',            duration: 2, color: '#e67e22', constraint: { days: [3] } },
      { id: 'cal-vendor',    title: 'Vendor Demo',          duration: 2, color: '#3498db' },
      { id: 'cal-1on1a',     title: '1:1 with Morgan',      duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 } },
      { id: 'cal-1on1b',     title: '1:1 with Charlie',     duration: 1, color: '#8e44ad', constraint: { maxSlot: 5 } },
      { id: 'cal-review',    title: 'Deck Review',          duration: 2, color: '#e74c3c', constraint: { days: [2, 3] } },
      { id: 'cal-email1',    title: 'Weekly Recap Email',   duration: 1, color: '#95a5a6', trashable: true },
      { id: 'cal-email2',    title: 'Sync Meeting',         duration: 1, color: '#bdc3c7', trashable: true },
      { id: 'cal-client',    title: 'Client Check-in',      duration: 2, color: '#5b8def', constraint: { days: [0, 1] } },
      { id: 'cal-standup',   title: 'Morning Standup',      duration: 1, color: '#3498db', constraint: { maxSlot: 1 } },
      { id: 'cal-surprise',  title: 'CEO Wants to Chat',    duration: 2, color: '#c0392b', isSurprise: true },
    ],
    surpriseDelay: 25000,
  },
  {
    name: 'Back to Back',
    theme: 'Your calendar looks like a Tetris board. Find a way to make it all fit.',
    difficulty: 'chaos',
    prefilled: [
      { day: 0, slot: 4, duration: 4, title: 'Retro', color: '#7f8c8d' },
      { day: 2, slot: 8, duration: 4, title: 'Design Crit', color: '#7f8c8d' },
      { day: 4, slot: 2, duration: 2, title: 'Board Call', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-client',    title: 'Client Call',          duration: 2, color: '#5b8def' },
      { id: 'cal-1on1a',     title: '1:1 with Taylor',      duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 } },
      { id: 'cal-1on1b',     title: '1:1 with Sam',         duration: 1, color: '#8e44ad', constraint: { maxSlot: 5 } },
      { id: 'cal-focus1',    title: 'Focus Time',           duration: 4, color: '#27ae60' },
      { id: 'cal-focus2',    title: 'Prep Time',            duration: 3, color: '#2ecc71', constraint: { days: [3, 4] } },
      { id: 'cal-allhands',  title: 'All-Hands',            duration: 2, color: '#e67e22', constraint: { days: [1] } },
      { id: 'cal-vendor',    title: 'Vendor Pitch',         duration: 2, color: '#3498db', constraint: { days: [1, 3] } },
      { id: 'cal-creative',  title: 'Creative Brainstorm',  duration: 3, color: '#e74c3c' },
      { id: 'cal-standup',   title: 'Daily Standup',        duration: 1, color: '#3498db', constraint: { maxSlot: 1 } },
      { id: 'cal-email1',    title: 'Pointless Sync',       duration: 1, color: '#95a5a6', trashable: true },
      { id: 'cal-email2',    title: 'Status Email',         duration: 1, color: '#bdc3c7', trashable: true },
      { id: 'cal-surprise',  title: 'Fire Drill Meeting',   duration: 2, color: '#c0392b', isSurprise: true },
    ],
    surpriseDelay: 30000,
  },
];

function pickScenario(): CalScenario {
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

// ─── Calendar App ─────────────────────────────────────────────────────────────

export default function CalendarApp() {
  const { unlockAchievement } = useAchievementContext();
  const { setMorale } = useChatContext();
  const { addNotification } = useWindowContext();

  const [phase, setPhase] = useState<'messy' | 'playing' | 'solved' | 'failed'>('messy');
  const [scenario, setScenario] = useState<CalScenario>(() => pickScenario());
  const [solvedGrid, setSolvedGrid] = useState<(string | null)[][]>([]);
  const [solvedPlacements, setSolvedPlacements] = useState<Map<string, { day: number; slot: number }>>(new Map());

  const startGame = useCallback(() => {
    setScenario(pickScenario());
    setPhase('playing');
  }, []);

  const handleWin = useCallback((meta?: GameResultMeta) => {
    setPhase('solved');
    setMorale('high');
    addNotification('📅 Calendar Sorted!', 'Your week is organized. Team morale is up!');

    // Achievement tracking
    if (meta?.customFlags) {
      if (meta.customFlags.includes('no-invalid')) unlockAchievement('calendar-tetris');
      if (meta.customFlags.includes('focus-placed')) unlockAchievement('protected-my-peace');
      if (meta.customFlags.includes('trashed-email')) unlockAchievement('that-was-an-email');
    }
  }, [setMorale, addNotification, unlockAchievement]);

  const handleFail = useCallback(() => {
    setPhase('failed');
  }, []);

  if (phase === 'playing') {
    return (
      <div className={styles.container}>
        <CalendarShuffleEnhanced
          scenario={scenario}
          onWin={(grid, placements, meta) => {
            setSolvedGrid(grid);
            setSolvedPlacements(placements);
            handleWin(meta);
          }}
          onFail={handleFail}
        />
      </div>
    );
  }

  if (phase === 'solved') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>📅 This Week</div>
          <div className={styles.headerStatus}>
            <span className={styles.statusBadge}>✨ Sorted</span>
          </div>
          <button className={styles.reshuffleBtn} onClick={startGame}>
            Reshuffle Week
          </button>
        </div>
        <SolvedCalendarView
          scenario={scenario}
          grid={solvedGrid}
          placements={solvedPlacements}
        />
      </div>
    );
  }

  // Messy or failed state
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>📅 This Week</div>
        <div className={styles.headerStatus}>
          {phase === 'failed' ? (
            <span className={styles.statusBadgeFail}>⏰ Ran out of time</span>
          ) : (
            <span className={styles.statusBadgeMessy}>😵 Chaos</span>
          )}
        </div>
      </div>
      <div className={styles.messyView}>
        <MessyCalendarPreview scenario={scenario} />
        <div className={styles.messyCta}>
          <div className={styles.messyEmoji}>😰</div>
          <div className={styles.messyTitle}>
            {phase === 'failed' ? 'Still a mess...' : scenario.theme}
          </div>
          <div className={styles.messySub}>
            Drag meetings into time slots. Trash the ones that should be emails.
            {scenario.difficulty === 'hard' && ' (Hard mode)'}
            {scenario.difficulty === 'chaos' && ' (Chaos mode!)'}
          </div>
          <button className={styles.sortBtn} onClick={startGame}>
            {phase === 'failed' ? 'Try Again' : 'Sort This Week'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Messy Calendar Preview ───────────────────────────────────────────────────

function MessyCalendarPreview({ scenario }: { scenario: CalScenario }) {
  // Show a chaotic preview with overlapping meetings and question marks
  return (
    <div className={styles.previewGrid}>
      {DAY_LABELS.map(day => (
        <div key={day} className={styles.previewCol}>
          <div className={styles.previewDay}>{day}</div>
          <div className={styles.previewSlots}>
            {/* Show some random colored blocks to indicate chaos */}
            {scenario.queue.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className={styles.previewBlock}
                style={{
                  background: m.color,
                  top: `${10 + i * 25}%`,
                  height: `${15 + m.duration * 5}%`,
                  opacity: 0.5 + Math.random() * 0.3,
                }}
              />
            ))}
            <div className={styles.previewOverlap}>?</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Solved Calendar View ─────────────────────────────────────────────────────

function SolvedCalendarView({
  scenario,
  grid,
  placements,
}: {
  scenario: CalScenario;
  grid: (string | null)[][];
  placements: Map<string, { day: number; slot: number }>;
}) {
  return (
    <div className={styles.solvedGrid}>
      {/* Time labels */}
      <div className={styles.solvedTimeCol}>
        <div className={styles.solvedCorner} />
        {TIME_LABELS.filter((_, i) => i % 2 === 0).map((t, i) => (
          <div key={i} className={styles.solvedTimeLabel} style={{ top: i * SLOT_H * 2 + 28 }}>
            {t}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {DAY_LABELS.map((day, d) => (
        <div key={day} className={styles.solvedDayCol}>
          <div className={styles.solvedDayHeader}>{day}</div>
          <div className={styles.solvedDayBody}>
            {/* Grid lines */}
            {Array.from({ length: SLOTS }).map((_, s) => (
              <div key={s} className={styles.solvedSlotLine} style={{ top: s * SLOT_H }} />
            ))}

            {/* Prefilled meetings */}
            {scenario.prefilled.filter(p => p.day === d).map(pf => (
              <div
                key={`pf-${pf.title}`}
                className={styles.solvedMeeting}
                style={{
                  top: pf.slot * SLOT_H + 1,
                  height: pf.duration * SLOT_H - 2,
                  background: pf.color || '#bdc3c7',
                }}
              >
                <span className={styles.solvedMeetingTitle}>{pf.title}</span>
              </div>
            ))}

            {/* Placed meetings */}
            {[...placements.entries()].filter(([, pos]) => pos.day === d).map(([id, pos]) => {
              const meeting = scenario.queue.find(m => m.id === id);
              if (!meeting) return null;
              return (
                <div
                  key={id}
                  className={styles.solvedMeeting}
                  style={{
                    top: pos.slot * SLOT_H + 1,
                    height: meeting.duration * SLOT_H - 2,
                    background: meeting.color,
                  }}
                >
                  <span className={styles.solvedMeetingTitle}>{meeting.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Enhanced Calendar Shuffle Game ───────────────────────────────────────────

function CalendarShuffleEnhanced({
  scenario,
  onWin,
  onFail,
}: {
  scenario: CalScenario;
  onWin: (grid: (string | null)[][], placements: Map<string, { day: number; slot: number }>, meta?: GameResultMeta) => void;
  onFail: () => void;
}) {
  // Grid state
  const [grid, setGrid] = useState<(string | null)[][]>(() => {
    const g: (string | null)[][] = Array.from({ length: DAYS }, () => Array(SLOTS).fill(null));
    for (const pf of scenario.prefilled) {
      for (let s = 0; s < pf.duration; s++) {
        if (pf.slot + s < SLOTS) g[pf.day][pf.slot + s] = `pf-${pf.title}`;
      }
    }
    return g;
  });

  const [queueMeetings, setQueueMeetings] = useState<CalMeeting[]>(() =>
    scenario.queue.filter(m => !m.isSurprise)
  );
  const [placedMeetings, setPlacedMeetings] = useState<Map<string, { day: number; slot: number }>>(new Map());
  const [trashedSet, setTrashedSet] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [invalidCells, setInvalidCells] = useState<{ day: number; slot: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const noInvalidRef = useRef(true);
  const surpriseAddedRef = useRef(false);
  const wonRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const totalRequired = scenario.queue.length;

  // Timer
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !wonRef.current) {
        onFail();
        clearInterval(timer);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [onFail]);

  // Surprise meeting
  useEffect(() => {
    if (surpriseAddedRef.current) return;
    const surprise = scenario.queue.find(m => m.isSurprise);
    if (!surprise) return;
    const timer = setTimeout(() => {
      if (surpriseAddedRef.current || wonRef.current) return;
      surpriseAddedRef.current = true;
      setQueueMeetings(prev => [...prev, { ...surprise }]);
    }, scenario.surpriseDelay);
    return () => clearTimeout(timer);
  }, [scenario]);

  // Win check
  useEffect(() => {
    if (wonRef.current) return;
    if (placedMeetings.size + trashedSet.size >= totalRequired) {
      wonRef.current = true;
      const flags: string[] = [];
      if (noInvalidRef.current) flags.push('no-invalid');
      if ([...placedMeetings.keys()].some(id => {
        const m = scenario.queue.find(q => q.id === id);
        return m?.title.toLowerCase().includes('focus');
      })) flags.push('focus-placed');
      if ([...trashedSet].some(id => {
        const m = scenario.queue.find(q => q.id === id);
        return m?.trashable;
      })) flags.push('trashed-email');
      onWin(grid, placedMeetings, { customFlags: flags });
    }
  }, [placedMeetings, trashedSet, totalRequired, onWin, scenario.queue, grid]);

  // Placement validation
  const canPlace = useCallback((meeting: CalMeeting, day: number, slot: number, currentGrid: (string | null)[][]) => {
    if (slot + meeting.duration > SLOTS) return false;
    for (let s = 0; s < meeting.duration; s++) {
      if (currentGrid[day][slot + s] !== null) return false;
    }
    if (meeting.constraint) {
      if (meeting.constraint.days && !meeting.constraint.days.includes(day)) return false;
      if (meeting.constraint.maxSlot !== undefined && slot > meeting.constraint.maxSlot) return false;
      if (meeting.constraint.minSlot !== undefined && slot < meeting.constraint.minSlot) return false;
    }
    return true;
  }, []);

  // Drag events
  useEffect(() => {
    if (!dragId) return;
    const handleMove = (e: MouseEvent) => {
      setGhostPos({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y });
    };
    const handleUp = (e: MouseEvent) => {
      const meeting = queueMeetings.find(m => m.id === dragId);
      if (!meeting) { setDragId(null); return; }

      // Check trash
      const trashEl = document.getElementById('cal-app-trash');
      if (trashEl) {
        const trashRect = trashEl.getBoundingClientRect();
        if (e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
            e.clientY >= trashRect.top && e.clientY <= trashRect.bottom && meeting.trashable) {
          setTrashedSet(prev => new Set(prev).add(dragId));
          setQueueMeetings(prev => prev.filter(m => m.id !== dragId));
          setDragId(null);
          return;
        }
      }

      // Check grid placement
      const gridEl = gridRef.current;
      if (gridEl) {
        const rect = gridEl.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;

        const timeLabelsWidth = 36;
        const dayWidth = (rect.width - timeLabelsWidth) / DAYS;
        const headerHeight = 28;
        const dayIdx = Math.floor((relX - timeLabelsWidth) / dayWidth);
        const slotIdx = Math.round((relY - headerHeight) / SLOT_H);

        if (dayIdx >= 0 && dayIdx < DAYS && slotIdx >= 0 && slotIdx < SLOTS) {
          if (canPlace(meeting, dayIdx, slotIdx, grid)) {
            const newGrid = grid.map(d => [...d]);
            for (let s = 0; s < meeting.duration; s++) {
              newGrid[dayIdx][slotIdx + s] = meeting.id;
            }
            setGrid(newGrid);
            setPlacedMeetings(prev => new Map(prev).set(meeting.id, { day: dayIdx, slot: slotIdx }));
            setQueueMeetings(prev => prev.filter(m => m.id !== dragId));
          } else {
            noInvalidRef.current = false;
            const cells: { day: number; slot: number }[] = [];
            for (let s = 0; s < meeting.duration; s++) {
              if (slotIdx + s < SLOTS) cells.push({ day: dayIdx, slot: slotIdx + s });
            }
            setInvalidCells(cells);
            setTimeout(() => setInvalidCells([]), 300);
          }
        }
      }

      setDragId(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragId, queueMeetings, grid, canPlace]);

  const getConstraintLabel = (m: CalMeeting) => {
    const parts: string[] = [];
    if (m.constraint?.days) parts.push(m.constraint.days.map(d => DAY_LABELS[d]).join('/') + ' only');
    if (m.constraint?.maxSlot !== undefined) parts.push('morning only');
    if (m.trashable) parts.push('🗑️ trashable');
    return parts.join(' · ');
  };

  const durationLabel = (d: number) => {
    const mins = d * 30;
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const timerPct = (timeLeft / (GAME_DURATION / 1000)) * 100;
  const timerColor = timeLeft <= 15 ? '#e74c3c' : timeLeft <= 30 ? '#e67e22' : 'var(--color-mint)';

  return (
    <div className={styles.gameWrap}>
      {/* Timer bar */}
      <div className={styles.timerBar}>
        <div className={styles.timerFill} style={{ width: `${timerPct}%`, background: timerColor }} />
        <span className={styles.timerText}>{timeLeft}s — {scenario.name}</span>
      </div>

      <div className={styles.gameBody}>
        {/* Calendar Grid */}
        <div ref={gridRef} className={styles.gameGrid}>
          {/* Day headers */}
          <div className={styles.gameCorner} />
          {DAY_LABELS.map(d => (
            <div key={d} className={styles.gameDayHeader}>{d}</div>
          ))}

          {/* Time rows */}
          {Array.from({ length: SLOTS }).map((_, s) => (
            <React.Fragment key={s}>
              <div className={styles.gameTimeLabel}>
                {s % 2 === 0 ? TIME_LABELS[s] : ''}
              </div>
              {Array.from({ length: DAYS }).map((_, d) => {
                const cellId = grid[d][s];
                const isInvalid = invalidCells.some(c => c.day === d && c.slot === s);
                const isPrefilled = cellId?.startsWith('pf-');
                const isPlaced = cellId && !isPrefilled;

                let blockEl: React.ReactNode = null;
                if (isPrefilled) {
                  const pf = scenario.prefilled.find(p => `pf-${p.title}` === cellId && p.day === d && p.slot === s);
                  if (pf) {
                    blockEl = (
                      <div className={styles.gamePrefilled} style={{ height: pf.duration * SLOT_H - 2, background: pf.color }}>
                        {pf.title}
                      </div>
                    );
                  }
                } else if (isPlaced) {
                  const pos = placedMeetings.get(cellId);
                  if (pos && pos.day === d && pos.slot === s) {
                    const meeting = scenario.queue.find(m => m.id === cellId);
                    if (meeting) {
                      blockEl = (
                        <div className={styles.gamePlaced} style={{ height: meeting.duration * SLOT_H - 2, background: meeting.color }}>
                          {meeting.title}
                        </div>
                      );
                    }
                  }
                }

                return (
                  <div key={`${d}-${s}`}
                    className={`${styles.gameSlot} ${isInvalid ? styles.gameInvalid : ''}`}
                  >
                    {blockEl}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Queue Panel */}
        <div className={styles.gameQueue}>
          <div className={styles.gameQueueTitle}>
            Meetings ({queueMeetings.length} left)
          </div>
          <div className={styles.gameQueueList}>
            {queueMeetings.map(m => (
              <div key={m.id}
                className={`${styles.gameQueueItem} ${m.isSurprise ? styles.gameSurpriseIn : ''}`}
                style={{ borderLeftColor: m.color }}
                onMouseDown={(e) => {
                  dragOffsetRef.current = {
                    x: e.clientX - e.currentTarget.getBoundingClientRect().left,
                    y: e.clientY - e.currentTarget.getBoundingClientRect().top,
                  };
                  setDragId(m.id);
                  setGhostPos({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y });
                  e.preventDefault();
                }}
              >
                <div className={styles.gameQueueItemTitle}>{m.title}</div>
                <div className={styles.gameQueueItemDur}>{durationLabel(m.duration)}</div>
                {getConstraintLabel(m) && (
                  <div className={styles.gameQueueConstraint}>{getConstraintLabel(m)}</div>
                )}
              </div>
            ))}
          </div>

          {/* Trash zone */}
          <div id="cal-app-trash" className={styles.gameTrash}>
            <span>🗑️</span> Trash
            {trashedSet.size > 0 && <span className={styles.trashCount}>({trashedSet.size})</span>}
          </div>
        </div>
      </div>

      {/* Drag ghost */}
      {dragId && (() => {
        const meeting = queueMeetings.find(m => m.id === dragId);
        if (!meeting) return null;
        return (
          <div className={styles.gameGhost}
            style={{ left: ghostPos.x, top: ghostPos.y, borderLeftColor: meeting.color }}>
            {meeting.title} ({durationLabel(meeting.duration)})
          </div>
        );
      })()}
    </div>
  );
}
