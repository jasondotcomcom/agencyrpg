import React from 'react';
import type { WindowState } from '../../types';
import { useWindowContext } from '../../context/WindowContext';
import styles from './TaskbarButton.module.css';

// Small cute icons for taskbar
const appIcons: Record<string, React.ReactElement> = {
  inbox: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="3" y="6" width="14" height="10" rx="2" fill="#a8d8ea"/>
      <path d="M3 8 L10 12 L17 8" stroke="#7fc4dc" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 5 C3 3.5 4.5 2.5 6 2.5 L14 2.5 C15.5 2.5 17 3.5 17 5 L17 11 C17 12.5 15.5 13.5 14 13.5 L8 13.5 L5 17 L5 13.5 C3.5 13.5 3 12.5 3 11 Z" fill="#ffb7b2"/>
      <circle cx="7" cy="8" r="1" fill="#fff"/>
      <circle cx="10" cy="8" r="1" fill="#fff"/>
      <circle cx="13" cy="8" r="1" fill="#fff"/>
    </svg>
  ),
  files: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M2 6 L2 15 C2 16 3 17 4 17 L16 17 C17 17 18 16 18 15 L18 8 C18 7 17 6 16 6 L10 6 L8 4 L4 4 C3 4 2 5 2 6 Z" fill="#ffeaa7"/>
      <path d="M10 11 L11 13 L13 13 L11.5 14.5 L12 16 L10 15 L8 16 L8.5 14.5 L7 13 L9 13 Z" fill="#ff9a8b"/>
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="12" rx="2" fill="#c3aed6"/>
      <rect x="4" y="5" width="12" height="8" rx="1" fill="#2d2d2d"/>
      <text x="6" y="11" fill="#a8e6cf" fontSize="5" fontFamily="monospace">&gt;_</text>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="4" y="2" width="12" height="16" rx="2" fill="#ffeaa7"/>
      <circle cx="4" cy="6" r="1" fill="#ff9a8b"/>
      <circle cx="4" cy="10" r="1" fill="#ff9a8b"/>
      <circle cx="4" cy="14" r="1" fill="#ff9a8b"/>
      <rect x="7" y="6" width="6" height="1" rx="0.5" fill="#a8d8ea"/>
      <rect x="7" y="9" width="4" height="1" rx="0.5" fill="#c3aed6"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="14" rx="2" fill="#fff"/>
      <rect x="2" y="4" width="16" height="4" rx="2" fill="#a8e6cf"/>
      <rect x="6" y="2" width="2" height="4" rx="1" fill="#7ed3b2"/>
      <rect x="12" y="2" width="2" height="4" rx="1" fill="#7ed3b2"/>
      <circle cx="7" cy="13" r="1.5" fill="#ffb7b2"/>
      <circle cx="10" cy="13" r="1.5" fill="#e0e0e0"/>
      <circle cx="13" cy="13" r="1.5" fill="#a8d8ea"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" fill="#e8e8e8"/>
      <circle cx="10" cy="10" r="2" fill="#fff"/>
      <rect x="9" y="1" width="2" height="3" rx="1" fill="#c3aed6"/>
      <rect x="9" y="16" width="2" height="3" rx="1" fill="#c3aed6"/>
      <rect x="1" y="9" width="3" height="2" rx="1" fill="#a8d8ea"/>
      <rect x="16" y="9" width="3" height="2" rx="1" fill="#a8d8ea"/>
    </svg>
  ),
  help: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 3 C3 3 10 2 10 2 C10 2 17 3 17 3 L17 17 C17 17 10 16 10 16 C10 16 3 17 3 17 Z" fill="#c3aed6"/>
      <circle cx="10" cy="10" r="3" fill="#ffeaa7"/>
      <text x="10" y="12" fill="#5a5a5a" fontSize="5" fontFamily="Quicksand" textAnchor="middle" fontWeight="bold">?</text>
    </svg>
  ),
};

interface TaskbarButtonProps {
  window: WindowState;
}

export default function TaskbarButton({ window: windowState }: TaskbarButtonProps) {
  const { activeWindowId, focusWindow, restoreWindow } = useWindowContext();

  const isActive = activeWindowId === windowState.id && !windowState.isMinimized;

  const handleClick = () => {
    if (windowState.isMinimized) {
      restoreWindow(windowState.id);
    } else {
      focusWindow(windowState.id);
    }
  };

  return (
    <button
      className={`${styles.taskbarButton} ${isActive ? styles.active : ''} ${windowState.isMinimized ? styles.minimized : ''}`}
      data-app={windowState.appId}
      onClick={handleClick}
    >
      <div className={styles.icon}>
        {appIcons[windowState.appId] || appIcons.help}
      </div>
      <span className={styles.title}>{windowState.title}</span>
    </button>
  );
}
