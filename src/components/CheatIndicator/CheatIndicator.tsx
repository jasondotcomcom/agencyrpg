import React from 'react';
import { useCheatContext } from '../../context/CheatContext';
import styles from './CheatIndicator.module.css';

interface ActiveCheat {
  id: string;
  label: string;
}

export default function CheatIndicator(): React.ReactElement | null {
  const { cheat } = useCheatContext();

  const activeCheats: ActiveCheat[] = [];

  if (cheat.minScore > 0) {
    activeCheats.push({ id: 'minscore', label: `🛡️ Min Score: ${cheat.minScore}` });
  }
  if (cheat.oneTimeMinScore > 0) {
    activeCheats.push({ id: 'onetimescore', label: `🎤 Next: ${cheat.oneTimeMinScore}+` });
  }
  if (cheat.scoreBonus > 0) {
    activeCheats.push({ id: 'scorebonus', label: `➕ Score +${cheat.scoreBonus}` });
  }
  if (cheat.nightmareMode) {
    activeCheats.push({ id: 'nightmare', label: '😈 Nightmare Mode' });
  }
  if (cheat.bigHeadMode) {
    activeCheats.push({ id: 'bighead', label: '🎈 Big Head Mode' });
  }
  if (cheat.hrWatcherActive) {
    activeCheats.push({ id: 'hrwatcher', label: '👔 HR is Watching' });
  }

  if (activeCheats.length === 0) return null;

  return (
    <div className={styles.indicator} aria-label="Active cheats">
      <span className={styles.header}>🎮 CHEATS ACTIVE</span>
      <ul className={styles.list}>
        {activeCheats.map(c => (
          <li key={c.id} className={styles.item}>{c.label}</li>
        ))}
      </ul>
    </div>
  );
}
