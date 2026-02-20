import { useEffect, useState } from 'react';
import { useAgencyFunds } from '../../context/AgencyFundsContext';
import { formatBudget } from '../../types/campaign';
import styles from './AgencyFundsDisplay.module.css';

export default function AgencyFundsDisplay() {
  const { state, clearChange } = useAgencyFunds();
  const [showChange, setShowChange] = useState(false);
  const [displayedFunds, setDisplayedFunds] = useState(state.totalFunds);

  // Animate funds changes
  useEffect(() => {
    if (state.recentChange) {
      setShowChange(true);

      const target = state.totalFunds;
      const start = displayedFunds;
      const diff = target - start;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayedFunds(Math.round(start + diff * eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);

      const timer = setTimeout(() => {
        setShowChange(false);
        clearChange();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.recentChange, state.totalFunds]);

  const changeAmount = state.recentChange?.amount ?? 0;

  return (
    <div className={styles.fundsDisplay}>
      <div className={styles.fundsIcon}>$</div>
      <div className={styles.fundsInfo}>
        <div className={styles.fundsNumber}>
          <span className={`${styles.value} ${showChange ? styles.animating : ''}`}>
            {formatBudget(displayedFunds)}
          </span>
          {showChange && (
            <span className={styles.change}>
              +{formatBudget(changeAmount)}
            </span>
          )}
        </div>
        <div className={styles.fundsLabel}>Agency Funds</div>
      </div>
    </div>
  );
}
