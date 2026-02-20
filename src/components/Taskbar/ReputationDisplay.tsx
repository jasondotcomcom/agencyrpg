import { useEffect, useState } from 'react';
import { useReputationContext } from '../../context/ReputationContext';
import styles from './ReputationDisplay.module.css';

export default function ReputationDisplay() {
  const { state, clearReputationChange, getNextTier } = useReputationContext();
  const [showChange, setShowChange] = useState(false);
  const [displayedRep, setDisplayedRep] = useState(state.currentReputation);

  const nextTier = getNextTier();
  const progress = nextTier
    ? ((state.currentReputation - state.currentTier.minReputation) /
       (nextTier.minReputation - state.currentTier.minReputation)) * 100
    : 100;

  // Animate reputation changes
  useEffect(() => {
    if (state.recentReputationChange) {
      setShowChange(true);

      // Animate the number counting
      const target = state.currentReputation;
      const start = displayedRep;
      const diff = target - start;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplayedRep(Math.round(start + diff * eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);

      // Hide the change indicator after animation
      const timer = setTimeout(() => {
        setShowChange(false);
        clearReputationChange();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.recentReputationChange, state.currentReputation]);

  const changeAmount = state.recentReputationChange?.amount ?? 0;
  const isPositive = changeAmount > 0;

  return (
    <div className={styles.reputationDisplay}>
      <div className={styles.repIcon}>
        <svg viewBox="0 0 24 24" fill="none" className={styles.starIcon}>
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="url(#repGradient)"
            stroke="#A8E6CF"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="repGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A8E6CF" />
              <stop offset="100%" stopColor="#88C8D8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className={styles.repInfo}>
        <div className={styles.repNumber}>
          <span className={`${styles.value} ${showChange ? styles.animating : ''}`}>
            {displayedRep}
          </span>
          {showChange && (
            <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '+' : ''}{changeAmount}
            </span>
          )}
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className={styles.tooltip}>
        <div className={styles.tooltipTitle}>{state.currentTier.name}</div>
        <div className={styles.tooltipDesc}>{state.currentTier.description}</div>
        {nextTier && (
          <div className={styles.tooltipNext}>
            Next: {nextTier.name} ({nextTier.minReputation - state.currentReputation} more)
          </div>
        )}
      </div>
    </div>
  );
}
