import { useState } from 'react';
import { hapticTap } from '../../../utils/haptics';
import styles from './AchievementBadgeGrid.module.css';

interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface AchievementBadgeGridProps {
  achievements: AchievementDef[];
  unlockedIds: string[];
}

export default function AchievementBadgeGrid({ achievements, unlockedIds }: AchievementBadgeGridProps) {
  const [flippedId, setFlippedId] = useState<string | null>(null);

  // Sort: unlocked first, then locked
  const sorted = [...achievements].sort((a, b) => {
    const aUnlocked = unlockedIds.includes(a.id) ? 0 : 1;
    const bUnlocked = unlockedIds.includes(b.id) ? 0 : 1;
    return aUnlocked - bUnlocked;
  });

  const handleTap = (id: string) => {
    hapticTap();
    setFlippedId(prev => prev === id ? null : id);
  };

  return (
    <div className={styles.grid}>
      {sorted.map(achievement => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        const isFlipped = flippedId === achievement.id;

        return (
          <button
            key={achievement.id}
            className={styles.badge}
            onClick={() => handleTap(achievement.id)}
            aria-label={isUnlocked ? `${achievement.name}: ${achievement.description}` : 'Locked achievement'}
          >
            <div className={`${styles.inner} ${isFlipped ? styles.flipped : ''}`}>
              <div className={`${styles.front} ${isUnlocked ? styles.unlocked : styles.locked}`}>
                <span className={styles.icon}>{isUnlocked ? achievement.icon : '🔒'}</span>
              </div>
              <div className={`${styles.back} ${isUnlocked ? styles.backUnlocked : styles.backLocked}`}>
                <span className={styles.backName}>{isUnlocked ? achievement.name : '???'}</span>
                <span className={styles.backDesc}>{isUnlocked ? achievement.description : 'Keep playing...'}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
