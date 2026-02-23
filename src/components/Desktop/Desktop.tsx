import { useState, useCallback, useMemo } from 'react';
import type { DesktopIcon as DesktopIconType } from '../../types';
import { useWindowContext } from '../../context/WindowContext';
import { useEmailContext } from '../../context/EmailContext';
import { useChatContext } from '../../context/ChatContext';
import { useAchievementContext } from '../../context/AchievementContext';
import { usePortfolioContext } from '../../context/PortfolioContext';
import { useTerminalTools } from '../../hooks/useTerminalTools';
import DesktopIcon from './DesktopIcon';
import ContextMenu from './ContextMenu';
import styles from './Desktop.module.css';

const defaultIcons: DesktopIconType[] = [
  { id: 'icon-inbox', label: 'Inbox', icon: 'inbox', appId: 'inbox' },
  { id: 'icon-projects', label: 'Projects', icon: 'projects', appId: 'projects' },
  { id: 'icon-portfolio', label: 'Portfolio', icon: 'portfolio', appId: 'portfolio' },
  { id: 'icon-chat', label: 'Chat', icon: 'chat', appId: 'chat' },
  { id: 'icon-terminal', label: 'Terminal', icon: 'terminal', appId: 'terminal' },
  { id: 'icon-notes', label: 'Notes', icon: 'notes', appId: 'notes' },
  { id: 'icon-calendar', label: 'Calendar', icon: 'calendar', appId: 'calendar' },
  { id: 'icon-settings', label: 'Settings', icon: 'settings', appId: 'settings' },
  { id: 'icon-help', label: 'Help', icon: 'help', appId: 'help' },
];

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  iconId: string | null;
}

export default function Desktop() {
  const { focusOrOpenWindow } = useWindowContext();
  const { getUnreadCount } = useEmailContext();
  const { getUnreadCount: getChatUnreadCount } = useChatContext();
  const { recordAppOpened, unlockAchievement } = useAchievementContext();
  const { entries: portfolioEntries } = usePortfolioContext();
  const terminalTools = useTerminalTools();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const unreadCount = getUnreadCount();
  const chatUnreadCount = getChatUnreadCount();

  // Merge built tools as desktop icons
  const allIcons = useMemo<DesktopIconType[]>(() => {
    const toolIcons: DesktopIconType[] = terminalTools.map(t => ({
      id: `icon-tool-${t.id}`,
      label: t.name.replace(/_/g, ' '),
      icon: `tool:${t.icon}`,
      appId: `tool:${t.id}`,
    }));
    return [...defaultIcons, ...toolIcons];
  }, [terminalTools]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    iconId: null,
  });

  const handleIconClick = useCallback((iconId: string) => {
    setSelectedIcon(iconId);
  }, []);

  const handleIconDoubleClick = useCallback((icon: DesktopIconType) => {
    focusOrOpenWindow(icon.appId, icon.label);
    // Track app opens for Explorer achievement
    recordAppOpened(icon.appId);
    // Checked portfolio while empty
    if (icon.appId === 'portfolio' && portfolioEntries.length === 0) {
      unlockAchievement('checked-portfolio-empty');
    }
  }, [focusOrOpenWindow, recordAppOpened, unlockAchievement, portfolioEntries]);

  const handleContextMenu = useCallback((e: React.MouseEvent, iconId: string | null) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      iconId,
    });
    if (iconId) {
      setSelectedIcon(iconId);
    }
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleDesktopClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIcon(null);
    }
    handleCloseContextMenu();
  }, [handleCloseContextMenu]);

  const handleOpenFromContext = useCallback(() => {
    if (contextMenu.iconId) {
      const icon = allIcons.find(i => i.id === contextMenu.iconId);
      if (icon) {
        focusOrOpenWindow(icon.appId, icon.label);
      }
    }
    handleCloseContextMenu();
  }, [contextMenu.iconId, allIcons, focusOrOpenWindow, handleCloseContextMenu]);

  return (
    <div
      className={styles.desktop}
      onClick={handleDesktopClick}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      <div className={styles.iconGrid}>
        {allIcons.map(icon => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            isSelected={selectedIcon === icon.id}
            badgeCount={
              icon.appId === 'inbox' ? unreadCount :
              icon.appId === 'chat' ? chatUnreadCount :
              undefined
            }
            onClick={() => handleIconClick(icon.id)}
            onDoubleClick={() => handleIconDoubleClick(icon)}
            onContextMenu={(e) => handleContextMenu(e, icon.id)}
          />
        ))}
      </div>

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasIcon={contextMenu.iconId !== null}
          onOpen={handleOpenFromContext}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
