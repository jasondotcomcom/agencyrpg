import React, { useState, useEffect, useRef } from 'react';
import { useCheatContext } from '../../context/CheatContext';
import { useConductContext } from '../../context/ConductContext';
import styles from './HRWatcher.module.css';

const THOUGHT_BUBBLES = [
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

export default function HRWatcher(): React.ReactElement | null {
  const { cheat } = useCheatContext();
  const { warningLevel } = useConductContext();
  const isActive = cheat.hrWatcherActive || warningLevel >= 1;
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animIdRef = useRef<number>(0);
  const [thoughtIndex, setThoughtIndex] = useState(0);

  // Smooth cursor follow
  useEffect(() => {
    if (!isActive) return;

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
  }, [isActive]);

  // Rotate thought bubbles
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setThoughtIndex(i => (i + 1) % THOUGHT_BUBBLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

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
        {THOUGHT_BUBBLES[thoughtIndex]}
      </div>
    </div>
  );
}
