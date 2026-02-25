import { useState, useCallback } from 'react';
import { usePlayerContext } from '../../../context/PlayerContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useWindowContext } from '../../../context/WindowContext';
import { useReputationContext } from '../../../context/ReputationContext';
import { useChatContext } from '../../../context/ChatContext';
import { generateAgencyName, META_NAMES, HONEST_NAMES } from '../../../data/agencyNames';
import { NAMING_CHAT_RESPONSES } from '../../../data/agencyNamingEmail';
import type { NameCategory } from '../../../data/agencyNames';
import styles from './AgencyNamingApp.module.css';

export default function AgencyNamingApp() {
  const { setAgencyName, isAgencyNameDefault } = usePlayerContext();
  const { unlockAchievement, incrementCounter, getCounter } = useAchievementContext();
  const { closeWindow, addNotification, windows } = useWindowContext();
  const { addReputation } = useReputationContext();
  const { addMessage } = useChatContext();

  const [inputValue, setInputValue] = useState('');
  const [suggestion, setSuggestion] = useState<{ name: string; category: NameCategory; label: string } | null>(null);
  const [done, setDone] = useState(false);

  const generateCount = getCounter('agency-name-generates');

  const handleGenerate = useCallback(() => {
    const result = generateAgencyName();
    setSuggestion(result);
    setInputValue(result.name);
    incrementCounter('agency-name-generates');
  }, [incrementCounter]);

  const handleConfirm = useCallback(() => {
    const name = inputValue.trim();
    if (!name || name.length < 2 || name.length > 40) return;

    const isRebrand = !isAgencyNameDefault;
    const generates = getCounter('agency-name-generates');

    setAgencyName(name);
    setDone(true);

    // Achievements
    unlockAchievement('agency-founder');
    if (generates === 0) unlockAchievement('agency-confident');
    if (generates >= 20) unlockAchievement('agency-indecisive');
    if (isRebrand) unlockAchievement('agency-rebrand');
    if (META_NAMES.has(name)) unlockAchievement('agency-placeholder');
    if (HONEST_NAMES.has(name)) unlockAchievement('agency-honest');

    // Reputation
    let repBonus = 3; // Base bonus for custom name
    const cat = suggestion?.category;
    if (cat === 'pretentious' || cat === 'initials') repBonus += 1;
    if (cat === 'honest') repBonus += 2;
    if (isRebrand) {
      // Rebrand: small temporary hit but net positive after next campaign
      repBonus = 1;
    }
    addReputation(repBonus);

    // Toast
    const repText = repBonus > 0 ? ` (+${repBonus} REP)` : '';
    addNotification(
      `Welcome to ${name}`,
      `The agency has a name.${repText}`,
    );

    // Taylor chat response
    const pool = isRebrand
      ? NAMING_CHAT_RESPONSES.renamed
      : NAMING_CHAT_RESPONSES.custom;
    const taylorMsg = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      addMessage({
        id: `naming-taylor-${Date.now()}`,
        channel: 'general',
        authorId: 'pm',
        text: taylorMsg,
        timestamp: Date.now(),
        reactions: [],
        isRead: false,
      });
    }, 1500);

    // Close window after a moment
    setTimeout(() => {
      const win = Array.from(windows.values()).find(w => w.appId === 'agency-naming');
      if (win) closeWindow(win.id);
    }, 2500);
  }, [inputValue, isAgencyNameDefault, suggestion, getCounter, setAgencyName,
      unlockAchievement, addReputation, addNotification, addMessage, windows, closeWindow]);

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <div className={styles.successName}>{inputValue}</div>
          <div className={styles.successMessage}>
            It's official. Taylor is updating the letterhead.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>What do we call this thing?</h2>
      <p className={styles.subtitle}>
        Every great agency needs a name.<br />
        Type your own or try the generator.
      </p>

      <div className={styles.inputGroup}>
        <input
          className={styles.nameInput}
          type="text"
          placeholder="Type your own..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={40}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
        />
      </div>

      <span className={styles.divider}>— or try one of these —</span>

      <button className={styles.generateButton} onClick={handleGenerate}>
        <span>✨</span> Generate
      </button>

      {suggestion && (
        <div className={styles.suggestion}>
          <span className={styles.suggestedName}>{suggestion.name}</span>
          <span className={styles.categoryLabel}>{suggestion.label}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.useButton}
          disabled={!inputValue.trim() || inputValue.trim().length < 2}
          onClick={handleConfirm}
        >
          Use This Name
        </button>
        {suggestion && (
          <button className={styles.tryButton} onClick={handleGenerate}>
            Try Another
          </button>
        )}
      </div>

      {generateCount > 0 && (
        <span className={styles.counter}>
          {generateCount} name{generateCount !== 1 ? 's' : ''} generated
        </span>
      )}
    </div>
  );
}
