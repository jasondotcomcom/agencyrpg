import React, { useState, useEffect, useRef } from 'react';
import { useCheatContext } from '../../context/CheatContext';
import { useConductContext } from '../../context/ConductContext';
import styles from './HRWatcher.module.css';

// ─── Cheat-mode thought bubbles (playful easter-egg tone) ──────────────────

const CHEAT_THOUGHTS = [
  'Documenting...',
  'Per the handbook...',
  'Noted. 📋',
  'This will go in your file.',
  'I\'m watching.',
  'Compliance check.',
  'Recording this.',
  '...suspicious.',
  'Policy violation?',
  'Very interesting.',
];

// ─── Conduct-mode warnings (serious, escalating) ───────────────────────────

const CONDUCT_WARNINGS: Record<number, string> = {
  1: 'This is your first warning. I\'ll be monitoring the situation.',
  2: 'Mandatory training has been scheduled. This is serious.',
  3: 'Team members have filed complaints. We need to talk.',
  4: 'The press is involved now. This reflects on all of us.',
  5: 'Even your family is concerned. Please reflect on your behavior.',
  6: 'Legal has been notified. This is your final chance.',
  7: 'The board has made their decision.',
};

// ─── Cheat-mode: cursor-following Pat (hotcoffee easter egg) ────────────────

function CheatHRWatcher() {
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animIdRef = useRef<number>(0);
  const [thoughtIndex, setThoughtIndex] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (targetRef.current.x - prev.x) * 0.06,
        y: prev.y + (targetRef.current.y - prev.y) * 0.06,
      }));
      animIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtIndex(i => (i + 1) % CHEAT_THOUGHTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={styles.hrWatcher}
      style={{ left: position.x + 60, top: position.y - 40 }}
      aria-hidden="true"
    >
      <div className={styles.hrFace}>👔</div>
      <div className={styles.hrEyes}>👀</div>
      <div className={styles.hrBadge}>📋 HR</div>
      <div className={styles.thoughtBubble}>
        {CHEAT_THOUGHTS[thoughtIndex]}
      </div>
    </div>
  );
}

// ─── Conduct-mode: fixed warning popup (real consequences) ──────────────────

function ConductHRWarning({ warningLevel }: { warningLevel: number }) {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Show again when warning level changes
  useEffect(() => {
    setVisible(true);
    setDismissed(false);
  }, [warningLevel]);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (!visible || dismissed) return;
    const timer = setTimeout(() => setVisible(false), 12000);
    return () => clearTimeout(timer);
  }, [visible, dismissed]);

  if (!visible || dismissed) return null;

  const warningText = CONDUCT_WARNINGS[warningLevel] || CONDUCT_WARNINGS[1];

  return (
    <div className={styles.conductWarning} aria-live="assertive">
      <div className={styles.conductHeader}>
        <span className={styles.conductAvatar}>👔</span>
        <span className={styles.conductName}>Pat — HR</span>
        <span className={styles.conductLevel}>Warning {warningLevel}</span>
      </div>
      <p className={styles.conductMessage}>{warningText}</p>
      <button className={styles.conductDismiss} onClick={() => setDismissed(true)}>
        Acknowledged
      </button>
    </div>
  );
}

// ─── Main HRWatcher: renders the correct variant ────────────────────────────

export default function HRWatcher(): React.ReactElement | null {
  const { cheat } = useCheatContext();
  const { warningLevel } = useConductContext();

  // Cheat-triggered Pat (hotcoffee) — cursor follower
  if (cheat.hrWatcherActive) {
    return <CheatHRWatcher />;
  }

  // Conduct-triggered Pat — fixed warning popup
  if (warningLevel >= 1) {
    return <ConductHRWarning warningLevel={warningLevel} />;
  }

  return null;
}
