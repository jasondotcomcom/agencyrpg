import { useState, useCallback } from 'react';
import { useWindowContext } from '../../context/WindowContext';
import TaskbarButton from './TaskbarButton';
import Clock from './Clock';
import ReputationDisplay from './ReputationDisplay';
import AgencyFundsDisplay from './AgencyFundsDisplay';
import SaveIndicator from './SaveIndicator';
import StartMenu from './StartMenu';
import { loadLegacy } from '../Ending/EndingSequence';
import { usePlayerContext } from '../../context/PlayerContext';
import styles from './Taskbar.module.css';

export default function Taskbar() {
  const { windows } = useWindowContext();
  const { agencyName } = usePlayerContext();
  const legacy = loadLegacy();
  const [menuOpen, setMenuOpen] = useState(false);

  const windowList = Array.from(windows.values());

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent StartMenu's outside-click handler from catching this
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <div className={styles.taskbar}>
      <button className={`${styles.startButton} ${menuOpen ? styles.startButtonActive : ''}`} onMouseDown={toggleMenu}>
        <div className={styles.startLogo}>
          <svg viewBox="0 0 24 24" fill="none">
            {/* Cute star/sparkle logo */}
            <circle cx="12" cy="12" r="10" fill="url(#startGradient)"/>
            <path d="M12 6 L13.5 10.5 L18 10.5 L14.5 13.5 L16 18 L12 15 L8 18 L9.5 13.5 L6 10.5 L10.5 10.5 Z" fill="#fff"/>
            <defs>
              <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a8e6cf"/>
                <stop offset="50%" stopColor="#a8d8ea"/>
                <stop offset="100%" stopColor="#c3aed6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span>{agencyName}</span>
      </button>

      {menuOpen && <StartMenu onClose={closeMenu} />}

      <div className={styles.windowButtons}>
        {windowList.map(win => (
          <TaskbarButton key={win.id} window={win} />
        ))}
      </div>

      <div className={styles.systemTray}>
        <SaveIndicator />
        {legacy && (
          <div
            className={styles.ngBadge}
            title={`New Game+ — Run #${legacy.playthroughCount + 1}`}
          >
            NG+
          </div>
        )}
        <AgencyFundsDisplay />
        <ReputationDisplay />
        <Clock />
      </div>
    </div>
  );
}
