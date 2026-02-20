import React from 'react';
import styles from './TitleBar.module.css';

interface TitleBarProps {
  title: string;
  appId: string;
  isActive: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

// Cute mini icons for the title bar
const appIcons: Record<string, React.ReactElement> = {
  inbox: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="4" y="8" width="16" height="12" rx="2" fill="#a8d8ea"/>
      <path d="M4 10 L12 15 L20 10" stroke="#7fc4dc" strokeWidth="1.5" fill="none"/>
      <rect x="17" y="5" width="2" height="8" rx="1" fill="#ff9a8b"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 6 C4 4 6 3 8 3 L16 3 C18 3 20 4 20 6 L20 14 C20 16 18 17 16 17 L10 17 L6 21 L6 17 C4 17 4 16 4 14 Z" fill="#ffb7b2"/>
      <circle cx="9" cy="10" r="1.5" fill="#fff"/>
      <circle cx="12" cy="10" r="1.5" fill="#fff"/>
      <circle cx="15" cy="10" r="1.5" fill="#fff"/>
    </svg>
  ),
  files: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 8 L3 19 C3 20 4 21 5 21 L19 21 C20 21 21 20 21 19 L21 10 C21 9 20 8 19 8 L12 8 L10 6 L5 6 C4 6 3 7 3 8 Z" fill="#ffeaa7"/>
      <path d="M12 14 L13 16 L15 16 L13.5 17.5 L14 19 L12 18 L10 19 L10.5 17.5 L9 16 L11 16 Z" fill="#ff9a8b"/>
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="14" rx="3" fill="#c3aed6"/>
      <rect x="5" y="6" width="14" height="10" rx="2" fill="#2d2d2d"/>
      <text x="7" y="13" fill="#a8e6cf" fontSize="6" fontFamily="monospace">&gt;_</text>
      <rect x="10" y="18" width="4" height="2" rx="0.5" fill="#a98fc4"/>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" fill="#ffeaa7"/>
      <circle cx="5" cy="7" r="1.5" fill="#ff9a8b"/>
      <circle cx="5" cy="12" r="1.5" fill="#ff9a8b"/>
      <circle cx="5" cy="17" r="1.5" fill="#ff9a8b"/>
      <rect x="8" y="7" width="8" height="1.5" rx="0.75" fill="#a8d8ea"/>
      <rect x="8" y="11" width="6" height="1.5" rx="0.75" fill="#c3aed6"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="#fff"/>
      <rect x="3" y="5" width="18" height="5" rx="2" fill="#a8e6cf"/>
      <rect x="7" y="3" width="2" height="5" rx="1" fill="#7ed3b2"/>
      <rect x="15" y="3" width="2" height="5" rx="1" fill="#7ed3b2"/>
      <circle cx="8" cy="15" r="2" fill="#ffb7b2"/>
      <circle cx="12" cy="15" r="2" fill="#e0e0e0"/>
      <circle cx="16" cy="15" r="2" fill="#a8d8ea"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#e8e8e8"/>
      <circle cx="12" cy="12" r="2.5" fill="#fff"/>
      <rect x="11" y="2" width="2" height="4" rx="1" fill="#c3aed6"/>
      <rect x="11" y="18" width="2" height="4" rx="1" fill="#c3aed6"/>
      <rect x="2" y="11" width="4" height="2" rx="1" fill="#a8d8ea"/>
      <rect x="18" y="11" width="4" height="2" rx="1" fill="#a8d8ea"/>
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 4 C4 4 12 3 12 3 C12 3 20 4 20 4 L20 20 C20 20 12 19 12 19 C12 19 4 20 4 20 Z" fill="#c3aed6"/>
      <path d="M12 3 L12 19" stroke="#a98fc4" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#ffeaa7"/>
      <text x="12" y="14" fill="#5a5a5a" fontSize="7" fontFamily="Quicksand" textAnchor="middle" fontWeight="bold">?</text>
    </svg>
  ),
};

export default function TitleBar({
  title,
  appId,
  isActive,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
  onMouseDown,
}: TitleBarProps) {
  return (
    <div
      className={`${styles.titleBar} ${isActive ? '' : styles.inactive} ${!isMaximized ? styles.draggable : ''}`}
      data-app={appId}
      onMouseDown={onMouseDown}
    >
      <div className={styles.icon}>
        {appIcons[appId] || appIcons.help}
      </div>
      <span className={styles.title}>{title}</span>
      <div className={styles.controls}>
        <button
          className={`${styles.controlButton} ${styles.minimizeButton}`}
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          title="Minimize"
        >
          <div className={styles.buttonIcon}>
            <div className={styles.minimizeIcon} />
          </div>
        </button>
        <button
          className={`${styles.controlButton} ${styles.maximizeButton}`}
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <div className={styles.buttonIcon}>
            {isMaximized ? (
              <div className={styles.restoreIcon} />
            ) : (
              <div className={styles.maximizeIcon} />
            )}
          </div>
        </button>
        <button
          className={`${styles.controlButton} ${styles.closeButton}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          <span className={styles.closeIcon}>×</span>
        </button>
      </div>
    </div>
  );
}
