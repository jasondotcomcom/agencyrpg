import React, { useEffect, useState } from 'react';
import type { ReputationTier } from '../../types/reputation';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  tier: ReputationTier;
  reputation: number;
  onClose: () => void;
}

export default function LevelUpModal({
  tier,
  reputation,
  onClose,
}: LevelUpModalProps): React.ReactElement {
  const [showContent, setShowContent] = useState(false);
  const [showUnlocks, setShowUnlocks] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowContent(true), 500),
      setTimeout(() => setShowUnlocks(true), 1200),
      setTimeout(() => setShowButton(true), 2000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.particles}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              '--x': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 2}s`,
              '--duration': `${2 + Math.random() * 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={styles.modal}>
        <div className={styles.celebration}>
          <span className={styles.emoji}>🎉</span>
          <span className={styles.emoji}>✨</span>
          <span className={styles.emoji}>🎉</span>
        </div>

        <h1 className={styles.title}>AGENCY LEVEL UP!</h1>

        {showContent && (
          <div className={`${styles.content} ${styles.fadeIn}`}>
            <div className={styles.reputationBadge}>
              <span className={styles.reputationLabel}>REPUTATION</span>
              <span className={styles.reputationValue}>{reputation}</span>
            </div>

            <div className={styles.tierSection}>
              <p className={styles.reachedText}>You've reached:</p>
              <h2 className={styles.tierName}>{tier.name}</h2>
              <p className={styles.tierDescription}>{tier.description}</p>
            </div>
          </div>
        )}

        {showUnlocks && (
          <div className={`${styles.unlocks} ${styles.fadeIn}`}>
            <h3 className={styles.unlocksTitle}>Unlocked:</h3>
            <ul className={styles.unlocksList}>
              {tier.unlocks.map((unlock, index) => (
                <li
                  key={index}
                  className={styles.unlockItem}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <span className={styles.checkmark}>✓</span>
                  {unlock}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showButton && (
          <button
            className={`${styles.continueButton} ${styles.fadeIn}`}
            onClick={onClose}
          >
            Let's Go!
          </button>
        )}
      </div>
    </div>
  );
}
