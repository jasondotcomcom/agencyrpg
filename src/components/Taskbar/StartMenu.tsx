import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerContext } from '../../context/PlayerContext';
import { useWindowContext } from '../../context/WindowContext';
import { useAchievementContext } from '../../context/AchievementContext';
import { emitSave } from '../../utils/saveSignal';
import styles from './StartMenu.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: () => void;
  submenu?: MenuItem[];
  separator?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StartMenu({ onClose }: { onClose: () => void }) {
  const { playerName, clearPlayerName } = usePlayerContext();
  const { focusOrOpenWindow, addNotification, windows } = useWindowContext();
  const { recordAppOpened } = useAchievementContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<'newgame' | 'logoff' | null>(null);
  const [copied, setCopied] = useState(false);
  const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close on click outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay so the open-click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const openApp = useCallback((appId: string, title: string) => {
    focusOrOpenWindow(appId, title);
    recordAppOpened(appId);
    onClose();
  }, [focusOrOpenWindow, recordAppOpened, onClose]);

  const handleSave = useCallback(() => {
    emitSave();
    addNotification('💾 Game Saved', 'Your progress has been saved.');
    onClose();
  }, [addNotification, onClose]);

  const handleNewGame = useCallback(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('agencyrpg_') || key.startsWith('agencyrpg-')) {
          localStorage.removeItem(key);
        }
      });
    } catch { /* non-fatal */ }
    window.location.reload();
  }, []);

  const handleLogOff = useCallback(() => {
    emitSave();
    // Small delay to let save complete, then clear player name to return to onboarding
    setTimeout(() => {
      if (clearPlayerName) clearPlayerName();
    }, 200);
    onClose();
  }, [clearPlayerName, onClose]);

  const shareUrl = 'https://agencyrpg.com';
  const shareText = "I've been running my own creative agency at agencyrpg.com — it's a browser-based sim game where you manage campaigns, pitch clients, and try not to let the intern burn down the office.";

  const handleShareLinkedIn = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  }, [onClose]);

  const handleShareTwitter = useCallback(() => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  }, [onClose]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback
      addNotification('📋 Link', shareUrl);
    });
  }, [addNotification]);

  // ── Recent Apps ─────────────────────────────────────────────────────────────

  const recentApps = Array.from(windows.values())
    .sort((a, b) => b.zIndex - a.zIndex)
    .slice(0, 5)
    .map(w => ({
      id: `recent-${w.appId}`,
      label: w.title,
      icon: getAppIcon(w.appId),
      action: () => openApp(w.appId, w.title),
    }));

  // ── All Apps ────────────────────────────────────────────────────────────────

  const allApps: MenuItem[] = [
    { id: 'all-inbox', label: 'Inbox', icon: '📧', action: () => openApp('inbox', 'Inbox') },
    { id: 'all-projects', label: 'Projects', icon: '📁', action: () => openApp('projects', 'Projects') },
    { id: 'all-portfolio', label: 'Portfolio', icon: '🖼️', action: () => openApp('portfolio', 'Portfolio') },
    { id: 'all-chat', label: 'Chat', icon: '💬', action: () => openApp('chat', 'Chat') },
    { id: 'all-terminal', label: 'Terminal', icon: '💻', action: () => openApp('terminal', 'Terminal') },
    { id: 'all-notes', label: 'Notes', icon: '📝', action: () => openApp('notes', 'Notes') },
    { id: 'all-calendar', label: 'Calendar', icon: '📅', action: () => openApp('calendar', 'Calendar') },
    { id: 'all-settings', label: 'Settings', icon: '⚙️', action: () => openApp('settings', 'Settings') },
    { id: 'all-help', label: 'Help', icon: '❓', action: () => openApp('help', 'Help') },
  ];

  // ── Submenu hover handling ──────────────────────────────────────────────────

  const handleSubmenuEnter = useCallback((id: string) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    setActiveSubmenu(id);
  }, []);

  const handleSubmenuLeave = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => setActiveSubmenu(null), 200);
  }, []);

  // ── Confirmation dialogs ────────────────────────────────────────────────────

  if (showConfirm) {
    const isNewGame = showConfirm === 'newgame';
    return (
      <div ref={menuRef} className={styles.menu}>
        <div className={styles.confirmDialog}>
          <div className={styles.confirmIcon}>{isNewGame ? '🔄' : '👋'}</div>
          <div className={styles.confirmTitle}>
            {isNewGame ? 'Start New Game?' : 'Log Off?'}
          </div>
          <div className={styles.confirmText}>
            {isNewGame
              ? 'All progress will be lost. This cannot be undone.'
              : 'Your game will be saved. You can pick up where you left off.'}
          </div>
          <div className={styles.confirmButtons}>
            <button
              className={styles.confirmCancel}
              onClick={() => setShowConfirm(null)}
            >
              Cancel
            </button>
            <button
              className={isNewGame ? styles.confirmDanger : styles.confirmOk}
              onClick={isNewGame ? handleNewGame : handleLogOff}
            >
              {isNewGame ? 'Reset Everything' : 'Log Off'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── About modal ─────────────────────────────────────────────────────────────

  return (
    <div ref={menuRef} className={styles.menu}>
      {/* Player header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>👤</div>
        <div className={styles.headerName}>{playerName || 'Player'}</div>
      </div>

      <div className={styles.separator} />

      {/* Search */}
      <button className={styles.item} onClick={() => openApp('notes', 'Notes')}>
        <span className={styles.itemIcon}>🔍</span>
        <span className={styles.itemLabel}>Search</span>
      </button>

      {/* Recent Apps */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('recent')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>🕐</span>
        <span className={styles.itemLabel}>Recent Apps</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'recent' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('recent')} onMouseLeave={handleSubmenuLeave}>
            {recentApps.length > 0 ? recentApps.map(app => (
              <button key={app.id} className={styles.item} onClick={app.action}>
                <span className={styles.itemIcon}>{app.icon}</span>
                <span className={styles.itemLabel}>{app.label}</span>
              </button>
            )) : (
              <div className={styles.submenuEmpty}>No recent apps</div>
            )}
          </div>
        )}
      </div>

      {/* All Apps */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('allapps')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>📱</span>
        <span className={styles.itemLabel}>All Apps</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'allapps' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('allapps')} onMouseLeave={handleSubmenuLeave}>
            {allApps.map(app => (
              <button key={app.id} className={styles.item} onClick={app.action}>
                <span className={styles.itemIcon}>{app.icon}</span>
                <span className={styles.itemLabel}>{app.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.separator} />

      {/* Programs (Easter Eggs) */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('programs')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>🎮</span>
        <span className={styles.itemLabel}>Programs</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'programs' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('programs')} onMouseLeave={handleSubmenuLeave}>
            <button className={styles.item} onClick={() => openApp('solitaire', 'Solitaire')}>
              <span className={styles.itemIcon}>🃏</span>
              <span className={styles.itemLabel}>Solitaire</span>
            </button>
            <button className={styles.item} onClick={() => openApp('minesweeper', 'Minesweeper')}>
              <span className={styles.itemIcon}>💣</span>
              <span className={styles.itemLabel}>Minesweeper</span>
            </button>
            <button className={styles.item} onClick={() => openApp('skifree', 'SkiFree')}>
              <span className={styles.itemIcon}>⛷️</span>
              <span className={styles.itemLabel}>SkiFree</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings */}
      <button className={styles.item} onClick={() => openApp('settings', 'Settings')}>
        <span className={styles.itemIcon}>⚙️</span>
        <span className={styles.itemLabel}>Settings</span>
      </button>

      {/* Achievements */}
      <button className={styles.item} onClick={() => openApp('notes', 'Achievements')}>
        <span className={styles.itemIcon}>🏆</span>
        <span className={styles.itemLabel}>Achievements</span>
      </button>

      {/* Help */}
      <button className={styles.item} onClick={() => openApp('help', 'Help')}>
        <span className={styles.itemIcon}>❓</span>
        <span className={styles.itemLabel}>Help</span>
      </button>

      {/* About */}
      <button className={styles.item} onClick={() => openApp('about', 'About Agency RPG')}>
        <span className={styles.itemIcon}>ℹ️</span>
        <span className={styles.itemLabel}>About</span>
      </button>

      <div className={styles.separator} />

      {/* Share Game */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('share')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>📤</span>
        <span className={styles.itemLabel}>Share Game</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'share' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('share')} onMouseLeave={handleSubmenuLeave}>
            <button className={styles.item} onClick={handleShareLinkedIn}>
              <span className={styles.itemIcon}>💼</span>
              <span className={styles.itemLabel}>LinkedIn</span>
            </button>
            <button className={styles.item} onClick={handleShareTwitter}>
              <span className={styles.itemIcon}>🐦</span>
              <span className={styles.itemLabel}>Twitter / X</span>
            </button>
            <button className={styles.item} onClick={handleCopyLink}>
              <span className={styles.itemIcon}>{copied ? '✅' : '🔗'}</span>
              <span className={styles.itemLabel}>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Save Game */}
      <button className={styles.item} onClick={handleSave}>
        <span className={styles.itemIcon}>💾</span>
        <span className={styles.itemLabel}>Save Game</span>
      </button>

      {/* New Game */}
      <button className={styles.item} onClick={() => setShowConfirm('newgame')}>
        <span className={styles.itemIcon}>🔄</span>
        <span className={styles.itemLabel}>New Game</span>
      </button>

      {/* Log Off */}
      <button className={styles.item} onClick={() => setShowConfirm('logoff')}>
        <span className={styles.itemIcon}>🚪</span>
        <span className={styles.itemLabel}>Log Off</span>
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAppIcon(appId: string): string {
  const icons: Record<string, string> = {
    inbox: '📧', projects: '📁', portfolio: '🖼️', chat: '💬',
    terminal: '💻', notes: '📝', calendar: '📅', settings: '⚙️',
    help: '❓', solitaire: '🃏', minesweeper: '💣', skifree: '⛷️',
  };
  return icons[appId] || '📄';
}
