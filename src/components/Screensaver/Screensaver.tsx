import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAchievementContext } from '../../context/AchievementContext';
import styles from './Screensaver.module.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#a29bfe',
  '#fd79a8', '#00cec9', '#e17055', '#6c5ce7', '#55efc4',
  '#ffeaa7', '#dfe6e9', '#74b9ff', '#ff7675', '#81ecec',
];

const BUZZWORDS = [
  'synergy', 'circle back', 'leverage', 'align', 'bandwidth',
  'deep dive', 'low-hanging fruit', 'move the needle', 'paradigm shift',
  'touch base', 'unpack this', 'ideate', 'holistic', 'disrupt',
  'thought leader', 'pivot', 'scalable', 'storytelling', 'omnichannel',
  'growth hack', 'best practice', 'action item', 'deliverable',
  'stakeholder', 'ecosystem', 'value prop', 'ROI', 'KPI',
];

const LOGO_SPEED = 1.5; // pixels per frame
const CORNER_THRESHOLD = 5; // px tolerance for corner hit

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScreensaverProps {
  playerName: string;
  onDismiss: () => void;
}

interface BuzzwordItem {
  word: string;
  left: number; // percentage
  duration: number; // seconds
  delay: number; // seconds
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Screensaver({ playerName, onDismiss }: ScreensaverProps) {
  const { unlockAchievement } = useAchievementContext();
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 100, y: 100 });
  const velRef = useRef({
    vx: LOGO_SPEED * (Math.random() > 0.5 ? 1 : -1),
    vy: LOGO_SPEED * (Math.random() > 0.5 ? 1 : -1),
  });
  const colorIndexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const dismissedRef = useRef(false);

  // Generate stable buzzwords
  const buzzwords = useMemo<BuzzwordItem[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      word: BUZZWORDS[i % BUZZWORDS.length],
      left: Math.random() * 90 + 5,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -30,
    }));
  }, []);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismiss();
  }, [onDismiss]);

  // Dismiss on click or keypress
  useEffect(() => {
    const handleKey = () => handleDismiss();
    const handleClick = () => handleDismiss();
    // Small delay to prevent the click that triggers log off from also dismissing
    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }, 500);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [handleDismiss]);

  // "Screen Burned" achievement — 60 seconds watching
  useEffect(() => {
    const timer = setTimeout(() => {
      unlockAchievement('screen-burned');
    }, 60000);
    return () => clearTimeout(timer);
  }, [unlockAchievement]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const logo = logoRef.current;
      const container = containerRef.current;
      if (!logo || !container) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const pos = posRef.current;
      const vel = velRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const lw = logo.offsetWidth;
      const lh = logo.offsetHeight;

      // Move
      pos.x += vel.vx;
      pos.y += vel.vy;

      // Bounce
      let bounced = false;
      if (pos.x <= 0) { pos.x = 0; vel.vx = Math.abs(vel.vx); bounced = true; }
      if (pos.x + lw >= cw) { pos.x = cw - lw; vel.vx = -Math.abs(vel.vx); bounced = true; }
      if (pos.y <= 0) { pos.y = 0; vel.vy = Math.abs(vel.vy); bounced = true; }
      if (pos.y + lh >= ch) { pos.y = ch - lh; vel.vy = -Math.abs(vel.vy); bounced = true; }

      if (bounced) {
        colorIndexRef.current = (colorIndexRef.current + 1) % COLORS.length;
        logo.style.color = COLORS[colorIndexRef.current];

        // Corner detection
        const isAtLeft = pos.x <= CORNER_THRESHOLD;
        const isAtRight = pos.x + lw >= cw - CORNER_THRESHOLD;
        const isAtTop = pos.y <= CORNER_THRESHOLD;
        const isAtBottom = pos.y + lh >= ch - CORNER_THRESHOLD;
        const inCorner = (isAtLeft || isAtRight) && (isAtTop || isAtBottom);
        if (inCorner) unlockAchievement('corner-hunter');
      }

      logo.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [unlockAchievement]);

  const logoText = `${playerName}'s Agency`;

  return (
    <div ref={containerRef} className={styles.screensaver}>
      {/* Falling buzzwords */}
      {buzzwords.map((bw, i) => (
        <span
          key={i}
          className={styles.buzzword}
          style={{
            left: `${bw.left}%`,
            animationDuration: `${bw.duration}s`,
            animationDelay: `${bw.delay}s`,
          }}
        >
          {bw.word}
        </span>
      ))}

      {/* Bouncing logo */}
      <div
        ref={logoRef}
        className={styles.logo}
        style={{ color: COLORS[0] }}
      >
        {logoText}
      </div>

      {/* Hint */}
      <div className={styles.hint}>Click anywhere to wake up</div>
    </div>
  );
}
