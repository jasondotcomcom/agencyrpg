import { hapticTap } from '../../../utils/haptics';
import styles from './ProgressDots.module.css';

const LABELS = ['Brief', 'Team', 'Direction', 'Concepts', 'Build', 'Review', 'Submit'];

interface ProgressDotsProps {
  activeIndex: number;
  maxAccessible: number;
  totalCards: number;
  onNavigate: (index: number) => void;
}

export default function ProgressDots({ activeIndex, maxAccessible, totalCards, onNavigate }: ProgressDotsProps) {
  return (
    <div className={styles.container}>
      {Array.from({ length: totalCards }).map((_, i) => {
        const isActive = i === activeIndex;
        const isCompleted = i < activeIndex && i <= maxAccessible;
        const isLocked = i > maxAccessible;

        return (
          <button
            key={i}
            className={`${styles.dotBtn} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''} ${isLocked ? styles.locked : ''}`}
            onClick={() => {
              if (!isLocked && i !== activeIndex) {
                hapticTap();
                onNavigate(i);
              }
            }}
            disabled={isLocked}
            aria-label={`${LABELS[i]}${isActive ? ' (current)' : isLocked ? ' (locked)' : ''}`}
          >
            <span className={styles.dot} />
            {isActive && <span className={styles.label}>{LABELS[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}
