import React, { useState } from 'react';
import { useAchievementContext } from '../../context/AchievementContext';
import { loadLegacy } from '../Ending/EndingSequence';
import styles from './OnboardingScreen.module.css';

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps): React.ReactElement {
  const legacy = loadLegacy();
  const runNumber = legacy ? legacy.playthroughCount + 1 : 1;
  const [playerName, setPlayerName] = useState(legacy?.playerName ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const { unlockAchievement } = useAchievementContext();

  const handleSubmit = () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) return;
    unlockAchievement('founded-agency');
    onComplete(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={styles.screen}>
      {legacy && (
        <div className={styles.welcomeBack}>
          <span className={styles.runBadge}>Run #{runNumber}</span>
          <p className={styles.welcomeBackText}>
            Welcome back, {legacy.playerName}. Ready to do it all again?
          </p>
        </div>
      )}

      <div className={styles.document}>
        <div className={styles.documentHeader}>
          <span className={styles.seal} aria-hidden="true">⚖️</span>
          <h1 className={styles.title}>ARTICLES OF INCORPORATION</h1>
        </div>

        <div className={styles.documentBody}>
          <p>This document hereby establishes a new creative advertising agency to be led by the undersigned.</p>
          <p>The founding <strong>Creative Director</strong> agrees to:</p>
          <ul className={styles.list}>
            <li>Pursue creative excellence</li>
            <li>Manage client relationships</li>
            <li>Lead a team of talented misfits</li>
            <li>Never make the logo bigger*</li>
          </ul>
          <p className={styles.finePrint}>* unless absolutely necessary</p>
        </div>

        <div className={styles.signatureSection}>
          <label htmlFor="signature" className={styles.signatureLabel}>Signature:</label>
          <input
            id="signature"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sign your name"
            className={`${styles.signatureInput} ${isTyping ? styles.signatureInputActive : ''}`}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            autoComplete="off"
            autoFocus
            maxLength={30}
            aria-label="Sign your name to found the agency"
          />
        </div>

        <button
          className={styles.foundButton}
          onClick={handleSubmit}
          disabled={playerName.trim().length < 2}
        >
          FOUND MY AGENCY
        </button>
      </div>
    </div>
  );
}
