import React from 'react';
import styles from './HelpToast.module.css';

interface HelpToastProps {
  phase: 'concepting' | 'generating';
  onHelp: () => void;
  onDismiss: () => void;
}

export default function HelpToast({ phase, onHelp, onDismiss }: HelpToastProps): React.ReactElement {
  const isConcepting = phase === 'concepting';
  return (
    <div className={styles.toast}>
      <div className={styles.header}>
        <span className={styles.emoji}>{isConcepting ? '💡' : '🎨'}</span>
        <span className={styles.title}>Want to help?</span>
      </div>
      <p className={styles.subtitle}>
        {isConcepting
          ? 'Team is brainstorming — you can pitch in!'
          : 'Team is building deliverables — jump in!'}
      </p>
      <button className={styles.helpButton} onClick={onHelp}>
        {isConcepting ? '💡 Help with Concepting' : '🎨 Help with Production'}
      </button>
      <button className={styles.dismissButton} onClick={onDismiss}>
        Maybe later
      </button>
    </div>
  );
}
