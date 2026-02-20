import React, { useState, useEffect, useCallback } from 'react';
import { useAchievementContext, ACHIEVEMENT_DEFS } from '../../../context/AchievementContext';
import { loadLegacy } from '../../Ending/EndingSequence';
import styles from './NotesApp.module.css';

type Tab = 'achievements' | 'notes' | 'legacy';

const NOTES_STORAGE_KEY = 'agencyrpg-player-notes';

function loadNotes(): string {
  try { return localStorage.getItem(NOTES_STORAGE_KEY) ?? ''; } catch { return ''; }
}

function saveNotes(value: string) {
  try { localStorage.setItem(NOTES_STORAGE_KEY, value); } catch { /* non-fatal */ }
}

export default function NotesApp(): React.ReactElement {
  const { unlockedAchievements, unlockAchievement, incrementCounter } = useAchievementContext();
  const [activeTab, setActiveTab] = useState<Tab>('achievements');
  const [notes, setNotes] = useState(loadNotes);
  const legacy = loadLegacy();

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    saveNotes(e.target.value);
  };

  const checkAchievementMilestones = useCallback(() => {
    // Achievement hunter: viewed tab 10 times
    const views = incrementCounter('achievement-hunter-views');
    if (views >= 10) unlockAchievement('achievement-hunter');

    // Halfway there
    const half = Math.ceil(ACHIEVEMENT_DEFS.length / 2);
    if (unlockedAchievements.length >= half) unlockAchievement('half-achievements');

    // Completionist
    if (unlockedAchievements.length >= ACHIEVEMENT_DEFS.length) unlockAchievement('all-achievements');
  }, [incrementCounter, unlockAchievement, unlockedAchievements]);

  // Count a view on mount (default tab is achievements)
  useEffect(() => {
    checkAchievementMilestones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'achievements') checkAchievementMilestones();
  };

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENT_DEFS.length;
  const lockedDefs = ACHIEVEMENT_DEFS.filter(a => !unlockedAchievements.includes(a.id));
  const unlockedDefs = ACHIEVEMENT_DEFS.filter(a => unlockedAchievements.includes(a.id));

  return (
    <div className={styles.notesApp}>
      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        <button
          className={`${styles.tab} ${activeTab === 'achievements' ? styles.activeTab : ''}`}
          role="tab"
          aria-selected={activeTab === 'achievements'}
          onClick={() => handleTabSwitch('achievements')}
        >
          🏅 Achievements
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notes' ? styles.activeTab : ''}`}
          role="tab"
          aria-selected={activeTab === 'notes'}
          onClick={() => handleTabSwitch('notes')}
        >
          📝 My Notes
        </button>
        {legacy && (
          <button
            className={`${styles.tab} ${activeTab === 'legacy' ? styles.activeTab : ''}`}
            role="tab"
            aria-selected={activeTab === 'legacy'}
            onClick={() => handleTabSwitch('legacy')}
          >
            🏅 Legacy
          </button>
        )}
      </div>

      {/* Achievements tab */}
      {activeTab === 'achievements' && (
        <div className={styles.achievementsTab} role="tabpanel">
          <div className={styles.achievementsHeader}>
            <h2 className={styles.achievementsTitle}>Achievements</h2>
            <span className={styles.achievementsCount}>
              {unlockedCount} / {totalCount} Discovered
            </span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          <div className={styles.achievementsScroll}>
            {/* Discovered section */}
            {unlockedDefs.length > 0 && (
              <>
                <div className={styles.sectionLabel}>DISCOVERED ({unlockedDefs.length})</div>
                <div className={styles.achievementsGrid}>
                  {unlockedDefs.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`${styles.achievementCard} ${styles.unlocked}`}
                      aria-label={`${achievement.name}: ${achievement.description}`}
                    >
                      <span className={styles.achievementIcon}>{achievement.icon}</span>
                      <div className={styles.achievementInfo}>
                        <p className={styles.achievementName}>{achievement.name}</p>
                        <p className={styles.achievementDesc}>{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Undiscovered section */}
            {lockedDefs.length > 0 && (
              <>
                <div className={styles.sectionLabel}>
                  UNDISCOVERED ({lockedDefs.length})
                </div>
                <div className={styles.lockedGrid}>
                  {lockedDefs.map(achievement => (
                    <div
                      key={achievement.id}
                      className={styles.lockedBadge}
                      aria-label="Locked achievement"
                      title="???"
                    >
                      🔒
                    </div>
                  ))}
                </div>
              </>
            )}

            {unlockedDefs.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔒</span>
                <p className={styles.emptyText}>No achievements discovered yet.</p>
                <p className={styles.emptyHint}>Play the game — they unlock on their own.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div className={styles.notesTab} role="tabpanel">
          <h2 className={styles.notesTitle}>My Notes</h2>
          <textarea
            className={styles.notesTextarea}
            value={notes}
            onChange={handleNotesChange}
            placeholder="Jot down brief ideas, strategies, cheat codes you've found... 🤫"
            aria-label="Personal notes"
            spellCheck={false}
          />
          <p className={styles.notesMeta}>{notes.length} characters</p>
        </div>
      )}

      {/* Legacy tab */}
      {activeTab === 'legacy' && legacy && (
        <div className={styles.legacyTab} role="tabpanel">
          <div className={styles.legacyCard}>
            <div className={styles.legacyHeading}>🏅 Previous Run</div>
            <div className={styles.legacyName}>As {legacy.playerName}</div>
            <ul className={styles.legacyStats}>
              <li>{legacy.totalCampaigns} campaign{legacy.totalCampaigns !== 1 ? 's' : ''} completed</li>
              <li>{legacy.totalAwards} award{legacy.totalAwards !== 1 ? 's' : ''} won</li>
              <li>Best score: {legacy.bestScore}</li>
              <li>Revenue: ${legacy.totalRevenue.toLocaleString()}</li>
            </ul>
            <div className={styles.legacyMeta}>
              {legacy.endingType === 'hostile' ? 'Hostile takeover' : 'Voluntary exit'}
              {' · '}
              {new Date(legacy.completionDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </div>
            {legacy.playthroughCount > 1 && (
              <div className={styles.legacyCount}>
                Playthrough #{legacy.playthroughCount}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
